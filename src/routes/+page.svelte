<script lang="ts">
  import { goto } from '$app/navigation';
  import { newDeclaration, newMonth } from '$lib/store.svelte';
  import { loadInfo } from '$lib/info';
  import InfoCarousel from '$lib/InfoCarousel.svelte';

  let info = $state<Awaited<ReturnType<typeof loadInfo>>>([]);
  $effect(() => {
    loadInfo().then((list) => (info = list));
  });
</script>

<section class="content">
  {#if info.length}<InfoCarousel items={info} />{/if}

  <h1>Mehrarbeit abrechnen</h1>
  <p class="lead">
    Mehrarbeit als Lehrkraft in NRW erfassen und die LBV-Änderungsmitteilung „Mehrarbeitsvergütung
    für Lehrkräfte“ ausfüllen lassen.
  </p>

  <aside class="notice" role="note">
    <strong>Wichtig für den finalen Ausdruck</strong>
    <p>
      Das Formular enthält einen Barcode, der beim Drucken erzeugt wird. Auf anderen Plattformen
      gibt es dabei bekannte Probleme. Drucke die Erklärung für die Abgabe deshalb unter
      <b>Windows mit dem Adobe Acrobat Reader</b>: PDF herunterladen, im Reader öffnen und von dort
      drucken.
    </p>
  </aside>

  <ol class="steps">
    <li>
      <strong>Stammdaten eintragen</strong>
      <span>
        Unter <em>⚙ Einstellungen</em> (in der Seitenleiste, auf dem Handy im Menü ☰) Dienststelle, Name,
        LBV-Personalnummer und Schlüssel des Stundensatzes angeben. Hat deine Schule dir einen Link geschickt,
        sind die Angaben der Schule schon eingetragen.
      </span>
    </li>
    <li>
      <strong>Monate erfassen</strong>
      <span>
        Für jeden Monat die geleisteten Mehrarbeitsstunden eintragen, bei Bedarf mit Merkmal „V“
        (unterhalb der Bagatellgrenze).
      </span>
    </li>
    <li>
      <strong>Erklärung anlegen</strong>
      <span>
        Bis zu sechs Monate auswählen. Monate, die schon in einer anderen Erklärung stehen, sind
        gesperrt.
      </span>
    </li>
    <li>
      <strong>Vorschau prüfen und weitergeben</strong>
      <span>
        Das ausgefüllte Formular herunterladen oder teilen, unter Windows mit dem Adobe Acrobat
        Reader drucken, unterschreiben und wie an deiner Schule üblich einreichen.
      </span>
    </li>
  </ol>

  <div class="actions left">
    <button class="secondary" onclick={() => goto(`/month/${newMonth().id}`)}>＋ Neuer Monat</button
    >
    <button class="primary" onclick={() => goto(`/declaration/${newDeclaration().id}`)}>
      ＋ Neue Erklärung
    </button>
  </div>

  <p class="hint privacy">
    Alle Angaben bleiben in deinem Browser. Es wird nichts an einen Server übertragen.
  </p>

  <footer class="credits">
    © {new Date().getFullYear()} Benjamin Benno Falkner ·
    <a href="https://falkner.xyz" target="_blank" rel="noopener">falkner.xyz</a>
  </footer>
</section>
