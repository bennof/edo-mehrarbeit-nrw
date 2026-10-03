/** Schlüssel des Mehrarbeitsstundensatzes laut LBV-Formular */
export type RateKey = 1 | 2 | 3 | 4;

/** Wortlaut aus dem Formular: „Inhaber von Lehrämtern des …“ */
export const RATE_KEYS: { key: RateKey; label: string }[] = [
  {
    key: 1,
    label: 'gehobenen Dienstes aller Schulformen, soweit sie nicht unter Schlüssel 2 oder 3 fallen'
  },
  {
    key: 2,
    label:
      'gehobenen Dienstes aller Schulformen, deren Eingangsämter mindestens der BesGr A 12 zugeordnet sind, und des höheren Dienstes an Grund- und Hauptschulen'
  },
  {
    key: 3,
    label:
      'gehobenen Dienstes aller Schulformen, deren Eingangsämter der BesGr A 13 zugeordnet sind, und des höheren Dienstes an Förder- und Realschulen'
  },
  {
    key: 4,
    label:
      'höheren Dienstes an Gesamtschulen, Gymnasien, berufsbildenden Schulen, Kollegschulen und Sekundarschulen sowie des höheren Dienstes an Fachhochschulen'
  }
];

/** Stammdaten der Lehrkraft und der Dienststelle */
export interface Profile {
  clerk: string;
  office: string;
  /** Aktenzeichen der Dienststelle */
  fileNumber: string;
  phone: string;
  email: string;
  lbvNumber: string;
  schoolNumber: string;
  minutesPerLesson: number;
  lastName: string;
  firstName: string;
  /** YYYY-MM-DD */
  birthDate: string;
  rateKey: RateKey;
  /** 0 = keine Mehrarbeit an weiteren Schulen */
  otherSchools: number;
  // Nur für den Nachweis nach Anlage 1
  /** Amts-/Dienstbezeichnung, z. B. Studienrat */
  title: string;
  /** Besoldungs-/Vergütungsgruppe, z. B. A 13 */
  payGrade: string;
  /** Prüfziffer zur LBV-Personalnummer */
  prz: string;
  /** Vergütung je Einzelstunde in €, wie eingegeben (z. B. „34,56“) */
  hourlyRate: string;
}

export interface Month {
  id: string;
  /** YYYY-MM */
  month: string;
  hours: number;
  /** Merkmal „V“: Vergütung unterhalb der Bagatellgrenze */
  belowThreshold: boolean;
  /** Nachweis nach Anlage 1 (BASS 21-22 Nr. 21), Schlüssel = Tag im Monat („1“–„31“) */
  days?: Record<string, DayHours>;
}

/** Stunden eines Tages; leere Felder fehlen */
export interface DayHours {
  ist?: number;
  soll?: number;
  /** In den Iststunden enthaltene anrechenbare Ausfallstunden */
  ausfall?: number;
}

export interface Declaration {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  monthIds: string[];
  /** Feld „Bemerkungen“ im Formular */
  remarks: string;
}

/** Wochenplan zum Schnellausfüllen der Sollstunden im Tagesnachweis */
export interface Schedule {
  id: string;
  name: string;
  /** Sollstunden Mo–Fr */
  soll: [number, number, number, number, number];
}

export interface AppData {
  profile: Profile;
  months: Month[];
  schedules: Schedule[];
  declarations: Declaration[];
}
