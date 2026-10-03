<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { data, byMonth, monthLabel, dateLabel, declarationOf } from '$lib/store.svelte';
  import { buildPdf } from '$lib/pdf';
  import { PdfPreview } from '$lib/pdfPreview.svelte';
  import PdfToolbar from '$lib/PdfToolbar.svelte';
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

  const pdf = new PdfPreview();
  const fileName = $derived(`Mehrarbeit_${d?.date ?? ''}.pdf`);

  function toggleMonth(m: Month) {
    if (!d) return;
    d.monthIds = d.monthIds.includes(m.id)
      ? d.monthIds.filter((x) => x !== m.id)
      : [...d.monthIds, m.id];
    pdf.close();
  }

  function preview() {
    if (d) pdf.open(() => buildPdf(data.profile, selected, d), fileName);
  }

  function remove() {
    pdf.close();
    data.declarations = data.declarations.filter((x) => x !== d);
    goto(resolve('/'));
  }

  // Beim Wechsel zu einer anderen Erklärung alte Vorschau verwerfen
  $effect(() => {
    page.params.id;
    return () => pdf.close();
  });
</script>

<section class="content">
  {#if d}
    <h1>Erklärung vom {dateLabel(d.date)}</h1>

    {#if pdf.url}
      <object class="pdf" data={pdf.url} type="application/pdf" title="PDF-Vorschau">
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
    {#if pdf.error}<p class="error">{pdf.error}</p>{/if}
  {:else}
    <p class="empty">Erklärung nicht gefunden.</p>
  {/if}
</section>

{#if d}
  <div class="bottom-bar">
    {#if pdf.url}
      <PdfToolbar preview={pdf} />
    {:else}
      <button class="primary" disabled={pdf.busy || !selected.length} onclick={preview}>
        {pdf.busy ? 'Erzeuge …' : 'Vorschau'}
      </button>
    {/if}
  </div>
{/if}
