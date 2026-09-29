<script lang="ts">
  // Tagesnachweis wie Anlage 1 zu BASS 21-22 Nr. 21: je Woche (Mo–Fr) Ist, Soll und die in den
  // Iststunden enthaltenen anrechenbaren Ausfallstunden. Mehrarbeit = Ist − Soll.
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { totalsOf, weeksOf, type Week } from './days';
  import { data, newSchedule } from './store.svelte';
  import type { DayHours, Month } from './types';

  let { month }: { month: Month } = $props();

  const ROWS: { key: keyof DayHours; label: string; title: string }[] = [
    { key: 'ist', label: 'Ist', title: 'Iststunden' },
    { key: 'soll', label: 'Soll', title: 'Sollstunden' },
    {
      key: 'ausfall',
      label: 'Ausf.',
      title: 'In den Iststunden enthaltene anrechenbare Ausfallstunden'
    }
  ];

  const weeks = $derived(weeksOf(month.month));
  const totals = $derived(totalsOf(month.days));
  const transferable = $derived(
    totals.filled &&
      totals.mehrarbeit >= 0 &&
      Number.isInteger(totals.mehrarbeit) &&
      totals.mehrarbeit !== month.hours
  );
  const pad = (n: number) => String(n).padStart(2, '0');

  /**
   * Stundenplan in Wochen einsetzen (nur Tage dieses Monats): Soll wird überschrieben,
   * Ist nur vorbelegt, solange dort noch nichts eingetragen ist
   */
  function applySchedule(scheduleId: string, target: Week[]) {
    const plan = data.schedules.find((x) => x.id === scheduleId);
    if (!plan) return;
    for (const week of target)
      week.days.forEach((d, i) => {
        if (d.day === null) return;
        const value = String(plan.soll[i] ?? '');
        set(d.day, 'soll', value);
        if (month.days?.[d.day]?.ist == null) set(d.day, 'ist', value);
      });
  }

  // Auswahl nach dem Einsetzen zurücksetzen, damit derselbe Plan erneut gewählt werden kann
  function pick(e: Event & { currentTarget: HTMLSelectElement }, target: Week[]) {
    applySchedule(e.currentTarget.value, target);
    e.currentTarget.value = '';
  }

  function set(day: number, key: keyof DayHours, raw: string) {
    const days = (month.days ??= {});
    const d = (days[day] ??= {});
    const n = Number(raw.replace(',', '.'));
    if (raw.trim() === '' || !Number.isFinite(n) || n < 0) delete d[key];
    else d[key] = n;
    if (!Object.keys(d).length) delete days[day];
  }
</script>

<fieldset class="days">
  <legend>Nachweis nach Tagen</legend>
  <p class="hint">
    Wie Anlage 1 zum Mehrarbeitserlass. Ausfallstunden sind ausgefallene Pflichtstunden, die als
    Iststunden zählen – sie sind in „Ist“ schon enthalten.
  </p>

  {#if data.schedules.length}
    <label class="days-fill">
      Soll- und Iststunden für den ganzen Monat aus
      <select onchange={(e) => pick(e, weeks)}>
        <option value="">Stundenplan wählen …</option>
        {#each data.schedules as plan (plan.id)}
          <option value={plan.id}>{plan.name || 'Ohne Namen'}</option>
        {/each}
      </select>
    </label>
  {:else}
    <p class="hint">
      Tipp: Mit einem Stundenplan lassen sich Soll- und Iststunden ganzer Wochen vorausfüllen.
      <button
        type="button"
        class="link"
        onclick={() => goto(resolve('/schedule/[id]', { id: newSchedule().id }))}
        >Stundenplan anlegen</button
      >
    </p>
  {/if}

  <div class="days-scroll">
    <table>
      {#each weeks as week (week.kw)}
        <tbody>
          <tr class="days-head">
            <th class="kw" rowspan={data.schedules.length ? 5 : 4} scope="rowgroup"
              >KW<br />{week.kw}</th
            >
            <td></td>
            {#each week.days as d (d.weekday)}
              <th scope="col" class:out={d.day === null}>
                {d.weekday}{#if d.day !== null}<small>{pad(d.day)}.</small>{/if}
              </th>
            {/each}
          </tr>
          {#each ROWS as row (row.key)}
            <tr>
              <th scope="row" title={row.title}>{row.label}</th>
              {#each week.days as d (d.weekday)}
                <td>
                  {#if d.day !== null}
                    {@const day = d.day}
                    <input
                      type="number"
                      inputmode="decimal"
                      min="0"
                      max="24"
                      step="1"
                      aria-label="{row.title} am {pad(day)}."
                      value={month.days?.[day]?.[row.key] ?? ''}
                      onchange={(e) => set(day, row.key, e.currentTarget.value)}
                    />
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
          {#if data.schedules.length}
            <tr>
              <th scope="row" title="Soll- und leere Iststunden dieser Woche aus einem Stundenplan"
                >Plan</th
              >
              <td colspan="5">
                <select class="days-week-fill" onchange={(e) => pick(e, [week])}>
                  <option value="">Aus Stundenplan …</option>
                  {#each data.schedules as plan (plan.id)}
                    <option value={plan.id}>{plan.name || 'Ohne Namen'}</option>
                  {/each}
                </select>
              </td>
            </tr>
          {/if}
        </tbody>
      {/each}
    </table>
  </div>

  <dl class="days-totals">
    <div>
      <dt>Iststunden</dt>
      <dd>{totals.ist.toLocaleString('de-DE')}</dd>
    </div>
    <div>
      <dt>Sollstunden</dt>
      <dd>{totals.soll.toLocaleString('de-DE')}</dd>
    </div>
    <div>
      <dt>davon Ausfallstunden</dt>
      <dd>{totals.ausfall.toLocaleString('de-DE')}</dd>
    </div>
    <div class="result">
      <dt>Geleistete Mehrarbeitsstunden</dt>
      <dd>{totals.mehrarbeit.toLocaleString('de-DE')}</dd>
    </div>
  </dl>
  <!-- Nur auf Klick: Die Tagesliste überschreibt den oben eingetragenen Wert nie von selbst -->
  <div class="days-transfer">
    <span class="hint">
      {#if !totals.filled}
        Noch keine Tage eingetragen.
      {:else if totals.mehrarbeit < 0}
        Weniger Ist- als Sollstunden – keine Mehrarbeit in diesem Monat.
      {:else if !Number.isInteger(totals.mehrarbeit)}
        Das Formular nimmt nur ganze Stunden an.
      {:else if totals.mehrarbeit === month.hours}
        ✓ Stimmt mit den Mehrarbeitsstunden oben überein.
      {:else}
        Oben stehen {month.hours ?? 0} Stunden.
      {/if}
    </span>
    <button
      type="button"
      class="secondary"
      disabled={!transferable}
      onclick={() => (month.hours = totals.mehrarbeit)}
    >
      Übertragen
    </button>
  </div>
</fieldset>
