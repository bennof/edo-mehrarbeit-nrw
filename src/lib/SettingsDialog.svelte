<script lang="ts">
  import { data, settings, setPersist } from '$lib/store.svelte';
  import ProfileFields from '$lib/ProfileFields.svelte';
  import { FORM_URL } from '$lib/form';
  import { template, loadTemplate } from '$lib/template.svelte';
  import { buildShareHash } from '$lib/prefill';
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
      </fieldset>

      <fieldset>
        <legend>Formularvorlage</legend>
        <label>
          Blanko-Erklärung LBV(A/Bes)23
          <span class="source">
            <input readonly value={FORM_URL} onfocus={(e) => e.currentTarget.select()} />
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
            <a href={FORM_URL} target="_blank" rel="noopener">Quelle öffnen</a>
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
      <button
        type="button"
        class="secondary"
        aria-expanded={sharing}
        onclick={share}
      >
        Link teilen
      </button>
      <button class="primary">Fertig</button>
    </div>
  </form>
</dialog>
