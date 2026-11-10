/** Kniffel-Regeln: reine Funktionen, keine Oberfläche. */

export type Feld =
  | 'einser' | 'zweier' | 'dreier' | 'vierer' | 'fuenfer' | 'sechser'
  | 'dreierpasch' | 'viererpasch' | 'fullhouse' | 'kleineStrasse' | 'grosseStrasse' | 'kniffel' | 'chance';

export const OBERER_BLOCK: Feld[] = ['einser', 'zweier', 'dreier', 'vierer', 'fuenfer', 'sechser'];
export const UNTERER_BLOCK: Feld[] = [
  'dreierpasch', 'viererpasch', 'fullhouse', 'kleineStrasse', 'grosseStrasse', 'kniffel', 'chance',
];
export const ALLE_FELDER: Feld[] = [...OBERER_BLOCK, ...UNTERER_BLOCK];

export const FELD_NAME: Record<Feld, string> = {
  einser: 'Einser', zweier: 'Zweier', dreier: 'Dreier', vierer: 'Vierer', fuenfer: 'Fünfer', sechser: 'Sechser',
  dreierpasch: 'Dreierpasch', viererpasch: 'Viererpasch', fullhouse: 'Full House',
  kleineStrasse: 'Kleine Straße', grosseStrasse: 'Große Straße', kniffel: 'Kniffel', chance: 'Chance',
};

export const FELD_HINWEIS: Record<Feld, string> = {
  einser: 'Nur Einser zählen', zweier: 'Nur Zweier zählen', dreier: 'Nur Dreier zählen',
  vierer: 'Nur Vierer zählen', fuenfer: 'Nur Fünfer zählen', sechser: 'Nur Sechser zählen',
  dreierpasch: '3 gleiche · alle Augen', viererpasch: '4 gleiche · alle Augen',
  fullhouse: '3 + 2 gleiche · 25', kleineStrasse: '4 in Folge · 30',
  grosseStrasse: '5 in Folge · 40', kniffel: '5 gleiche · 50', chance: 'Alle Augen',
};

export const BONUS_AB = 63;
export const BONUS_PUNKTE = 35;

export type Wurf = number[]; // genau fünf Zahlen 1–6

const zaehlen = (w: Wurf): number[] => {
  const n = [0, 0, 0, 0, 0, 0, 0]; // Index = Augenzahl
  for (const a of w) n[a]++;
  return n;
};
const summe = (w: Wurf) => w.reduce((s, a) => s + a, 0);

/** Punkte, die dieser Wurf im Feld bringen würde (0 = passt nicht / würde gestrichen). */
export function punkteFuer(feld: Feld, wurf: Wurf): number {
  const n = zaehlen(wurf);
  const max = Math.max(...n);
  switch (feld) {
    case 'einser': return n[1] * 1;
    case 'zweier': return n[2] * 2;
    case 'dreier': return n[3] * 3;
    case 'vierer': return n[4] * 4;
    case 'fuenfer': return n[5] * 5;
    case 'sechser': return n[6] * 6;
    case 'dreierpasch': return max >= 3 ? summe(wurf) : 0;
    case 'viererpasch': return max >= 4 ? summe(wurf) : 0;
    case 'fullhouse': return n.includes(3) && n.includes(2) ? 25 : 0; // Kniffel zählt hier nicht
    case 'kleineStrasse':
      return [1, 2, 3].some(s => n[s] && n[s + 1] && n[s + 2] && n[s + 3]) ? 30 : 0;
    case 'grosseStrasse':
      return [1, 2].some(s => [0, 1, 2, 3, 4].every(i => n[s + i] > 0)) ? 40 : 0;
    case 'kniffel': return max === 5 ? 50 : 0;
    case 'chance': return summe(wurf);
  }
}

/** Werte, die ein Feld überhaupt annehmen kann – für die Eingabe ohne Würfel. */
export function moeglicheWerte(feld: Feld): number[] | 'frei' {
  const i = OBERER_BLOCK.indexOf(feld);
  if (i >= 0) return [0, 1, 2, 3, 4, 5].map(k => k * (i + 1));
  if (feld === 'fullhouse') return [0, 25];
  if (feld === 'kleineStrasse') return [0, 30];
  if (feld === 'grosseStrasse') return [0, 40];
  if (feld === 'kniffel') return [0, 50];
  return 'frei';
}

export type Blatt = Partial<Record<Feld, number>>;

export interface Summen {
  oben: number;
  bonus: number;
  unten: number;
  gesamt: number;
  /** Noch so viele Punkte im oberen Block bis zum Bonus (0 = erreicht). */
  bisBonus: number;
}

export function summen(blatt: Blatt): Summen {
  const oben = OBERER_BLOCK.reduce((s, f) => s + (blatt[f] ?? 0), 0);
  const unten = UNTERER_BLOCK.reduce((s, f) => s + (blatt[f] ?? 0), 0);
  const bonus = oben >= BONUS_AB ? BONUS_PUNKTE : 0;
  return { oben, bonus, unten, gesamt: oben + bonus + unten, bisBonus: Math.max(0, BONUS_AB - oben) };
}

export const freieFelder = (blatt: Blatt): Feld[] => ALLE_FELDER.filter(f => blatt[f] === undefined);
export const istFertig = (blatt: Blatt): boolean => freieFelder(blatt).length === 0;
