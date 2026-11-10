import { ALLE_FELDER, istFertig, summen, type Blatt, type Feld, type Variante } from './kniffel';

export interface Spieler { name: string; blatt: Blatt; /** Anzahl weiterer Yahtzee mit Prämie (je 100 Punkte). */ zusatz: number }
export interface Spiel {
  variante: Variante;
  spieler: Spieler[];
  /** Index des Spielers, der dran ist. */
  dran: number;
  /** Eintragungen in Reihenfolge, für „Rückgängig“. */
  verlauf: { spieler: number; feld: Feld; vorher: number | undefined; dranVorher: number; zusatz?: boolean }[];
}

export const neuesSpiel = (namen: string[], variante: Variante = 'kniffel'): Spiel => ({
  variante,
  spieler: namen.map((n, i) => ({ name: n.trim() || `Spieler ${i + 1}`, blatt: {}, zusatz: 0 })),
  dran: 0,
  verlauf: [],
});

/** Schreibt einen Wert ein. Ist der Spieler dran und das Feld frei, rückt der Zug weiter; sonst ist es eine Korrektur. */
export function eintragen(spiel: Spiel, spieler: number, feld: Feld, wert: number | undefined, zusatz = false): Spiel {
  const s = spiel.spieler[spieler];
  if (!s) return spiel;
  const vorher = s.blatt[feld];
  const blatt = { ...s.blatt };
  if (wert === undefined) delete blatt[feld];
  else blatt[feld] = wert;
  const spielerNeu = spiel.spieler.map((x, i) => (i === spieler ? { ...x, blatt, zusatz: x.zusatz + (zusatz ? 1 : 0) } : x));
  const zugWeiter = spieler === spiel.dran && vorher === undefined && wert !== undefined;
  const dran = zugWeiter ? naechster(spielerNeu, spiel.dran) : spiel.dran;
  return {
    ...spiel,
    spieler: spielerNeu,
    dran,
    verlauf: [...spiel.verlauf, { spieler, feld, vorher, dranVorher: spiel.dran, ...(zusatz ? { zusatz: true } : {}) }],
  };
}

/** Nächster Spieler mit noch freien Feldern (alle gleich weit, daher normalerweise der Nächste). */
function naechster(spieler: Spieler[], von: number): number {
  for (let k = 1; k <= spieler.length; k++) {
    const i = (von + k) % spieler.length;
    if (!istFertig(spieler[i].blatt)) return i;
  }
  return von;
}

export function rueckgaengig(spiel: Spiel): Spiel {
  const z = spiel.verlauf[spiel.verlauf.length - 1];
  if (!z) return spiel;
  const spieler = spiel.spieler.map((x, i) => {
    if (i !== z.spieler) return x;
    const blatt = { ...x.blatt };
    if (z.vorher === undefined) delete blatt[z.feld];
    else blatt[z.feld] = z.vorher;
    return { ...x, blatt, zusatz: Math.max(0, x.zusatz - (z.zusatz ? 1 : 0)) };
  });
  return { ...spiel, spieler, dran: z.dranVorher, verlauf: spiel.verlauf.slice(0, -1) };
}

export const spielZuEnde = (spiel: Spiel): boolean => spiel.spieler.every(s => istFertig(s.blatt));

/** Rangliste, Gleichstand teilt sich den Platz. */
export function rangliste(spiel: Spiel): { name: string; punkte: number; platz: number }[] {
  const liste = spiel.spieler
    .map(s => ({ name: s.name, punkte: summen(s.blatt, s.zusatz).gesamt }))
    .sort((a, b) => b.punkte - a.punkte);
  return liste.map(e => ({ ...e, platz: liste.findIndex(x => x.punkte === e.punkte) + 1 }));
}

const schluessel = (v: Variante) => `wuerfelspiele.${v}.v1`;

export function laden(variante: Variante): Spiel | null {
  try {
    const roh = localStorage.getItem(schluessel(variante));
    if (!roh) return null;
    const s = JSON.parse(roh) as Spiel;
    const ok =
      Array.isArray(s.spieler) && s.spieler.length > 0 && typeof s.dran === 'number' &&
      s.spieler.every(x => typeof x.name === 'string' && typeof x.blatt === 'object' &&
        Object.keys(x.blatt).every(k => (ALLE_FELDER as string[]).includes(k)));
    if (!ok) return null;
    return {
      variante,
      dran: s.dran,
      verlauf: Array.isArray(s.verlauf) ? s.verlauf : [],
      spieler: s.spieler.map(x => ({ ...x, zusatz: typeof x.zusatz === 'number' ? x.zusatz : 0 })),
    };
  } catch {
    return null;
  }
}
export const speichern = (variante: Variante, spiel: Spiel | null): void => {
  try {
    if (spiel) localStorage.setItem(schluessel(variante), JSON.stringify(spiel));
    else localStorage.removeItem(schluessel(variante));
  } catch { /* Speicher voll oder gesperrt – das Spiel läuft trotzdem weiter */ }
};
