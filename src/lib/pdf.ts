import { fillLbv23 } from './lbv23';
import { loadTemplate } from './template.svelte';
import type { Declaration, Month, Profile } from './types';

export async function buildPdf(
  profile: Profile,
  months: Month[],
  declaration: Pick<Declaration, 'date' | 'remarks'>
): Promise<Blob> {
  const bytes = await fillLbv23(await loadTemplate(), profile, months, declaration);
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}
