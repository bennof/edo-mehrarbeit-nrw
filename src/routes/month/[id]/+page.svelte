<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { data, monthLabel, dateLabel, declarationOf } from '$lib/store.svelte';
  import MonthDays from '$lib/MonthDays.svelte';
  import { buildAnlage1Pdf } from '$lib/pdf';
  import { PdfPreview } from '$lib/pdfPreview.svelte';
  import PdfToolbar from '$lib/PdfToolbar.svelte';

  const m = $derived(data.months.find((x) => x.id === page.params.id));
  const taken = $derived(m && data.months.some((x) => x !== m && x.month === m.month));
  const declaredIn = $derived(m && declarationOf(m.id));

  // Nachweis über geleistete Mehrarbeit (Anlage 1) für diesen Monat
  const pdf = new PdfPreview();
  function preview() {
    const month = m;
    if (month)
      pdf.open(
        () => buildAnlage1Pdf(data.profile, month),
        `Nachweis_Mehrarbeit_${month.month}.pdf`
      );
  }

  // Beim Wechsel zu einem anderen Monat alte Vorschau verwerfen
  $effect(() => {
    page.params.id;
    return () => pdf.close();
  });

  function remove() {
    if (!m) return;
    pdf.close();
    const id = m.id;
    data.months = data.months.filter((x) => x !== m);
    for (const d of data.declarations) d.monthIds = d.monthIds.filter((x) => x !== id);
    goto(resolve('/'));
  }
</script>

<section class="content">
  {#if m}
    <h1>{monthLabel(m.month)}</h1>
    {#if pdf.url}
      <object class="pdf" data={pdf.url} type="application/pdf" title="PDF-Vorschau">
        <p class="hint">Dein Browser zeigt keine PDF-Vorschau an. Lade die Datei herunter.</p>
      </object>
    {:else}
      <div class="panel">
        {#if declaredIn}
          <p class="hint">
            Abgerechnet in der
            <a class="badge" href={resolve('/declaration/[id]', { id: declaredIn.id })}
              >Erklärung vom {dateLabel(declaredIn.date)}</a
            > – für weitere Erklärungen gesperrt.
          </p>
        {/if}
        <label>Monat <input id="month" type="month" required bind:value={m.month} /></label>
        {#if taken}<p class="error">Diesen Monat gibt es schon.</p>{/if}
        <label
          >Mehrarbeitsstunden <input
            id="hours"
            type="number"
            min="0"
            max="999"
            step="1"
            bind:value={m.hours}
          /></label
        >
        <label class="check">
          <input id="belowThreshold" type="checkbox" bind:checked={m.belowThreshold} />
          Vergütung unterhalb der Bagatellgrenze (Merkmal „V“)
        </label>
        <p class="hint">Das Formular nimmt nur ganze Stunden an.</p>
        <MonthDays month={m} />
        <div class="actions left">
          <button class="secondary danger" onclick={remove}>Monat löschen</button>
        </div>
      </div>
    {/if}
    {#if pdf.error}<p class="error">{pdf.error}</p>{/if}
  {:else}
    <p class="empty">Monat nicht gefunden.</p>
  {/if}
</section>

{#if m}
  <div class="bottom-bar">
    {#if pdf.url}
      <PdfToolbar preview={pdf} />
    {:else}
      <button class="primary" disabled={pdf.busy} onclick={preview}>
        {pdf.busy ? 'Erzeuge …' : 'Nachweis (Anlage 1)'}
      </button>
    {/if}
  </div>
{/if}
