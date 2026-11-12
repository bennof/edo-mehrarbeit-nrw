<script lang="ts">
  import { data } from './store.svelte';
  import { importJson } from './backup';
  import {
    prepareDrive,
    connectDrive,
    disconnectDrive,
    saveBackup,
    listBackups,
    loadBackup,
    DRIVE_FOLDER,
    type DriveFile
  } from './googleDrive';

  let ready = $state(false);
  let connected = $state(false);
  let busy = $state(false);
  let message = $state('');
  let error = $state('');
  let files = $state<DriveFile[]>([]);
  let selected = $state('');

  async function run(action: () => Promise<void>) {
    busy = true;
    error = '';
    message = '';
    try {
      await action();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Google Drive ist nicht erreichbar.';
    } finally {
      busy = false;
    }
  }
  async function refresh() {
    files = await listBackups();
    selected = files[0]?.id ?? '';
  }
  function connect() {
    // Token-Anfrage ohne vorheriges await unmittelbar aus der Benutzeraktion.
    const pending = connectDrive();
    void run(async () => {
      await pending;
      connected = true;
      files = [];
      selected = '';
      await refresh();
      message = 'Mit Google Drive verbunden.';
    });
  }
  function save() {
    const json = JSON.stringify(data, null, 2);
    void run(async () => {
      const name = await saveBackup(json);
      message = `Sicherung „${name}“ gespeichert.`;
      await refresh();
    });
  }
  function restore() {
    const file = files.find((f) => f.id === selected);
    if (!file || !confirm(`Alle aktuellen Daten durch „${file.name}“ aus Google Drive ersetzen?`))
      return;
    void run(async () => {
      await importJson(await loadBackup(file));
      message = 'Daten aus Google Drive geladen.';
    });
  }
</script>

<fieldset>
  <legend>Online-Speicher: Google Drive</legend>
  <p class="hint">
    Stammdaten, Monate, Stundenpläne und Erklärungen werden gemeinsam im Ordner „{DRIVE_FOLDER}“
    gesichert. Jede Sicherung ist eine eigene Datei. Speichern und Laden erfolgen auf Knopfdruck; es
    gibt keinen automatischen Abgleich.
  </p>
  {#if !ready}
    <button
      type="button"
      class="secondary"
      disabled={busy}
      onclick={() =>
        run(async () => {
          await prepareDrive();
          ready = true;
        })}
    >
      {busy ? 'Lade Google-Anmeldung …' : 'Google Drive einrichten'}
    </button>
  {:else}
    <div class="backup">
      <button type="button" class="secondary" disabled={busy} onclick={connect}>
        {connected ? 'Erneut verbinden / Konto wechseln' : 'Mit Google Drive verbinden'}
      </button>
      {#if connected}
        <button
          type="button"
          class="secondary"
          disabled={busy}
          onclick={() => {
            disconnectDrive();
            connected = false;
            files = [];
            selected = '';
            error = '';
            message = 'Verbindung getrennt. Sicherungen in Google Drive bleiben erhalten.';
          }}>Trennen</button
        >
      {/if}
    </div>
  {/if}
  {#if connected}
    <div class="backup">
      <button type="button" class="secondary" disabled={busy} onclick={save}
        >In Google Drive sichern</button
      >
      <button type="button" class="secondary" disabled={busy} onclick={() => run(refresh)}
        >Liste aktualisieren</button
      >
    </div>
    {#if files.length}
      <label>
        Sicherung auswählen
        <select bind:value={selected} disabled={busy}>
          {#each files as file}
            <option value={file.id}
              >{new Date(file.createdTime).toLocaleString('de-DE')} – {file.name}</option
            >
          {/each}
        </select>
      </label>
      <button type="button" class="secondary" disabled={busy || !selected} onclick={restore}
        >Aus Google Drive laden</button
      >
    {:else}
      <p class="hint">
        Keine Sicherungen geladen. Erstelle eine Sicherung oder aktualisiere die Liste.
      </p>
    {/if}
    <p class="hint">Die Anmeldung gilt für diese Sitzung. Nach Ablauf bitte erneut verbinden.</p>
  {/if}
  <div aria-live="polite">
    {#if busy}<p class="hint">Bitte warten …</p>{/if}
    {#if message}<p class="hint ok">{message}</p>{/if}
    {#if error}<p class="error">{error}</p>{/if}
  </div>
</fieldset>
