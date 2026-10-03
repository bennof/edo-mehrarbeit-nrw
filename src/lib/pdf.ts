import { buildAnlage1, fillAnlage1 } from './anlage1';
import { fillLbv23 } from './lbv23';
import { loadTemplate } from './template.svelte';
import type { Declaration, Month, Profile } from './types';

const toBlob = (bytes: Uint8Array) =>
  new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });

export async function buildPdf(
  profile: Profile,
  months: Month[],
  declaration: Pick<Declaration, 'date' | 'remarks'>
): Promise<Blob> {
  return toBlob(await fillLbv23(await loadTemplate(), profile, months, declaration));
}

// Das Formular nach Anlage 1 erzeugt die App selbst – ohne Download, einmal pro Sitzung
let anlage1: Promise<Uint8Array> | undefined;

/** Nachweis über geleistete Mehrarbeit (Anlage 1 zu BASS 21-22 Nr. 21) für einen Monat */
export async function buildAnlage1Pdf(profile: Profile, month: Month): Promise<Blob> {
  anlage1 ??= buildAnlage1();
  return toBlob(await fillAnlage1(await anlage1, profile, month));
}
