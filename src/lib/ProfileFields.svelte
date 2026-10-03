<script lang="ts">
  // Stammdaten für den Formularkopf – in den Einstellungen und in jeder Erklärung.
  // Ohne ids, weil die Felder gleichzeitig im Dialog und auf der Seite stehen können.
  import { RATE_KEYS, type Profile } from './types';

  let { profile }: { profile: Profile } = $props();
  const uid = $props.id(); // eigener Name für die Optionsfelder je Instanz
</script>

<fieldset>
  <legend>Dienststelle</legend>
  <label>
    Dienststelle, Anschrift
    <textarea rows="4" bind:value={profile.office}></textarea>
  </label>
  <div class="row">
    <label>Schulnummer <input maxlength="6" bind:value={profile.schoolNumber} /></label>
    <label>Aktenzeichen <input maxlength="35" bind:value={profile.fileNumber} /></label>
  </div>
  <p class="hint">
    Aktenzeichen: Wird von der Schule/Dienststelle vergeben. Falls dir kein Aktenzeichen bekannt
    ist, lass dieses Feld frei.
  </p>
  <div class="row">
    <label>Bearbeiter <input bind:value={profile.clerk} /></label>
    <label>Telefon-Durchwahl <input bind:value={profile.phone} /></label>
  </div>
  <label>
    E-Mail-Adresse <small>(Angabe freigestellt)</small>
    <input type="email" bind:value={profile.email} />
  </label>
</fieldset>

<fieldset>
  <legend>Lehrkraft</legend>
  <div class="row">
    <label>Name <input maxlength="40" bind:value={profile.lastName} /></label>
    <label>Vorname <input maxlength="35" bind:value={profile.firstName} /></label>
  </div>
  <div class="row">
    <label>Geburtsdatum <input type="date" bind:value={profile.birthDate} /></label>
    <label>LBV-Personalnummer <input maxlength="10" bind:value={profile.lbvNumber} /></label>
  </div>
  <div class="row">
    <label>Amts-/Dienstbezeichnung <input bind:value={profile.title} /></label>
    <label>BesGr./VergGr. <input bind:value={profile.payGrade} placeholder="z. B. A 13" /></label>
  </div>
  <div class="row">
    <label>
      Prüfziffer (Prz) <small>zur LBV-Personalnummer</small>
      <input maxlength="2" bind:value={profile.prz} />
    </label>
    <label>
      Vergütung je Einzelstunde (€)
      <input inputmode="decimal" bind:value={profile.hourlyRate} placeholder="z. B. 34,56" />
    </label>
  </div>
  <p class="hint">
    Amtsbezeichnung, BesGr., Prz und Vergütung stehen nur im Nachweis nach Anlage 1.
  </p>
  <label>
    Minuten je Unterrichtsstunde
    <input type="number" step="0.01" min="0" bind:value={profile.minutesPerLesson} />
  </label>
  <div class="rate-keys" role="radiogroup" aria-labelledby="{uid}-rate">
    <span id="{uid}-rate" class="group-label">
      Mehrarbeitsstundensatz <small>– Inhaber von Lehrämtern des …</small>
    </span>
    {#each RATE_KEYS as { key, label } (key)}
      <label class="radio">
        <input type="radio" name="{uid}-rate" value={key} bind:group={profile.rateKey} />
        <span>{label}</span>
      </label>
    {/each}
  </div>
  <label class="check">
    <input
      type="checkbox"
      checked={profile.otherSchools !== 0}
      onchange={(e) => (profile.otherSchools = e.currentTarget.checked ? 1 : 0)}
    />
    Mehrarbeit auch an weiteren Schulen derselben Schulform
  </label>
  <!-- !== 0 statt > 0: ein beim Tippen geleertes Feld (null) soll nicht verschwinden -->
  {#if profile.otherSchools !== 0}
    <label class="inline">
      an
      <input
        type="number"
        min="1"
        max="99"
        step="1"
        bind:value={profile.otherSchools}
        onblur={() => {
          if (!(profile.otherSchools >= 1)) profile.otherSchools = 1;
        }}
      />
      weiteren Schulen
    </label>
  {/if}
</fieldset>
