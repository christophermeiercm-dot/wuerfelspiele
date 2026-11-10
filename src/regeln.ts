import type { Variante } from './kniffel';

export interface RegelAbschnitt { titel: string; absaetze?: string[]; liste?: string[] }

const GRUNDLAGEN: RegelAbschnitt[] = [
  {
    titel: 'Ziel',
    absaetze: ['Du füllst in 13 Runden alle 13 Felder deines Blocks aus. Wer am Ende die meisten Punkte hat, gewinnt.'],
  },
  {
    titel: 'Ablauf einer Runde',
    liste: [
      'Du würfelst mit fünf Würfeln, bis zu dreimal.',
      'Nach jedem Wurf legst du beliebige Würfel zur Seite und würfelst die übrigen neu. Auch zur Seite gelegte darfst du wieder mitnehmen.',
      'Danach musst du das Ergebnis in genau ein freies Feld eintragen. Passt es nirgends, streichst du ein Feld (0 Punkte).',
      'In der App: die fünf Augen antippen, dann das Feld wählen.',
    ],
  },
  {
    titel: 'Oberer Block',
    liste: [
      'Einser bis Sechser: Es zählt die Summe der Würfel mit dieser Augenzahl. Beispiel: 3-3-3-5-1 bei „Dreier“ = 9.',
      'Bonus: Ab 63 Punkten im oberen Block gibt es 35 Punkte extra. 63 sind genau drei Würfel pro Zahl.',
    ],
  },
  {
    titel: 'Unterer Block',
    liste: [
      'Dreierpasch: mindestens drei gleiche Würfel – alle Augen zählen.',
      'Viererpasch: mindestens vier gleiche Würfel – alle Augen zählen.',
      'Full House: drei gleiche und zwei gleiche Würfel – 25 Punkte.',
      'Kleine Straße: vier Würfel in Folge (z. B. 2-3-4-5) – 30 Punkte.',
      'Große Straße: fünf Würfel in Folge (1-2-3-4-5 oder 2-3-4-5-6) – 40 Punkte.',
      'Kniffel bzw. Yahtzee: fünf gleiche Würfel – 50 Punkte.',
      'Chance: beliebige Würfel – alle Augen zählen.',
    ],
  },
];

const KNIFFEL: RegelAbschnitt[] = [
  ...GRUNDLAGEN,
  {
    titel: 'Besonderheiten (Kniffel)',
    liste: [
      'Ein weiterer Kniffel bringt keine Extrapunkte. Du trägst ihn wie jeden anderen Wurf ein.',
      'Fünf Gleiche zählen in der App nicht als Full House.',
      'Fünf Gleiche zählen aber als Dreier- und Viererpasch.',
    ],
  },
];

const YAHTZEE: RegelAbschnitt[] = [
  ...GRUNDLAGEN,
  {
    titel: 'Weiterer Yahtzee: 100 Punkte Prämie',
    absaetze: [
      'Würfelst du einen Yahtzee, obwohl dein Yahtzee-Feld schon mit 50 gefüllt ist, bekommst du 100 Extrapunkte. Steht dort eine 0 (gestrichen), gibt es keine Prämie.',
    ],
  },
  {
    titel: 'Joker-Regel',
    absaetze: ['Bei einem weiteren Yahtzee (Yahtzee-Feld schon belegt, mit 50 oder 0) trägst du so ein:'],
    liste: [
      '1. Ist das passende obere Feld frei (bei fünf Vierern „Vierer“), musst du dort eintragen.',
      '2. Sonst wählst du ein freies Feld im unteren Block. Full House, Kleine und Große Straße zählen dann voll: 25, 30 bzw. 40 Punkte.',
      '3. Ist unten alles belegt, streichst du ein freies Feld oben (0 Punkte).',
      'Die App erlaubt nur die Felder, die nach dieser Regel möglich sind, und rechnet die Prämie automatisch dazu.',
    ],
  },
];

export const REGELN: Record<Variante, RegelAbschnitt[]> = { kniffel: KNIFFEL, yahtzee: YAHTZEE };
