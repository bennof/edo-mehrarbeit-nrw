<script lang="ts">
  import { resolve } from '$app/paths';
  import '../app.css';
  import { page } from '$app/state';
  import { afterNavigate, goto, replaceState } from '$app/navigation';
  import {
    data,
    newMonth,
    newDeclaration,
    newSchedule,
    byMonth,
    monthLabel,
    dateLabel,
    declarationOf,
    prefilled
  } from '$lib/store.svelte';
  import SettingsDialog from '$lib/SettingsDialog.svelte';
  import { loadTemplate } from '$lib/template.svelte';
  import { onMount } from 'svelte';
  import type { Declaration } from '$lib/types';

  let { children } = $props();

  // Desktop: Sidebar ein-/ausklappen. Mobil: als Drawer über dem Inhalt.
  let open = $state(true);
  let mobileOpen = $state(false);
  let settingsOpen = $state(false);

  // Formularvorlage schon im Hintergrund laden, damit die Vorschau später sofort bereitsteht.
  // Fehler zeigt die Vorschau bzw. „Prüfen“ in den Einstellungen.
  onMount(() => {
    loadTemplate().catch(() => {});
  });

  // Nach dem Start: Hash mit den Link-Daten (vom Store übernommen) aus der Adresse entfernen
  // und die Einstellungen zeigen. Nicht in onMount: Dort läuft der Router noch nicht und
  // replaceState wirft einen Fehler.
  afterNavigate(({ type }) => {
    if (type !== 'enter' || !prefilled) return;
    replaceState(page.url.pathname + page.url.search, page.state);
    settingsOpen = true;
  });

  const months = $derived([...data.months].sort(byMonth).reverse());

  function toggle() {
    if (matchMedia('(max-width: 768px)').matches) mobileOpen = !mobileOpen;
    else open = !open;
  }

  // Kurzbeschreibung einer Erklärung: Zeitraum der gewählten Monate
  function span(d: Declaration) {
    const ms = data.months.filter((m) => d.monthIds.includes(m.id)).sort(byMonth);
    if (!ms.length) return 'keine Monate';
    const a = monthLabel(ms[0].month),
      b = monthLabel(ms[ms.length - 1].month);
    return a === b ? a : `${a} – ${b}`;
  }

  // Nach Navigation auf Mobil den Drawer schließen
  $effect(() => {
    page.url.pathname;
    mobileOpen = false;
  });
</script>

<div class="app" class:collapsed={!open}>
  <aside class="sidebar" class:mobile-open={mobileOpen}>
    <div class="sidebar-top">
      <button
        class="new"
        onclick={() => goto(resolve('/declaration/[id]', { id: newDeclaration().id }))}
        >＋ Neue Erklärung</button
      >
    </div>
    <nav>
      <p class="label">Verlauf</p>
      {#each data.declarations as d (d.id)}
        <a
          class="item"
          class:active={page.params.id === d.id}
          href={resolve('/declaration/[id]', { id: d.id })}
        >
          {dateLabel(d.date)} <small>{span(d)}</small>
        </a>
      {:else}
        <p class="empty">Noch keine Erklärung</p>
      {/each}

      <button class="new sub" onclick={() => goto(resolve('/month/[id]', { id: newMonth().id }))}
        >＋ Neuer Monat</button
      >
      <p class="label">Monate</p>
      {#each months as m (m.id)}
        <a
          class="item"
          class:active={page.params.id === m.id}
          href={resolve('/month/[id]', { id: m.id })}
        >
          {monthLabel(m.month)}
          <small
            >{m.hours} Std.{m.belowThreshold ? ' · V' : ''}{declarationOf(m.id)
              ? ' · ✓'
              : ''}</small
          >
        </a>
      {:else}
        <p class="empty">Noch kein Monat erfasst</p>
      {/each}

      <button
        class="new sub"
        onclick={() => goto(resolve('/schedule/[id]', { id: newSchedule().id }))}
        >＋ Neuer Stundenplan</button
      >
      <p class="label">Stundenpläne</p>
      {#each data.schedules as s (s.id)}
        <a
          class="item"
          class:active={page.params.id === s.id}
          href={resolve('/schedule/[id]', { id: s.id })}
        >
          {s.name || 'Ohne Namen'}
          <small>{s.soll.reduce((a, b) => a + (b || 0), 0)} Std./Woche</small>
        </a>
      {:else}
        <p class="empty">Noch kein Stundenplan</p>
      {/each}
    </nav>
    <div class="sidebar-bottom">
      <button class="account" onclick={() => (settingsOpen = true)}>⚙ Einstellungen</button>
    </div>
  </aside>

  {#if mobileOpen}
    <button class="backdrop" aria-label="Menü schließen" onclick={() => (mobileOpen = false)}
    ></button>
  {/if}

  <main>
    <header>
      <button class="icon" aria-label="Seitenleiste umschalten" onclick={toggle}>☰</button>
      <a class="title" href={resolve('/')}>Mehrarbeit NRW</a>
    </header>
    {@render children()}
  </main>
</div>

<SettingsDialog bind:open={settingsOpen} />
