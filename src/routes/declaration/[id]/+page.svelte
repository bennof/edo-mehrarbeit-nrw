<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { data, byMonth, monthLabel, dateLabel, declarationOf } from '$lib/store.svelte';
  import { buildPdf } from '$lib/pdf';
  import ProfileFields from '$lib/ProfileFields.svelte';
  import type { Month, Profile } from '$lib/types';

  const MAX = 6; // Abschnitt A hat 6 Zeilen

  // Pflichtangaben im Formularkopf
  const REQUIRED: [keyof Profile, string][] = [
    ['office', 'Dienststelle'],
    ['schoolNumber', 'Schulnummer'],
    ['lastName', 'Name'],
    ['firstName', 'Vorname'],
    ['birthDate', 'Geburtsdatum'],
    ['lbvNumber', 'LBV-Personalnummer']
  ];

  const d = $derived(data.declarations.find((x) => x.id === page.params.id));
  const months = $derived([...data.months].sort(byMonth));
  const selected = $derived(months.filter((m) => d?.monthIds.includes(m.id)));
  const missing = $derived(
    REQUIRED.filter(([key]) => !String(data.profile[key]).trim()).map(([, label]) => label)
  );

  let pdfUrl = $state<string | null>(null);
  let pdfFile = $state<File | null>(null);
  let busy = $state(false);
  let error = $state('');

  const fileName = $derived(`Mehrarbeit_${d?.date ?? ''}.pdf`);
  // System-Teilen (Handy: Drucken, Dateien, Mail …) nur anbieten, wenn der Browser Dateien teilen kann
  const canShare = $derived(!!pdfFile && !!navigator.canShare?.({ files: [pdfFile] }));
  let printFrame = $state<HTMLIFrameElement>();

  function toggleMonth(m: Month) {
    if (!d) return;
    d.monthIds = d.monthIds.includes(m.id)
      ? d.monthIds.filter((x) => x !== m.id)
      : [...d.monthIds, m.id];
    closePreview();
  }

  async function preview() {
    if (!d) return;
    busy = true;
    error = '';
    try {
      closePreview();
      const blob = await buildPdf(data.profile, selected, d);
      pdfFile = new File([blob], fileName, { type: 'application/pdf' });
      pdfUrl = URL.createObjectURL(blob);
    } catch (e) {
      error = `PDF konnte nicht erzeugt werden: ${e instanceof Error ? e.message : e}`;
    }
    busy = false;
  }

  function closePreview() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl = null;
    pdfFile = null;
  }

  async function share() {
    if (!pdfFile) return;
    try {
      await navigator.share({ files: [pdfFile], title: fileName });
    } catch (e) {
      // Abbrechen im Teilen-Menü ist kein Fehler
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        error = `Teilen fehlgeschlagen: ${e instanceof Error ? e.message : e}`;
      }
    }
  }

  // Unsichtbarer Frame mit dem PDF; wo der Browser das nicht drucken kann, PDF in neuem Tab öffnen
  function print() {
    try {
      printFrame?.contentWindow?.print();
    } catch {
      window.open(pdfUrl!, '_blank');
    }
  }

  function remove() {
    closePreview();
    data.declarations = data.declarations.filter((x) => x !== d);
    goto(resolve('/'));
  }

  // Beim Wechsel zu einer anderen Erklärung alte Vorschau verwerfen
  $effect(() => {
    page.params.id;
    return closePreview;
  });
</script>

<section class="content">
  {#if d}
    <h1>Erklärung vom {dateLabel(d.date)}</h1>

    {#if pdfUrl}
      <object class="pdf" data={pdfUrl} type="application/pdf" title="PDF-Vorschau">
        <p class="hint">Dein Browser zeigt keine PDF-Vorschau an. Lade die Datei herunter.</p>
      </object>
    {:else}
      <div class="panel">
        <label>Datum <input type="date" bind:value={d.date} /></label>

        <p class="label">Monate ({selected.length}/{MAX})</p>
        {#each months as m (m.id)}
          {@const on = d.monthIds.includes(m.id)}
          {@const other = declarationOf(m.id, d.id)}
          <label class="check" class:locked={other && !on}>
            <input
              type="checkbox"
              checked={on}
              disabled={!on && (!!other || selected.length >= MAX)}
              onchange={() => toggleMonth(m)}
            />
            {monthLabel(m.month)} <small>{m.hours} Std.{m.belowThreshold ? ' · V' : ''}</small>
            {#if other}
              <a class="badge" href={resolve('/declaration/[id]', { id: other.id })}>
                {on ? 'auch' : 'bereits'} in Erklärung vom {dateLabel(other.date)}
              </a>
            {/if}
          </label>
        {:else}
          <p class="empty">Noch keine Monate erfasst.</p>
        {/each}

        <details class="head" open={missing.length > 0}>
          <summary>
            Kopfdaten
            <small>
              {missing.length
                ? `fehlt: ${missing.join(', ')}`
                : `${data.profile.firstName} ${data.profile.lastName}`}
            </small>
          </summary>
          <p class="hint">
            Gelten für alle Erklärungen und werden in den Einstellungen gespeichert.
          </p>
          <ProfileFields profile={data.profile} />
        </details>

        <label>
          Bemerkungen
          <textarea rows="3" bind:value={d.remarks}></textarea>
        </label>

        <div class="actions left">
          <button class="secondary danger" onclick={remove}>Erklärung löschen</button>
        </div>
      </div>
    {/if}
    {#if error}<p class="error">{error}</p>{/if}
  {:else}
    <p class="empty">Erklärung nicht gefunden.</p>
  {/if}
</section>

{#if d}
  <div class="bottom-bar">
    {#if pdfUrl}
      <button class="secondary" onclick={closePreview}>Bearbeiten</button>
      <span class="spacer"></span>
      <button class="tool" title="Drucken" aria-label="Drucken" onclick={print}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
          />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      </button>
      <a
        class="tool"
        title="Herunterladen"
        aria-label="Herunterladen"
        href={pdfUrl}
        download={fileName}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </a>
      {#if canShare}
        <button class="tool primary" title="Teilen" aria-label="Teilen" onclick={share}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
        </button>
      {/if}
      <iframe class="print-frame" bind:this={printFrame} src={pdfUrl} title="Druckansicht"></iframe>
    {:else}
      <button class="primary" disabled={busy || !selected.length} onclick={preview}>
        {busy ? 'Erzeuge …' : 'Vorschau'}
      </button>
    {/if}
  </div>
{/if}
