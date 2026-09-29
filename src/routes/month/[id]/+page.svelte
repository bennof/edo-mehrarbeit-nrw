<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { data, monthLabel, dateLabel, declarationOf } from '$lib/store.svelte';

  const m = $derived(data.months.find((x) => x.id === page.params.id));
  const taken = $derived(m && data.months.some((x) => x !== m && x.month === m.month));
  const declaredIn = $derived(m && declarationOf(m.id));

  function remove() {
    if (!m) return;
    const id = m.id;
    data.months = data.months.filter((x) => x !== m);
    for (const d of data.declarations) d.monthIds = d.monthIds.filter((x) => x !== id);
    goto('/');
  }
</script>

<section class="content">
  {#if m}
    <h1>{monthLabel(m.month)}</h1>
    <div class="panel">
      {#if declaredIn}
        <p class="hint">
          Abgerechnet in der
          <a class="badge" href="/declaration/{declaredIn.id}"
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
      <div class="actions left">
        <button class="secondary danger" onclick={remove}>Monat löschen</button>
      </div>
    </div>
  {:else}
    <p class="empty">Monat nicht gefunden.</p>
  {/if}
</section>
