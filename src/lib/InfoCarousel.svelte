<script lang="ts">
  // Hinweise abwechselnd anzeigen. Alle liegen übereinander im selben Rasterfeld,
  // damit die Höhe beim Wechsel nicht springt.
  import { dateLabel } from './format';
  import type { Info } from './info';

  let { items }: { items: Info[] } = $props();

  const INTERVAL = 8000;
  let index = $state(0);
  let paused = $state(false);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $effect(() => {
    if (items.length < 2 || paused || reducedMotion) return;
    const timer = setInterval(() => (index = (index + 1) % items.length), INTERVAL);
    return () => clearInterval(timer);
  });
</script>

<section
  class="info"
  aria-roledescription="Karussell"
  aria-label="Hinweise"
  onmouseenter={() => (paused = true)}
  onmouseleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <div class="info-slides">
    {#each items as item, i (i)}
      <article class="info-slide" class:active={i === index} inert={i !== index}>
        <div class="info-head">
          <h2>{item.title}</h2>
          <time datetime={item.date}>{dateLabel(item.date)}</time>
        </div>
        <!-- Inhalt stammt aus der eigenen info.json, nicht von Nutzern -->
        <div class="info-body">{@html item.body}</div>
      </article>
    {/each}
  </div>

  {#if items.length > 1}
    <div class="info-dots">
      {#each items as item, i (i)}
        <button
          aria-label="Hinweis {i + 1} von {items.length}: {item.title}"
          aria-current={i === index}
          onclick={() => (index = i)}
        ></button>
      {/each}
    </div>
  {/if}
</section>
