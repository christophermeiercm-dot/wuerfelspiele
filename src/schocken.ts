/** Schocken zu zweit: nur der Deckelzähler, gewürfelt wird am Tisch. Reine Funktionen. */

export const DECKEL = 13;

export type Phase = 'haelfte1' | 'haelfte2' | 'finale' | 'ende';
export type Seite = 0 | 1;

export interface Zustand {
  /** Deckel, die noch in der Mitte liegen. */
  vorrat: number;
  /** Deckel vor jedem Spieler. */
  deckel: [number, number];
  /** Wie viele Hälften jeder verloren hat. */
  verloren: [number, number];
  phase: Phase;
  /** Wer das Spiel verloren hat (nur in Phase „ende“). */
  verlierer: Seite | null;
  /** Letztes Ereignis als Satz, für die Anzeige. */
  meldung: string;
}

export interface Schocken {
  namen: [string, string];
  z: Zustand;
  /** Frühere Zustände für „Rückgängig“. */
  verlauf: Zustand[];
}

const anfang = (verloren: [number, number] = [0, 0], phase: Phase = 'haelfte1', meldung = ''): Zustand => ({
  vorrat: DECKEL, deckel: [0, 0], verloren, phase, verlierer: null, meldung,
});

export const neuesSchocken = (a: string, b: string): Schocken => ({
  namen: [a.trim() || 'Spieler 1', b.trim() || 'Spieler 2'],
  z: anfang(),
  verlauf: [],
});

const andere = (s: Seite): Seite => (s === 0 ? 1 : 0);

/**
 * Eine Runde ist entschieden: `wer` hat verloren und bekommt `anzahl` Deckel.
 * `schockOut` (1-1-1): Die Hälfte ist sofort verloren, `wer` bekommt alle 13.
 * Im Finale zählt nur, wer die Runde verliert – er verliert das Spiel.
 */
export function verlieren(s: Schocken, wer: Seite, anzahl: number, schockOut = false): Schocken {
  const z = s.z;
  if (z.phase === 'ende') return s;
  const name = s.namen[wer];
  const neu = (n: Partial<Zustand>): Schocken => ({ ...s, z: { ...z, ...n }, verlauf: [...s.verlauf, z] });

  if (z.phase === 'finale') {
    return neu({ phase: 'ende', verlierer: wer, meldung: `${name} verliert das Finale und damit das Spiel.` });
  }

  const deckel: [number, number] = [z.deckel[0], z.deckel[1]];
  let vorrat = z.vorrat;

  let meldung: string;
  if (schockOut) {

    deckel[wer] = DECKEL;
    deckel[andere(wer)] = 0;
    vorrat = 0;
    meldung = `Schock Out! ${name} bekommt alle ${DECKEL} Deckel.`;
  } else if (vorrat > 0) {
    const genommen = Math.min(anzahl, vorrat);
    vorrat -= genommen;
    deckel[wer] += genommen;
    meldung = `${name} nimmt ${genommen} Deckel aus der Mitte.`;
  } else {
    const genommen = Math.min(anzahl, deckel[andere(wer)]);
    deckel[andere(wer)] -= genommen;
    deckel[wer] += genommen;
    meldung = `${name} holt ${genommen} Deckel von ${s.namen[andere(wer)]}.`;
  }

  if (deckel[wer] < DECKEL) return neu({ vorrat, deckel, meldung });

  // Hälfte verloren
  const verloren: [number, number] = [z.verloren[0], z.verloren[1]];
  verloren[wer] += 1;
  const halbText = `${meldung} ${name} hat die ${z.phase === 'haelfte1' ? '1.' : '2.'} Hälfte verloren.`;
  if (z.phase === 'haelfte1') {
    return neu({ ...anfang(verloren, 'haelfte2'), meldung: `${halbText} Die 2. Hälfte beginnt.` });
  }
  if (verloren[wer] === 2) {
    return neu({ ...anfang(verloren, 'ende'), vorrat: 0, deckel, verlierer: wer, meldung: `${halbText} Beide Hälften verloren – ${name} verliert das Spiel.` });
  }
  return neu({ ...anfang(verloren, 'finale'), meldung: `${halbText} Jetzt gibt es das Finale.` });
}

export function rueckgaengig(s: Schocken): Schocken {
  const z = s.verlauf[s.verlauf.length - 1];
  return z ? { ...s, z, verlauf: s.verlauf.slice(0, -1) } : s;
}

const KEY = 'wuerfelspiele.schocken.v1';

export function laden(): Schocken | null {
  try {
    const roh = localStorage.getItem(KEY);
    if (!roh) return null;
    const s = JSON.parse(roh) as Schocken;
    const zahl = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
    const ok = Array.isArray(s.namen) && s.namen.length === 2 && s.z && zahl(s.z.vorrat) &&
      Array.isArray(s.z.deckel) && s.z.deckel.every(zahl) && Array.isArray(s.z.verloren) && s.z.verloren.every(zahl) &&
      ['haelfte1', 'haelfte2', 'finale', 'ende'].includes(s.z.phase);
    return ok ? { ...s, verlauf: Array.isArray(s.verlauf) ? s.verlauf : [] } : null;
  } catch {
    return null;
  }
}
export const speichern = (s: Schocken | null): void => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch { /* Speicher gesperrt – das Spiel läuft trotzdem weiter */ }
};
