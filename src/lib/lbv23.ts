// Befüllt das LBV-Formular „Änderungsmitteilung Mehrarbeitsvergütung“ (Abschnitt A).
// Ohne Browser-/SvelteKit-Abhängigkeiten, damit es sich auch in Node testen lässt.
import {
  layoutMultilineText,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFTextField,
  TextAlignment
} from 'pdf-lib';
import { dateLabel } from './format.ts';
import type { Declaration, Month, Profile } from './types.ts';

/** Alle Felder, die fillLbv23 befüllt – eine Vorlage ohne sie ist unbrauchbar */
const FIELDS = [
  'Dienststelle',
  'Aktenzeichen',
  'Datum',
  'Bearbeiter',
  'Telefon',
  'E-Mail-Adresse',
  'LBV_Personalnummer',
  'LBV_Schulnummer',
  'LBV_Stundentaktung',
  'LBV_Nachname',
  'LBV_Vorname',
  'LBV_Geburtsdatum',
  'LBV_Checkbox_Ja',
  'LBV_Checkbox_Nein',
  'LBV_Anzahl_Schulen',
  'LBV_Bemerkungen',
  ...[1, 2, 3, 4, 5, 6].flatMap((i) => [`FeldA_Input${i}.1`, `FeldA_Input${i}.2`])
];

/** Wirft einen Fehler, wenn die Datei kein PDF ist oder Formularfelder fehlen */
export async function validateLbv23(template: ArrayBuffer | Uint8Array) {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(template);
  } catch {
    throw new Error('Die Datei ist kein PDF');
  }
  const names = new Set(
    doc
      .getForm()
      .getFields()
      .map((f) => f.getName())
  );
  const missing = FIELDS.filter((f) => !names.has(f));
  if (missing.length) throw new Error(`Formularfelder fehlen: ${missing.join(', ')}`);
}

// Größte Schrift (höchstens `max`), bei der der umbrochene Text ins Feld passt.
// Nutzt pdf-libs eigenen Umbruch, damit Rechnung und Darstellung übereinstimmen.
function fitFontSize(field: PDFTextField, font: PDFFont, text: string, max: number) {
  const { width, height } = field.acroField.getWidgets()[0].getRectangle();
  const inset = 2; // Rahmen + Innenabstand wie im pdf-lib-Erscheinungsbild
  const bounds = { x: inset, y: inset, width: width - 2 * inset, height: height - 2 * inset };
  const fits = (fontSize: number) => {
    const { lines, lineHeight } = layoutMultilineText(text, {
      alignment: TextAlignment.Left,
      font,
      fontSize,
      bounds
    });
    return lines.length * lineHeight <= bounds.height;
  };
  let size = max;
  while (size > 5 && !fits(size)) size -= 0.5;
  return size;
}

export async function fillLbv23(
  template: ArrayBuffer | Uint8Array,
  profile: Profile,
  months: Month[],
  declaration: Pick<Declaration, 'date' | 'remarks'>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const font = form.getDefaultFont();
  const set = (name: string, value: unknown) =>
    form.getTextField(name).setText(String(value ?? ''));
  // Mehrzeilige bzw. lange Felder: Schrift so wählen, dass alles sichtbar bleibt
  const setFitted = (name: string, value: string, max: number) => {
    const field = form.getTextField(name);
    // Die offizielle Vorlage hat bei „Dienststelle“ keine eigene Default Appearance –
    // dann den Formular-Standard übernehmen, sonst kann pdf-lib die Schriftgröße nicht setzen
    if (field.acroField.getDefaultAppearance() === undefined) {
      field.acroField.setDefaultAppearance('/Helv 0 Tf 0 g');
    }
    field.setFontSize(fitFontSize(field, font, value, max));
    field.setText(value);
  };
  const pad = (n: number, len: number) => String(n).padStart(len, '0');

  setFitted('Dienststelle', profile.office.trim(), 11);
  set('Aktenzeichen', profile.fileNumber);
  set('Datum', dateLabel(declaration.date));
  set('Bearbeiter', profile.clerk);
  set('Telefon', profile.phone);
  setFitted('E-Mail-Adresse', profile.email, 11);
  set('LBV_Personalnummer', profile.lbvNumber);
  set('LBV_Schulnummer', profile.schoolNumber);
  set('LBV_Stundentaktung', pad(Math.round(profile.minutesPerLesson * 100), 5)); // 45.00 → 04500
  set('LBV_Nachname', profile.lastName);
  set('LBV_Vorname', profile.firstName);
  set('LBV_Geburtsdatum', dateLabel(profile.birthDate));

  // Zeilen 1–6: MMJJ#SSS#Schlüssel, daneben Merkmal „V“ (unter Bagatellgrenze)
  for (let i = 1; i <= 6; i++) {
    const m = months[i - 1];
    const row = m
      ? `${m.month.slice(5, 7)}${m.month.slice(2, 4)}#${pad(Math.round(m.hours), 3)}#${profile.rateKey}`
      : '';
    set(`FeldA_Input${i}.1`, row);
    set(`FeldA_Input${i}.2`, m?.belowThreshold ? 'V' : '');
  }

  const other = Number(profile.otherSchools) || 0;
  form.getCheckBox(other > 0 ? 'LBV_Checkbox_Ja' : 'LBV_Checkbox_Nein').check();
  set('LBV_Anzahl_Schulen', other > 0 ? other : '');

  setFitted('LBV_Bemerkungen', declaration.remarks.trim(), 10);

  // Hinweis-Kommentare (gelbe „?“) entfernen – sie sollen nicht mitgedruckt werden
  const page = doc.getPage(0);
  const annots = page.node.Annots();
  if (annots) {
    for (let i = annots.size() - 1; i >= 0; i--) {
      const sub = annots.lookup(i, PDFDict).get(PDFName.of('Subtype'));
      if (sub !== PDFName.of('Widget')) annots.remove(i);
    }
  }

  return doc.save();
}
