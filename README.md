# edoMehrarbeitNRW

Erfassung von Mehrarbeit (Lehrkräfte NRW) und Ausfüllen der LBV-Änderungsmitteilung
„Mehrarbeitsvergütung für Lehrkräfte“ (LBV(A/Bes)23, Abschnitt A).

Reine Client-SPA (SvelteKit + Svelte 5 + TypeScript): Alle Daten bleiben im Browser.

Die leere Formularvorlage wird nicht mitverteilt, sondern beim Start online geladen (siehe
[Formularvorlage](#formularvorlage)).

```sh
npm install
npm run dev      # http://localhost:5173
npm run check    # TypeScript-/Svelte-Prüfung
npm run format   # Prettier
npm run build    # Ausgabe in build/ – für nginx: try_files $uri /index.html;
BASE_PATH=/edoMehrarbeitNRW npm run build   # für Hosting in einem Unterverzeichnis
```

## Struktur

- `src/routes/+layout.svelte` – Sidebar: Neue Erklärung, Verlauf, Neuer Monat, Monate, Einstellungen
- `src/routes/month/[id]/+page.svelte` – Stunden + Merkmal „V“ eines Monats
- `src/routes/declaration/[id]/+page.svelte` – bis zu 6 Monate wählen, Vorschau, Download
- `src/lib/types.ts` – Datenmodell (Profile, Month, Declaration)
- `src/lib/store.svelte.ts` – Zustand, localStorage, JSON-Import
- `src/lib/backup.ts` – JSON-Export/-Import (noch ohne Platz in der Oberfläche)
- `src/lib/prefill.ts` – Stammdaten aus dem Link-Hash bzw. `.env`
- `src/lib/ProfileFields.svelte` – Stammdaten-Felder (Einstellungen und Erklärung)
- `src/lib/lbv23.ts` – befüllt das Formular (ohne Browser-Abhängigkeiten, in Node testbar)
- `src/lib/info.ts`, `src/lib/InfoCarousel.svelte` – Hinweise aus `static/info.json`
- `src/lib/form.ts`, `src/lib/template.svelte.ts` – Herkunft und Laden der Formularvorlage
- `src/lib/pdf.ts` – erzeugt das ausgefüllte PDF
- `src/lib/SettingsDialog.svelte` – Stammdaten, Speichern an/aus

## Datenmodell (localStorage `mehrarbeit-data`)

```json
{
  "profile": {
    "clerk": "",
    "office": "",
    "fileNumber": "",
    "email": "",
    "phone": "",
    "lbvNumber": "",
    "schoolNumber": "",
    "minutesPerLesson": 45,
    "lastName": "",
    "firstName": "",
    "birthDate": "YYYY-MM-DD",
    "rateKey": 4,
    "otherSchools": 0
  },
  "months": [{ "id": "…", "month": "2026-01", "hours": 5, "belowThreshold": false }],
  "declarations": [{ "id": "…", "date": "2026-09-29", "monthIds": ["…"], "remarks": "" }]
}
```

Ist Speichern abgeschaltet, wird `mehrarbeit-data` gelöscht und nur `mehrarbeit-persist = "false"` abgelegt.

## PDF-Felder

| Formularfeld                                        | Wert                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `FeldA_Input{1-6}.1`                                | `MMJJ#SSS#K` – Monat, Jahr (2-stellig), Stunden (3-stellig), Schlüssel |
| `FeldA_Input{1-6}.2`                                | `V` wenn `belowThreshold`                                              |
| `Aktenzeichen`, `E-Mail-Adresse`                    | `fileNumber`, `email`                                                  |
| `LBV_Bemerkungen`                                   | `remarks` der Erklärung                                                |
| `Dienststelle`, `E-Mail-Adresse`, `LBV_Bemerkungen` | Schriftgröße wird automatisch verkleinert, bis der Text passt          |
| `LBV_Stundentaktung`                                | Minuten × 100, 5-stellig (45 → `04500`)                                |
| `LBV_Checkbox_Ja/Nein`, `LBV_Anzahl_Schulen`        | aus `otherSchools`                                                     |

## Formularvorlage

Die leere Vorlage LBV(A/Bes)23 kommt von der Bezirksregierung Arnsberg:
<https://www.bra.nrw.de/system/files/media/document/file/lbva_23_2019_02.pdf>

Der Server dort erlaubt keine Browser-Abrufe von fremden Seiten (kein CORS). Die App lädt die
Vorlage deshalb über den Pfad `/vorlage/lbva23.pdf` der eigenen Seite, den der Webserver
weiterleitet. Dabei geht nur die Anfrage nach der leeren Vorlage an den Server – keine Daten.

- **Entwicklung / `npm run preview`:** leitet Vite weiter (`vite.config.ts`).
- **Produktion (nginx):**

  ```nginx
  location = /vorlage/lbva23.pdf {
    proxy_pass https://www.bra.nrw.de/system/files/media/document/file/lbva_23_2019_02.pdf;
    proxy_set_header Host www.bra.nrw.de;
    proxy_ssl_server_name on;
  }
  ```

Der Pfad lässt sich ohne neuen Build in `config.json` (im Build-Ordner) ändern – relativ zur App
oder als volle Adresse eines Servers, der CORS erlaubt:

```json
{ "vorlage": "vorlage/lbva23.pdf" }
```

Bei Hosting in einem Unterverzeichnis (`BASE_PATH`) liegt der Proxy-Pfad entsprechend darunter,
z. B. `location = /edo-mehrarbeit-nrw/vorlage/lbva23.pdf`. Weil die App ein SPA ist, braucht das
Verzeichnis einen Fallback auf `index.html`, sonst liefert ein Neuladen auf Unterseiten 404:

```nginx
location /edo-mehrarbeit-nrw/ {
  try_files $uri $uri/ /edo-mehrarbeit-nrw/index.html;
}
```

Die App lädt die Vorlage beim Start im Hintergrund und prüft, ob alle benötigten Formularfelder
vorhanden sind. „Prüfen“ in den Einstellungen lädt sie neu. Ohne Weiterleitung (z. B. auf GitHub
Pages) kann kein PDF erzeugt werden.

## Stammdaten per Link vorbelegen

Die App übernimmt Stammdaten aus dem **Hash** der Adresse, öffnet danach die Einstellungen und
entfernt den Hash aus der Adresszeile. Der Hash-Teil wird vom Browser nie an den Server
geschickt – anders als Query-Parameter (`?…`).

```
https://…/#schulnummer=196721&bearbeiter=Herr+Mustermann&dienststelle=Zeile+1%0AZeile+2
```

| Parameter                                                        | Feld                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `bearbeiter`, `dienststelle`, `telefon`, `email`, `aktenzeichen` | Bearbeiter, Dienststelle (Zeilenumbruch = `%0A`), Durchwahl, E-Mail, Aktenzeichen |
| `schulnummer`, `lbv_personalnummer`                              | Schulnummer, LBV-Personalnummer                                                   |
| `nachname`, `vorname`, `geburtsdatum`                            | Name, Vorname, Geburtsdatum (`YYYY-MM-DD`)                                        |
| `minuten_je_stunde`, `schluessel`, `weitere_schulen`             | Taktung, Schlüssel 1–4, Anzahl weiterer Schulen                                   |

**Entwicklung:** Dieselben Namen in Großbuchstaben in `.env` eintragen (mehrzeilige Werte in
`"…"`). `npm run dev` gibt dann zusätzlich einen fertigen Link „Mit .env-Daten“ aus. Die Werte
landen nicht im Build.

```sh
SCHULNUMMER=123456
DIENSTSTELLE="Musterschule
Musterstraße 1
12345 Musterstadt"
```

## Hinweise auf der Startseite (`static/info.json`)

Einträge aus `static/info.json` erscheinen oben auf der Startseite, neueste zuerst, und wechseln
alle 8 Sekunden (Pause bei Maus/Fokus und bei „Bewegung reduzieren“). Die Datei wird zur
Laufzeit geladen – sie lässt sich auf dem Server austauschen, ohne neu zu bauen. Fehlt sie oder
ist die Liste leer, wird nichts angezeigt.

```json
[
  {
    "title": "Abgabefrist Oktober",
    "date": "2026-09-28",
    "body": "<p>Bitte bis zum <strong>10.10.</strong> einreichen.</p>"
  }
]
```

`body` ist HTML und wird **ungefiltert** eingefügt – nur selbst gepflegte Inhalte eintragen.

## Release

1. Version in `package.json` erhöhen (z. B. `npm version minor --no-git-tag-version`).
2. `npm run commit-version` – führt aus:
   `git add .` → `git commit -m vX.Y.Z` → `git tag -a vX.Y.Z` (Editor öffnet sich für den
   Tag-Text) → `git push origin HEAD` → `git push origin vX.Y.Z`.
3. Die GitHub Action `.github/workflows/release.yml` testet (Prettier, svelte-check, Build),
   prüft, dass Tag und `package.json` übereinstimmen, und legt ein Release mit
   `edo-mehrarbeit-nrw-vX.Y.Z.zip` (Inhalt von `build/`) an. Der Tag-Text wird die
   Release-Beschreibung.

Pushes auf `main` und Pull Requests werden nur getestet.

## Lizenz

[MIT](LICENSE). Das LBV-Formular unterliegt nicht dieser Lizenz und wird nicht mitverteilt.
