import { Chess } from 'chess.js';
import { START, koenigGeschlagen, type Farbe, type Typ } from './schachFrei';

/** Schach zu zweit an einem Gerät, ohne Schach-Warnung. Hier liegen Stand, Speichern und Anzeigehilfen. */

export type Ausgang = 'weiss' | 'schwarz' | 'remis';

export interface ZugEintrag { label: string; von: string; nach: string; schlag: Typ | null }

export interface Stand {
  /** Stellung vor dem ersten Zug und nach jedem Zug (Länge = Züge + 1). */
  fens: string[];
  zuege: ZugEintrag[];
  /** Von Hand beendet (Aufgabe, Remis-Einigung). Sonst endet die Partie, wenn ein König geschlagen wird. */
  beendet: { ausgang: Ausgang; grund: string } | null;
  gedreht: boolean;
}

export const leerer = (): Stand => ({ fens: [START], zuege: [], beendet: null, gedreht: false });
export const aktuell = (s: Stand): string => s.fens[s.fens.length - 1];

export interface Lage { text: string; ausgang: Ausgang | null; vorbei: boolean }

export function lage(s: Stand, am: Farbe): Lage {
  if (s.beendet) return { text: s.beendet.grund, ausgang: s.beendet.ausgang, vorbei: true };
  const weg = koenigGeschlagen(aktuell(s));
  if (weg) {
    const sieger = weg === 'w' ? 'schwarz' : 'weiss';
    return { text: `König geschlagen – ${sieger === 'weiss' ? 'Weiß' : 'Schwarz'} gewinnt`, ausgang: sieger, vorbei: true };
  }
  return { text: am === 'w' ? 'Weiß ist am Zug' : 'Schwarz ist am Zug', ausgang: null, vorbei: false };
}

/** Geschlagene Figuren: `w` = von Weiß geschlagen (schwarze Figuren), `b` = von Schwarz geschlagen. */
export function geschlagen(s: Stand): { w: Typ[]; b: Typ[] } {
  const w: Typ[] = [];
  const b: Typ[] = [];
  s.zuege.forEach((z, i) => { if (z.schlag) (i % 2 === 0 ? w : b).push(z.schlag); });
  const ordnung = 'kqrbnp';
  const sortiere = (l: Typ[]) => l.sort((x, y) => ordnung.indexOf(x) - ordnung.indexOf(y));
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

/** Älterer Stand (Züge als Notation, mit Schachprüfung) → in die neue Form umrechnen. */
function ausAltemStand(zuege: string[]): Stand | null {
  const c = new Chess();
  const s = leerer();
  for (const san of zuege) {
    const m = c.move(san);
    s.fens.push(c.fen());
    s.zuege.push({ label: m.san, von: m.from, nach: m.to, schlag: (m.captured as Typ | undefined) ?? null });
  }
  return s;
}

export function laden(): Stand | null {
  try {
    const roh = localStorage.getItem(KEY);
    if (!roh) return null;
    const s = JSON.parse(roh);
    if (!Array.isArray(s.fens) && Array.isArray(s.zuege) && s.zuege.every((z: unknown) => typeof z === 'string')) {
      const alt = ausAltemStand(s.zuege);
      return alt && { ...alt, beendet: s.beendet ?? null, gedreht: !!s.gedreht };
    }
    const ok = Array.isArray(s.fens) && s.fens.length >= 1 && s.fens.every((f: unknown) => typeof f === 'string') &&
      Array.isArray(s.zuege) && s.zuege.length === s.fens.length - 1;
    return ok ? { fens: s.fens, zuege: s.zuege, beendet: s.beendet ?? null, gedreht: !!s.gedreht } : null;
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
