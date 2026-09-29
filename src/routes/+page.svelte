<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { newDeclaration, newMonth, newSchedule } from '$lib/store.svelte';
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
      <strong>Stundenplan anlegen <small>(optional)</small></strong>
      <span>
        Unter <em>＋ Neuer Stundenplan</em> deine Sollstunden von Montag bis Freitag eintragen. Damit
        lassen sich die Wochen eines Monats mit einem Klick vorausfüllen.
      </span>
    </li>
    <li>
      <strong>Monate erfassen</strong>
      <span>
        Im Nachweis nach Tagen (wie Anlage 1 zum Mehrarbeitserlass) Ist- und Sollstunden je Tag
        eintragen oder aus dem Stundenplan übernehmen und nur Abweichungen ändern. Die geleisteten
        Mehrarbeitsstunden werden laufend berechnet; <em>Übertragen</em> setzt sie oben ein. Bei Bedarf
        Merkmal „V“ (unterhalb der Bagatellgrenze) setzen.
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
    <button
      class="secondary"
      onclick={() => goto(resolve('/schedule/[id]', { id: newSchedule().id }))}
      >＋ Neuer Stundenplan</button
    >
    <button class="secondary" onclick={() => goto(resolve('/month/[id]', { id: newMonth().id }))}
      >＋ Neuer Monat</button
    >
    <button
      class="primary"
      onclick={() => goto(resolve('/declaration/[id]', { id: newDeclaration().id }))}
    >
      ＋ Neue Erklärung
    </button>
  </div>

  <details class="install">
    <summary>Auf dem Handy oder Tablet als App installieren</summary>
    <p>So liegt die App wie jede andere auf dem Startbildschirm und öffnet ohne Browserleiste.</p>
    <h3>iPhone und iPad (Safari)</h3>
    <ol>
      <li>Diese Seite in <b>Safari</b> öffnen.</li>
      <li>Unten (iPad: oben) auf <b>Teilen</b> tippen – das Quadrat mit dem Pfeil nach oben.</li>
      <li><b>Zum Home-Bildschirm</b> wählen, eventuell erst nach unten scrollen.</li>
      <li>Rechts oben auf <b>Hinzufügen</b> tippen.</li>
    </ol>
    <h3>Android (Chrome)</h3>
    <ol>
      <li>Diese Seite in <b>Chrome</b> öffnen.</li>
      <li>Oben rechts auf das Menü <b>⋮</b> tippen.</li>
      <li>
        <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b> wählen und bestätigen.
      </li>
    </ol>
    <p class="hint">
      Die installierte App hat eigene Daten: Was du vorher im Browser eingetragen hast, erscheint
      dort nicht. Übertrage es mit <em>Sicherung herunterladen</em> und <em>Sicherung einlesen</em>
      in den Einstellungen. Für das Laden der Formularvorlage ist eine Internetverbindung nötig.
    </p>
  </details>

  <p class="hint privacy">
    Alle Angaben bleiben in deinem Browser. Es wird nichts an einen Server übertragen – deshalb gibt
    es auch keine Kopie: Löschst du die Browserdaten oder räumt der Browser auf, sind die Daten weg.
    Unter <em>⚙ Einstellungen</em> kannst du jederzeit eine Sicherung herunterladen und wieder einlesen.
  </p>

  <footer class="credits">
    © {new Date().getFullYear()} Benjamin Benno Falkner ·
    <a href="https://falkner.xyz" target="_blank" rel="noopener">falkner.xyz</a>
  </footer>
</section>
