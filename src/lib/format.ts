import type { Month } from './types.ts';

export const byMonth = (a: Month, b: Month) => a.month.localeCompare(b.month);
export const monthLabel = (m: string) => `${m.slice(5, 7)}-${m.slice(0, 4)}`; // 2026-01 → 01-2026
export const dateLabel = (d: string) => (d ? d.split('-').reverse().join('.') : '');
