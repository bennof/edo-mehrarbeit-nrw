<script lang="ts">
  import { data, settings, setPersist } from '$lib/store.svelte';
  import ProfileFields from '$lib/ProfileFields.svelte';
  import { template, loadTemplate } from '$lib/template.svelte';
  import { buildShareHash } from '$lib/prefill';
  import { exportJson, importJson } from '$lib/backup';
  import { base } from '$app/paths';
  import { tick } from 'svelte';

  let { open = $bindable(false) } = $props();
  let dlg: HTMLDialogElement;

  const sizeLabel = (bytes = 0) => `${Math.round(bytes / 1024).toLocaleString('de-DE')} KB`;

  $effect(() => (open ? dlg.showModal() : dlg?.close()));

  // Link zur App mit den Angaben der Dienststelle im Hash – der Server sieht davon nichts
  const shareUrl = $derived(`${location.origin}${base}/${buildShareHash(data.profile)}`);
  let sharing = $state(false);
  let copied = $state(false);
  let shareBox = $state<HTMLElement>();
  let renderSVG = $state<typeof import('uqr').renderSVG>();
  const qr = $derived(renderSVG?.(shareUrl, { ecc: 'M', border: 2 }));

  async function share() {
    sharing = !sharing;
    if (!sharing) return;
    // QR-Bibliothek erst bei Bedarf laden
    renderSVG ??= (await import('uqr')).renderSVG;
    await tick();
    shareBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      prompt('Link kopieren:', shareUrl);
    }
  }

  // Sicherung einlesen: ersetzt alle Daten, daher vorher nachfragen
  let backupMsg = $state<{ ok: boolean; text: string }>();
  async function restore(e: Event & { currentTarget: HTMLInputElement }) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = ''; // dieselbe Datei erneut wählbar
    if (!file) return;
    if (!confirm('Alle aktuellen Daten durch die Sicherung ersetzen?')) return;
    try {
      await importJson(file);
      backupMsg = { ok: true, text: `✓ Sicherung „${file.name}“ eingelesen.` };
    } catch (err) {
      backupMsg = { ok: false, text: err instanceof Error ? err.message : String(err) };
    }
  }

  // Beim Schließen des Dialogs wieder einklappen
  $effect(() => {
    if (!open) sharing = false;
  });
</script>

<dialog bind:this={dlg} class="dialog" onclose={() => (open = false)}>
  <form method="dialog">
    <h2>Einstellungen</h2>

    <!-- Nur dieser Bereich scrollt, damit die Scrollbar nicht in die runden Ecken läuft -->
    <div class="dialog-body">
      <ProfileFields profile={data.profile} />

      <fieldset>
        <legend>Daten</legend>
        <label class="check">
          <input
            id="persist"
            type="checkbox"
            checked={settings.persist}
            onchange={(e) => setPersist(e.currentTarget.checked)}
          />
          Daten in diesem Browser speichern
        </label>
        <p class="hint">
          Beim Abschalten werden die gespeicherten Daten sofort gelöscht. Die aktuelle Sitzung
          bleibt erhalten, bis du das Fenster schließt.
        </p>
        <p class="hint">
          Gespeichert wird nur lokal in diesem Browser auf diesem Gerät – es gibt keine Kopie auf
          einem Server. Die Daten gehen verloren, wenn du Browserdaten löschst, im privaten Modus
          arbeitest oder der Browser selten genutzte Seiten aufräumt (Safari z. B. nach einigen
          Wochen ohne Besuch). Lade daher regelmäßig eine Sicherung herunter.
        </p>
        <div class="backup">
          <button type="button" class="secondary" onclick={exportJson}
            >Sicherung herunterladen</button
          >
          <label class="secondary file">
            Sicherung einlesen
            <input type="file" accept="application/json,.json" onchange={restore} />
          </label>
        </div>
        {#if backupMsg}
          <p class={backupMsg.ok ? 'hint ok' : 'error'}>{backupMsg.text}</p>
        {/if}
      </fieldset>

      <fieldset>
        <legend>Formularvorlage</legend>
        <label>
          Blanko-Erklärung LBV(A/Bes)23
          <span class="source">
            <input readonly value={template.source} onfocus={(e) => e.currentTarget.select()} />
            <button
              type="button"
              class="secondary"
              class:ok={template.status === 'ok'}
              class:fail={template.status === 'fail'}
              disabled={template.status === 'loading'}
              onclick={() => loadTemplate(true).catch(() => {})}
            >
              {template.status === 'loading' ? 'Prüfe …' : 'Prüfen'}
            </button>
          </span>
        </label>
        {#if template.status === 'ok'}
          <p class="hint ok">✓ Vorlage geladen und geprüft ({sizeLabel(template.size)}).</p>
        {:else if template.status === 'fail'}
          <p class="error">
            Vorlage nicht verfügbar: {template.error}.
            <a href={template.source} target="_blank" rel="noopener">Quelle öffnen</a>
          </p>
        {/if}
      </fieldset>

      {#if sharing}
        <fieldset bind:this={shareBox}>
          <legend>Link teilen</legend>
          <p class="hint">
            Der Link enthält die Angaben der Dienststelle, aber keine persönlichen Daten. Wer ihn
            öffnet, bekommt die App damit vorbelegt.
          </p>
          <div class="qr">
            {#if qr}{@html qr}{/if}
          </div>
          <span class="source">
            <input readonly value={shareUrl} onfocus={(e) => e.currentTarget.select()} />
            <button type="button" class="secondary" class:ok={copied} onclick={copy}>
              {copied ? '✓ Kopiert' : 'Kopieren'}
            </button>
          </span>
        </fieldset>
      {/if}
    </div>

    <div class="actions">
      <button type="button" class="secondary" aria-expanded={sharing} onclick={share}>
        Link teilen
      </button>
      <button class="primary">Fertig</button>
    </div>
  </form>
</dialog>
