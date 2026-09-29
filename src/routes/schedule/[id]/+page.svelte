<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { data } from '$lib/store.svelte';

  const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

  const s = $derived(data.schedules.find((x) => x.id === page.params.id));
  const total = $derived(s ? s.soll.reduce((a, b) => a + (b || 0), 0) : 0);

  function remove() {
    if (!s) return;
    data.schedules = data.schedules.filter((x) => x !== s);
    goto(resolve('/'));
  }
</script>

<section class="content">
  {#if s}
    <h1>{s.name || 'Stundenplan'}</h1>
    <div class="panel">
      <label>Name <input bind:value={s.name} placeholder="z. B. 1. Halbjahr 2026/27" /></label>
      <fieldset>
        <legend>Sollstunden je Wochentag</legend>
        <div class="schedule-days">
          {#each WEEKDAYS as day, i (day)}
            <label>
              {day}
              <input type="number" min="0" max="24" step="1" bind:value={s.soll[i]} />
            </label>
          {/each}
        </div>
        <p class="hint">
          Zusammen {total.toLocaleString('de-DE')} Stunden pro Woche. In der Monatsansicht lässt sich
          der Plan für jede Woche einsetzen: als Sollstunden und in noch leere Iststunden.
        </p>
      </fieldset>
      <div class="actions left">
        <button class="secondary danger" onclick={remove}>Stundenplan löschen</button>
      </div>
    </div>
  {:else}
    <p class="empty">Stundenplan nicht gefunden.</p>
  {/if}
</section>
