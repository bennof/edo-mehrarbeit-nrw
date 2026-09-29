// Tagesnachweis nach Anlage 1 zu BASS 21-22 Nr. 21: Wochen Mo–Fr und Summen eines Monats.
// Ohne Browser-Abhängigkeiten.
import type { DayHours } from './types.ts';

export interface Day {
  /** Tag im Monat; null = liegt im Vor- oder Folgemonat */
  day: number | null;
  /** Mo, Di, … */
  weekday: string;
}

export interface Week {
  /** Kalenderwoche nach ISO 8601 */
  kw: number;
  days: Day[];
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

/** ISO-Kalenderwoche eines Datums (UTC) */
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7)); // Donnerstag dieser Woche
  const jan1 = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.floor((t.getTime() - jan1) / 86400000 / 7) + 1;
}

/** Alle Wochen (Mo–Fr), die Werktage des Monats enthalten; month = YYYY-MM */
export function weeksOf(month: string): Week[] {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return [];
  // Montag der Woche, in der der Monat beginnt
  const start = new Date(Date.UTC(y, m - 1, 1));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));

  const weeks: Week[] = [];
  for (const d = start; ; d.setUTCDate(d.getUTCDate() + 7)) {
    const days = WEEKDAYS.map((weekday, i) => {
      const x = new Date(d);
      x.setUTCDate(x.getUTCDate() + i);
      const inMonth = x.getUTCFullYear() === y && x.getUTCMonth() === m - 1;
      return { day: inMonth ? x.getUTCDate() : null, weekday };
    });
    if (days.some((x) => x.day !== null)) weeks.push({ kw: isoWeek(d), days });
    else if (weeks.length) break;
  }
  return weeks;
}

export interface Totals {
  ist: number;
  soll: number;
  ausfall: number;
  /** Geleistete Mehrarbeitsstunden: Ist − Soll */
  mehrarbeit: number;
  /** Mindestens ein Tag ausgefüllt */
  filled: boolean;
}

/** Summen über alle Tage des Monats */
export function totalsOf(days: Record<string, DayHours> = {}): Totals {
  const t: Totals = { ist: 0, soll: 0, ausfall: 0, mehrarbeit: 0, filled: false };
  for (const d of Object.values(days)) {
    t.ist += d.ist ?? 0;
    t.soll += d.soll ?? 0;
    t.ausfall += d.ausfall ?? 0;
    if (d.ist != null || d.soll != null || d.ausfall != null) t.filled = true;
  }
  t.mehrarbeit = t.ist - t.soll;
  return t;
}
