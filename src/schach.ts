import { Chess, type Move } from 'chess.js';

/** Schach zu zweit an einem Gerät. Die Regeln liefert chess.js, hier liegen nur Speichern und Anzeigehilfen. */

export type Ausgang = 'weiss' | 'schwarz' | 'remis';

export interface Stand {
  /** Alle Züge in Standardnotation, daraus lässt sich die Partie jederzeit nachspielen. */
  zuege: string[];
  /** Von Hand beendet (Aufgabe, Remis-Einigung). Matt/Patt ergeben sich aus der Stellung. */
  beendet: { ausgang: Ausgang; grund: string } | null;
  gedreht: boolean;
}

export const leerer = (): Stand => ({ zuege: [], beendet: null, gedreht: false });

export function spielAus(stand: Stand): Chess {
  const c = new Chess();
  for (const z of stand.zuege) c.move(z);
  return c;
}

export interface Lage { text: string; ausgang: Ausgang | null; schach: boolean; vorbei: boolean }

/** Wie steht die Partie? `ausgang` ist gesetzt, sobald sie entschieden oder remis ist. */
export function lage(c: Chess, beendet: Stand['beendet']): Lage {
  if (beendet) return { text: beendet.grund, ausgang: beendet.ausgang, schach: false, vorbei: true };
  const am = c.turn() === 'w' ? 'Weiß' : 'Schwarz';
  if (c.isCheckmate()) {
    const sieger = c.turn() === 'w' ? 'schwarz' : 'weiss';
    return { text: `Schachmatt – ${sieger === 'weiss' ? 'Weiß' : 'Schwarz'} gewinnt`, ausgang: sieger, schach: true, vorbei: true };
  }
  if (c.isStalemate()) return { text: 'Patt – Remis', ausgang: 'remis', schach: false, vorbei: true };
  if (c.isInsufficientMaterial()) return { text: 'Zu wenig Material – Remis', ausgang: 'remis', schach: false, vorbei: true };
  if (c.isThreefoldRepetition()) return { text: 'Dreifache Stellungswiederholung – Remis', ausgang: 'remis', schach: false, vorbei: true };
  if (c.isDraw()) return { text: '50-Züge-Regel – Remis', ausgang: 'remis', schach: false, vorbei: true };
  return { text: c.inCheck() ? `Schach! ${am} ist am Zug` : `${am} ist am Zug`, ausgang: null, schach: c.inCheck(), vorbei: false };
}

/** Geschlagene Figuren je Farbe (Schlagende Seite → Liste der Figurenbuchstaben). */
export function geschlagen(c: Chess): { w: string[]; b: string[] } {
  const w: string[] = []; // von Weiß geschlagen (schwarze Figuren)
  const b: string[] = [];
  for (const m of c.history({ verbose: true }) as Move[]) {
    if (m.captured) (m.color === 'w' ? w : b).push(m.captured);
  }
  const ordnung = 'qrbnp';
  const sortiere = (l: string[]) => l.sort((x, y) => ordnung.indexOf(x) - ordnung.indexOf(y));
  return { w: sortiere(w), b: sortiere(b) };
}

/** Gefüllte Symbole für beide Farben; Textvariante erzwingen, damit iOS keine Emojis zeichnet. */
export const SYMBOL: Record<string, string> = {
  k: '♚︎', q: '♛︎', r: '♜︎', b: '♝︎', n: '♞︎', p: '♟︎',
};

export const FIGUR_NAME: Record<string, string> = {
  k: 'König', q: 'Dame', r: 'Turm', b: 'Läufer', n: 'Springer', p: 'Bauer',
};

const KEY = 'wuerfelspiele.schach.v1';

export function laden(): Stand | null {
  try {
    const roh = localStorage.getItem(KEY);
    if (!roh) return null;
    const s = JSON.parse(roh) as Stand;
    if (!Array.isArray(s.zuege) || !s.zuege.every(z => typeof z === 'string')) return null;
    spielAus(s); // wirft bei einem ungültigen Zug
    return { zuege: s.zuege, beendet: s.beendet ?? null, gedreht: !!s.gedreht };
  } catch {
    return null;
  }
}
export const speichern = (s: Stand | null): void => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch { /* Speicher gesperrt – die Partie läuft trotzdem weiter */ }
};
