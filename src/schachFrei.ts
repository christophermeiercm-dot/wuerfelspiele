import { Chess, type Square } from 'chess.js';

/**
 * Schach „wie am echten Brett“: Es gibt keine Schach-Warnung und keinen Zwang.
 * Erlaubt ist jeder Zug, den die Figur nach ihrer Bewegungsregel machen darf – auch wenn der eigene König danach
 * (oder schon vorher) bedroht ist. Verloren hat, wessen König geschlagen wird.
 * chess.js liefert nur die Bewegungsregeln der Figuren (ohne König, damit keine Schachprüfung greift) und die Rochade.
 */

export type Farbe = 'w' | 'b';
export type Typ = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export interface Fig { type: Typ; color: Farbe }

export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const DATEIEN = 'abcdefgh';

const parse = (fen: string) => {
  const [placement, turn, castling, ep, half, full] = fen.split(' ');
  const brett = new Map<string, Fig>();
  placement.split('/').forEach((reihe, i) => {
    let s = 0;
    for (const ch of reihe) {
      if (/\d/.test(ch)) { s += Number(ch); continue; }
      brett.set(`${DATEIEN[s]}${8 - i}`, { type: ch.toLowerCase() as Typ, color: ch === ch.toUpperCase() ? 'w' : 'b' });
      s += 1;
    }
  });
  return { brett, turn: turn as Farbe, castling, ep, half: Number(half), full: Number(full) };
};

const schreibe = (p: ReturnType<typeof parse>): string => {
  const reihen: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let t = '';
    let leer = 0;
    for (const d of DATEIEN) {
      const f = p.brett.get(`${d}${r}`);
      if (!f) { leer += 1; continue; }
      if (leer) { t += leer; leer = 0; }
      t += f.color === 'w' ? f.type.toUpperCase() : f.type;
    }
    reihen.push(t + (leer || ''));
  }
  return `${reihen.join('/')} ${p.turn} ${p.castling || '-'} ${p.ep} ${p.half} ${p.full}`;
};

export const amZug = (fen: string): Farbe => parse(fen).turn;

/** Brett als 8×8, oberste Reihe = Reihe 8. */
export function brettAus(fen: string): ({ type: Typ; color: Farbe; square: Square } | null)[][] {
  const { brett } = parse(fen);
  return Array.from({ length: 8 }, (_, i) =>
    Array.from({ length: 8 }, (_, s) => {
      const sq = `${DATEIEN[s]}${8 - i}` as Square;
      const f = brett.get(sq);
      return f ? { ...f, square: sq } : null;
    }),
  );
}

export const figurAuf = (fen: string, feld: string): Fig | undefined => parse(fen).brett.get(feld);

/** Wer seinen König verloren hat (null: beide da). */
export function koenigGeschlagen(fen: string): Farbe | null {
  const { brett } = parse(fen);
  const hat = (c: Farbe) => [...brett.values()].some(f => f.type === 'k' && f.color === c);
  if (!hat('w')) return 'w';
  if (!hat('b')) return 'b';
  return null;
}

export interface Ziel { nach: Square; umwandlung: boolean; schlag: boolean; rochade: boolean }

/** Alle Felder, auf die die Figur auf `von` ziehen darf. Leer, wenn dort keine Figur des Zugrechts steht. */
export function ziele(fen: string, von: string): Ziel[] {
  const p = parse(fen);
  const fig = p.brett.get(von);
  if (!fig || fig.color !== p.turn || koenigGeschlagen(fen)) return [];
  const aufs = (nach: string) => p.brett.get(nach);

  if (fig.type === 'k') {
    const out: Ziel[] = [];
    const d = DATEIEN.indexOf(von[0]);
    const r = Number(von[1]);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const nd = d + dx;
      const nr = r + dy;
      if (nd < 0 || nd > 7 || nr < 1 || nr > 8) continue;
      const nach = `${DATEIEN[nd]}${nr}` as Square;
      const f = aufs(nach);
      if (f && f.color === fig.color) continue;
      out.push({ nach, umwandlung: false, schlag: !!f, rochade: false });
    }
    // Rochade nur, wenn sie nach den echten Regeln erlaubt ist (kein Schach, nicht durch Schach).
    const echt = new Chess(fen, { skipValidation: true });
    for (const m of echt.moves({ square: von as Square, verbose: true })) {
      if (m.flags.includes('k') || m.flags.includes('q')) out.push({ nach: m.to, umwandlung: false, schlag: false, rochade: true });
    }
    return out;
  }

  // Andere Figuren: Bewegungsregeln ohne Schachprüfung → eigenen König und Rochaderechte entfernen.
  const ohne = parse(fen);
  for (const [sq, f] of ohne.brett) if (f.type === 'k' && f.color === p.turn) ohne.brett.delete(sq);
  ohne.castling = '-';
  const gen = new Chess(schreibe(ohne), { skipValidation: true });
  const gesehen = new Map<string, Ziel>();
  for (const m of gen.moves({ square: von as Square, verbose: true })) {
    if (gesehen.has(m.to)) continue;
    gesehen.set(m.to, { nach: m.to, umwandlung: !!m.promotion, schlag: !!m.captured, rochade: false });
  }
  return [...gesehen.values()];
}

const BUCHSTABE: Record<Typ, string> = { k: 'K', q: 'D', r: 'T', b: 'L', n: 'S', p: '' };

export interface Gezogen { fen: string; label: string; schlag: Typ | null }

/** Führt den Zug aus. `nach` muss in `ziele(fen, von)` stehen. */
export function ziehe(fen: string, von: string, nach: string, promotion?: Typ): Gezogen {
  const p = parse(fen);
  const fig = p.brett.get(von);
  if (!fig) throw new Error(`Auf ${von} steht keine Figur`);
  const z = ziele(fen, von).find(t => t.nach === nach);
  if (!z) throw new Error(`${von}-${nach} ist kein erlaubter Zug`);

  if (z.rochade) {
    const echt = new Chess(fen, { skipValidation: true });
    const m = echt.move({ from: von as Square, to: nach as Square });
    return { fen: echt.fen(), label: m.flags.includes('k') ? 'O-O' : 'O-O-O', schlag: null };
  }

  let geschlagen = p.brett.get(nach);
  let epFeld: string | null = null;
  if (fig.type === 'p' && nach === p.ep && !geschlagen) {
    epFeld = `${nach[0]}${von[1]}`; // Bauer im Vorbeigehen
    geschlagen = p.brett.get(epFeld);
    p.brett.delete(epFeld);
  }
  p.brett.delete(von);
  const neu: Fig = z.umwandlung ? { type: promotion ?? 'q', color: fig.color } : fig;
  p.brett.set(nach, neu);

  // Rochaderechte: König bewegt oder Turm bewegt/geschlagen.
  let rechte = p.castling === '-' ? '' : p.castling;
  if (fig.type === 'k') rechte = rechte.replace(fig.color === 'w' ? /[KQ]/g : /[kq]/g, '');
  const ecken: Record<string, string> = { a1: 'Q', h1: 'K', a8: 'q', h8: 'k' };
  for (const sq of [von, nach]) if (ecken[sq]) rechte = rechte.replace(ecken[sq], '');
  p.castling = rechte || '-';

  p.ep = fig.type === 'p' && Math.abs(Number(nach[1]) - Number(von[1])) === 2 ? `${von[0]}${(Number(nach[1]) + Number(von[1])) / 2}` : '-';
  p.half = fig.type === 'p' || geschlagen ? 0 : p.half + 1;
  if (p.turn === 'b') p.full += 1;
  p.turn = p.turn === 'w' ? 'b' : 'w';

  const label = `${BUCHSTABE[fig.type]}${von}${geschlagen ? 'x' : '-'}${nach}${z.umwandlung ? '=' + BUCHSTABE[neu.type] : ''}`;
  return { fen: schreibe(p), label, schlag: geschlagen ? geschlagen.type : null };
}
