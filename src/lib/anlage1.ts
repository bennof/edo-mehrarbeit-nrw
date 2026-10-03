// „Nachweis über geleistete Mehrarbeit im Schuldienst“ nach Anlage 1 zu BASS 21-22 Nr. 21:
// ausfüllbares PDF erzeugen (buildAnlage1) und befüllen (fillAnlage1).
// Ohne Browser-/SvelteKit-Abhängigkeiten, damit es sich auch in Node erzeugen und testen lässt.
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
  StandardFonts,
  TextAlignment,
  type PDFForm
} from 'pdf-lib';
import { totalsOf } from './days.ts';
import type { Month, Profile } from './types.ts';

/** Feldnamen – Tagesfelder mit Suffix _1 … _31 */
export const ANLAGE1_FIELDS = {
  name: 'Name_Vorname',
  title: 'Amtsbezeichnung',
  payGrade: 'BesGr_VergGr',
  lbvNumber: 'LBV_Personalnummer',
  prz: 'Prz',
  school: 'Schule_Schulform',
  rate: 'Verguetung_je_Stunde',
  month: 'Monat',
  year: 'Jahr',
  ist: 'Ist',
  soll: 'Soll',
  ausfall: 'Ausfall',
  mehrarbeit: 'Mehrarbeit',
  otherSchoolYes: 'Andere_Schule_Ja',
  otherSchoolNo: 'Andere_Schule_Nein',
  otherSchoolCount: 'Andere_Schule_Anzahl',
  sideJobYes: 'Nebenamt_Ja',
  sideJobNo: 'Nebenamt_Nein',
  sideJobCount: 'Nebenamt_Anzahl'
} as const;

const F = ANLAGE1_FIELDS;
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// ---------- Aufbau (A4 hoch, Punkte, Ursprung unten links) ----------
const W = 595.28;
const H = 841.89;
const LEFT = 40;
const RIGHT = W - 40;
const LABEL_W = 78;
const TOTAL_W = 40;
const DAY_W = (RIGHT - LEFT - LABEL_W - TOTAL_W) / 31;
const ROW_H = 16;
const BLACK = rgb(0, 0, 0);
const LINE = 0.6;

interface Ctx {
  page: PDFPage;
  form: PDFForm;
  font: PDFFont;
  bold: PDFFont;
}

function text(c: Ctx, s: string, x: number, y: number, size = 8, font = c.font) {
  c.page.drawText(s, { x, y, size, font, color: BLACK });
}

function box(c: Ctx, x: number, y: number, w: number, h: number) {
  c.page.drawRectangle({ x, y, width: w, height: h, borderColor: BLACK, borderWidth: LINE });
}

function line(c: Ctx, x1: number, y1: number, x2: number, y2: number) {
  c.page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: LINE,
    color: BLACK
  });
}

function field(
  c: Ctx,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  { size = 9, align = TextAlignment.Left, multiline = false } = {}
) {
  const f = c.form.createTextField(name);
  if (multiline) f.enableMultiline();
  f.addToPage(c.page, { x, y, width: w, height: h, borderWidth: 0, font: c.font });
  f.setAlignment(align);
  f.setFontSize(size);
  return f;
}

function checkbox(c: Ctx, name: string, x: number, y: number) {
  c.form.createCheckBox(name).addToPage(c.page, {
    x,
    y,
    width: 11,
    height: 11,
    borderColor: BLACK,
    borderWidth: LINE
  });
}

/** Leeres, ausfüllbares Formular */
export async function buildAnlage1(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Nachweis über geleistete Mehrarbeit im Schuldienst');
  doc.setSubject('Anlage 1 zu BASS 21-22 Nr. 21');
  const page = doc.addPage([W, H]);
  const c: Ctx = {
    page,
    form: doc.getForm(),
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold)
  };

  // Kopf: Name | Amtsbezeichnung | BesGr
  let y = H - 60;
  const head = 34;
  box(c, LEFT, y - head, RIGHT - LEFT, head);
  const col2 = LEFT + 260;
  const col3 = RIGHT - 90;
  line(c, col2, y, col2, y - head);
  line(c, col3, y, col3, y - head);
  text(c, 'Name, Vorname', LEFT + 4, y - 9, 7);
  text(c, 'Amts-/Dienstbezeichnung', col2 + 4, y - 9, 7);
  text(c, 'BesGr./VergGr.', col3 + 4, y - 9, 7);
  field(c, F.name, LEFT + 3, y - head + 2, col2 - LEFT - 6, 18, { size: 10 });
  field(c, F.title, col2 + 3, y - head + 2, col3 - col2 - 6, 18, { size: 10 });
  field(c, F.payGrade, col3 + 3, y - head + 2, RIGHT - col3 - 6, 18, { size: 10 });

  // LBV-Personalnummer | Prz | Schule/Schulform
  y -= head + 8;
  text(c, 'LBV-Personalnummer', LEFT + 4, y - 8, 7);
  box(c, LEFT, y - 30, 120, 20);
  field(c, F.lbvNumber, LEFT + 2, y - 29, 116, 18, { size: 10 });
  text(c, 'Prz', LEFT + 130, y - 8, 7);
  box(c, LEFT + 130, y - 30, 22, 20);
  field(c, F.prz, LEFT + 131, y - 29, 20, 18, { size: 10, align: TextAlignment.Center });
  const schoolX = LEFT + 170;
  box(c, schoolX, y - 30, RIGHT - schoolX, 30);
  text(c, 'Schule/Schulform', schoolX + 4, y - 9, 7);
  field(c, F.school, schoolX + 3, y - 29, RIGHT - schoolX - 6, 18, { size: 9 });

  // Titel
  y -= 58;
  const title = 'Nachweis über geleistete Mehrarbeit im Schuldienst';
  text(c, title, (W - c.bold.widthOfTextAtSize(title, 12)) / 2, y, 12, c.bold);

  y -= 24;
  text(
    c,
    'Die Mehrarbeit wurde schriftlich angeordnet bzw. genehmigt. Vergütung je Einzelstunde:',
    LEFT,
    y,
    8.5
  );
  line(c, 395, y - 2, 470, y - 2);
  field(c, F.rate, 395, y - 1, 75, 12, { size: 9, align: TextAlignment.Right });
  text(c, '€', 474, y, 8.5);

  y -= 22;
  text(c, 'Monat', LEFT, y, 8.5);
  line(c, LEFT + 30, y - 2, LEFT + 150, y - 2);
  field(c, F.month, LEFT + 30, y - 1, 120, 12, { size: 9 });
  text(c, '20', LEFT + 154, y, 8.5);
  line(c, LEFT + 164, y - 2, LEFT + 190, y - 2);
  field(c, F.year, LEFT + 164, y - 1, 26, 12, { size: 9 });

  // Tabelle: Tag | Iststunden | Sollstunden
  y -= 12;
  const dayX = (d: number) => LEFT + LABEL_W + (d - 1) * DAY_W;
  const totalX = LEFT + LABEL_W + 31 * DAY_W;
  const rows: [string, string | null][] = [
    ['Tag', null],
    ['Iststunden', F.ist],
    ['Sollstunden', F.soll]
  ];
  rows.forEach(([label, prefix], r) => {
    const top = y - r * ROW_H;
    box(c, LEFT, top - ROW_H, RIGHT - LEFT, ROW_H);
    text(c, label, LEFT + 3, top - 11, 7.5);
    for (const d of DAYS) {
      line(c, dayX(d), top, dayX(d), top - ROW_H);
      if (prefix) {
        field(c, `${prefix}_${d}`, dayX(d) + 0.5, top - ROW_H + 1, DAY_W - 1, ROW_H - 2, {
          size: 7,
          align: TextAlignment.Center
        });
      } else {
        const s = String(d);
        text(c, s, dayX(d) + DAY_W - c.font.widthOfTextAtSize(s, 6.5) - 1.5, top - 10, 6.5);
      }
    }
    line(c, totalX, top, totalX, top - ROW_H);
    if (prefix) {
      field(c, `${prefix}_Summe`, totalX + 1, top - ROW_H + 1, TOTAL_W - 2, ROW_H - 2, {
        size: 8,
        align: TextAlignment.Center
      });
    } else {
      text(c, 'insgesamt', totalX + 2, top - 10, 6);
    }
  });

  // Geleistete Mehrarbeitsstunden → Summenfeld
  y -= 3 * ROW_H + 4;
  text(c, 'Geleistete Mehrarbeitsstunden', LEFT + 3, y - 11, 7.5);
  line(c, LEFT + 130, y - 8, totalX - 8, y - 8);
  page.drawSvgPath('M 0 0 L -7 -3.5 L -7 3.5 Z', { x: totalX - 2, y: y - 8, color: BLACK });
  box(c, totalX, y - ROW_H, TOTAL_W, ROW_H);
  field(c, F.mehrarbeit, totalX + 1, y - ROW_H + 1, TOTAL_W - 2, ROW_H - 2, {
    size: 8,
    align: TextAlignment.Center
  });

  // In den Iststunden enthaltene anrechenbare Ausfallstunden
  y -= ROW_H + 8;
  const aus = 30;
  box(c, LEFT, y - aus, RIGHT - LEFT, aus);
  text(c, 'In den Iststunden', LEFT + 3, y - 9, 7);
  text(c, 'enth. anrechenbare', LEFT + 3, y - 17, 7);
  text(c, 'Ausfallstunden', LEFT + 3, y - 25, 7);
  for (const d of DAYS) {
    line(c, dayX(d), y, dayX(d), y - aus);
    field(c, `${F.ausfall}_${d}`, dayX(d) + 0.5, y - aus + 1, DAY_W - 1, aus - 2, {
      size: 7,
      align: TextAlignment.Center
    });
  }
  line(c, totalX, y, totalX, y - aus);
  field(c, `${F.ausfall}_Summe`, totalX + 1, y - aus + 1, TOTAL_W - 2, aus - 2, {
    size: 8,
    align: TextAlignment.Center
  });

  // Bestätigung und Unterschriften
  y -= aus + 14;
  const confirm = 'Die Richtigkeit vorstehender Angaben wird hiermit bestätigt:';
  text(c, confirm, (W - c.font.widthOfTextAtSize(confirm, 8.5)) / 2, y, 8.5);
  y -= 34;
  const sigW = 230;
  line(c, LEFT + 10, y, LEFT + 10 + sigW, y);
  line(c, RIGHT - 10 - sigW, y, RIGHT - 10, y);
  text(c, 'Unterschrift Lehrer/in, Datum', LEFT + 10 + 60, y - 10, 8);
  text(c, 'Unterschrift Schulleiter/in, Datum', RIGHT - 10 - sigW + 50, y - 10, 8);

  // Weitere Schulen
  y -= 30;
  text(c, 'Ist neben der vorstehenden nachgewiesenen Mehrarbeit', LEFT, y, 8.5);
  const question = (label: string, yes: string, no: string, count: string) => {
    y -= 16;
    text(c, `-  ${label}`, LEFT + 60, y, 8.5);
    y -= 20;
    checkbox(c, yes, LEFT + 60, y - 2);
    text(c, 'ja', LEFT + 76, y, 8.5);
    checkbox(c, no, LEFT + 120, y - 2);
    text(c, 'nein', LEFT + 136, y, 8.5);
    text(c, 'Wenn ja, an wie vielen Schulen', LEFT + 260, y, 8.5);
    box(c, LEFT + 390, y - 5, 30, 16);
    field(c, count, LEFT + 391, y - 4, 28, 14, { size: 9, align: TextAlignment.Center });
  };
  question(
    'an einer anderen Schule derselben Schulform Mehrarbeit geleistet worden?',
    F.otherSchoolYes,
    F.otherSchoolNo,
    F.otherSchoolCount
  );
  question(
    'an einer Schule einer anderen Schulform nebenamtlicher Unterricht erteilt worden?',
    F.sideJobYes,
    F.sideJobNo,
    F.sideJobCount
  );
  y -= 40;
  line(c, RIGHT - 10 - sigW, y, RIGHT - 10, y);
  text(c, 'Unterschrift Lehrer/in, Datum', RIGHT - 10 - sigW + 60, y - 10, 8);

  // Erläuterungen
  y -= 32;
  text(c, 'Erläuterungen', LEFT, y, 8.5, c.bold);
  const notes: [string, string][] = [
    [
      'Iststunden: ',
      'Geleistete Pflicht-Unterrichtsstunden, ausgefallene Pflicht-Unterrichtsstunden, sofern'
    ],
    [
      '',
      '-  auf den Unterrichtsausfall ein Rechtsanspruch besteht (z. B. gesetzliche Feiertage, Ferientage, Krankheitstage),'
    ],
    [
      '',
      '-  eine andere dienstliche Tätigkeit ausgeübt wurde (z. B. Teilnahme an Eltern- und Schülersprechtagen, an Konferenzen,'
    ],
    [
      '',
      '   Dienstbesprechungen und Prüfungen, an Schulwanderungen/-fahrten, auch an Veranstaltungen zur Förderung der'
    ],
    [
      '',
      '   Betriebsgemeinschaft; als dienstliche Tätigkeit gelten nicht Zeiten der Unterrichtsvor- und -nachbereitung),'
    ],
    ['', 'geleistete Mehrarbeits-Unterrichtsstunden.'],
    [
      'Sollstunden: ',
      'Die in der Unterrichtsverteilungsdatei (UVD) 221 ausgewiesenen Pflichtstunden.'
    ],
    [
      'Ausfallstunden: ',
      'Ausgefallene Pflicht-Unterrichtsstunden, die als Iststunden angerechnet werden.'
    ]
  ];
  for (const [label, rest] of notes) {
    y -= 11;
    let x = LEFT;
    if (label) {
      text(c, label, x, y, 7.5, c.bold);
      x += c.bold.widthOfTextAtSize(label, 7.5);
    }
    text(c, rest, x, y, 7.5);
  }

  text(c, 'Muster nach Anlage 1 zu BASS 21-22 Nr. 21', LEFT, 30, 6.5);
  return doc.save();
}

// ---------- Befüllen ----------

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember'
];

const num = (n: number | undefined) => (n == null ? '' : n.toLocaleString('de-DE'));

/** Formular mit Stammdaten und Tageswerten eines Monats befüllen */
export async function fillAnlage1(
  template: ArrayBuffer | Uint8Array,
  profile: Profile,
  month: Month,
  { flatten = false } = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const set = (name: string, value: string) => form.getTextField(name).setText(value);

  set(F.name, [profile.lastName, profile.firstName].filter(Boolean).join(', '));
  set(F.lbvNumber, profile.lbvNumber);
  set(F.title, profile.title ?? '');
  set(F.payGrade, profile.payGrade ?? '');
  set(F.prz, profile.prz ?? '');
  set(F.rate, profile.hourlyRate ?? '');
  set(F.school, profile.office.split('\n')[0] ?? '');

  const [y, m] = month.month.split('-').map(Number);
  set(F.month, MONTHS[m - 1] ?? '');
  set(F.year, String(y % 100).padStart(2, '0'));

  const days = month.days ?? {};
  for (const d of DAYS) {
    set(`${F.ist}_${d}`, num(days[d]?.ist));
    set(`${F.soll}_${d}`, num(days[d]?.soll));
    set(`${F.ausfall}_${d}`, num(days[d]?.ausfall));
  }
  const t = totalsOf(days);
  if (t.filled) {
    set(`${F.ist}_Summe`, num(t.ist));
    set(`${F.soll}_Summe`, num(t.soll));
    set(`${F.ausfall}_Summe`, num(t.ausfall));
    set(F.mehrarbeit, num(Math.max(0, t.mehrarbeit)));
  }

  const other = profile.otherSchools > 0;
  form.getCheckBox(other ? F.otherSchoolYes : F.otherSchoolNo).check();
  if (other) set(F.otherSchoolCount, String(profile.otherSchools));

  if (flatten) form.flatten();
  return doc.save();
}
