/** Kniffel- und Yahtzee-Regeln: reine Funktionen, keine Oberfläche. */

export type Variante = 'kniffel' | 'yahtzee';

export const VARIANTEN: Record<Variante, { titel: string; kniffelName: string }> = {
  kniffel: { titel: 'Kniffel', kniffelName: 'Kniffel' },
  yahtzee: { titel: 'Yahtzee', kniffelName: 'Yahtzee' },
};

/** Prämie je weiterem Yahtzee (nur Yahtzee-Regeln, nur wenn das Yahtzee-Feld 50 zeigt). */
export const ZUSATZ_BONUS = 100;

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

export const feldName = (feld: Feld, v: Variante): string => (feld === 'kniffel' ? VARIANTEN[v].kniffelName : FELD_NAME[feld]);

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
  /** Punkte aus weiteren Yahtzee (100 je Stück). */
  zusatz: number;
  gesamt: number;
  /** Noch so viele Punkte im oberen Block bis zum Bonus (0 = erreicht). */
  bisBonus: number;
}

export function summen(blatt: Blatt, zusatzAnzahl = 0): Summen {
  const oben = OBERER_BLOCK.reduce((s, f) => s + (blatt[f] ?? 0), 0);
  const unten = UNTERER_BLOCK.reduce((s, f) => s + (blatt[f] ?? 0), 0);
  const bonus = oben >= BONUS_AB ? BONUS_PUNKTE : 0;
  const zusatz = zusatzAnzahl * ZUSATZ_BONUS;
  return { oben, bonus, unten, zusatz, gesamt: oben + bonus + unten + zusatz, bisBonus: Math.max(0, BONUS_AB - oben) };
}

export const freieFelder = (blatt: Blatt): Feld[] => ALLE_FELDER.filter(f => blatt[f] === undefined);
export const istFertig = (blatt: Blatt): boolean => freieFelder(blatt).length === 0;

export const istFuenferPasch = (w: Wurf): boolean => w.length === 5 && w.every(a => a === w[0]);

/** Wie viel ein weiterer Yahtzee zählt und wo er stehen darf. `zusatz` = Prämie fällig. */
export interface Erlaubt { felder: Partial<Record<Feld, number>>; zusatz: boolean; joker: boolean }

/**
 * Freie Felder mit den Punkten, die der Wurf dort bringt.
 * Kniffel: jedes freie Feld, wie gewürfelt.
 * Yahtzee, Wurf = fünf Gleiche und das Yahtzee-Feld ist schon belegt (Joker-Regel):
 *  1. Das passende obere Feld, wenn frei – nur dieses.
 *  2. Sonst ein freies unteres Feld; Full House und Straßen zählen dann voll (25/30/40).
 *  3. Sonst ein freies oberes Feld mit 0.
 * Die 100-Punkte-Prämie gibt es nur, wenn im Yahtzee-Feld 50 steht (bei 0 gilt die Joker-Regel, aber keine Prämie).
 */
export function erlaubteFelder(wurf: Wurf, blatt: Blatt, variante: Variante): Erlaubt {
  const frei = freieFelder(blatt);
  const normal = () => Object.fromEntries(frei.map(f => [f, punkteFuer(f, wurf)])) as Partial<Record<Feld, number>>;
  if (variante !== 'yahtzee' || !istFuenferPasch(wurf) || blatt.kniffel === undefined) {
    return { felder: normal(), zusatz: false, joker: false };
  }
  const zusatz = blatt.kniffel === 50;
  const augen = wurf[0];
  const oben = OBERER_BLOCK[augen - 1];
  if (frei.includes(oben)) return { felder: { [oben]: augen * 5 }, zusatz, joker: true };
  const untenFrei = UNTERER_BLOCK.filter(f => frei.includes(f));
  if (untenFrei.length) {
    const jokerWert: Partial<Record<Feld, number>> = { fullhouse: 25, kleineStrasse: 30, grosseStrasse: 40 };
    return {
      felder: Object.fromEntries(untenFrei.map(f => [f, jokerWert[f] ?? punkteFuer(f, wurf)])),
      zusatz, joker: true,
    };
  }
  return { felder: Object.fromEntries(frei.map(f => [f, 0])), zusatz, joker: true };
}
