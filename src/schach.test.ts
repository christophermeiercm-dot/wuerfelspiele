import { describe, expect, it } from 'vitest';
import { aktuell, geschlagen, lage, leerer, type Stand } from './schach';
import { START, amZug, brettAus, koenigGeschlagen, ziehe, ziele, type Typ } from './schachFrei';

/** Spielt Züge als [von, nach, promotion?] ab und baut den Stand wie die Oberfläche. */
const spiele = (zuege: [string, string, Typ?][], fen = START): Stand => {
  const s: Stand = { ...leerer(), fens: [fen] };
  for (const [von, nach, promo] of zuege) {
    const g = ziehe(aktuell(s), von, nach, promo);
    s.fens.push(g.fen);
    s.zuege.push({ label: g.label, von, nach, schlag: g.schlag });
  }
  return s;
};
const nachZiele = (fen: string, von: string) => ziele(fen, von).map(z => z.nach).sort();

describe('Schach ohne Hilfe – Bewegung', () => {
  it('Anfangsstellung: Bauer zwei Felder, Springer zwei Züge, Weiß beginnt', () => {
    expect(nachZiele(START, 'e2')).toEqual(['e3', 'e4']);
    expect(nachZiele(START, 'g1')).toEqual(['f3', 'h3']);
    expect(ziele(START, 'e7')).toEqual([]); // Schwarz ist nicht dran
    expect(amZug(START)).toBe('w');
  });

  it('Zug wechselt die Seite und merkt sich geschlagene Figuren', () => {
    const s = spiele([['e2', 'e4'], ['d7', 'd5'], ['e4', 'd5']]);
    expect(amZug(aktuell(s))).toBe('b');
    expect(s.zuege.map(z => z.label)).toEqual(['e2-e4', 'd7-d5', 'e4xd5']);
    expect(geschlagen(s)).toEqual({ w: ['p'], b: [] });
  });

  it('en passant', () => {
    const s = spiele([['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5']]);
    expect(nachZiele(aktuell(s), 'e5')).toContain('d6');
    const t = spiele([['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5'], ['e5', 'd6']]);
    expect(brettAus(aktuell(t)).flat().filter(f => f?.type === 'p' && f.color === 'b').length).toBe(7);
  });

  it('Rochade klappt, wenn frei', () => {
    const s = spiele([['g1', 'f3'], ['a7', 'a6'], ['e2', 'e4'], ['a6', 'a5'], ['f1', 'c4'], ['a5', 'a4']]);
    expect(nachZiele(aktuell(s), 'e1')).toContain('g1');
    const t = spiele([['e1', 'g1']], aktuell(s));
    expect(t.zuege[0].label).toBe('O-O');
    expect(brettAus(aktuell(t)).flat().find(f => f?.type === 'r' && f.color === 'w' && f.square === 'f1')).toBeTruthy();
  });

  it('Umwandlung wählt die Figur', () => {
    const fen = '1n2k3/P7/8/8/8/8/8/4K3 w - - 0 1';
    expect(ziele(fen, 'a7').find(z => z.nach === 'a8')?.umwandlung).toBe(true);
    const s = spiele([['a7', 'a8', 'n']], fen);
    expect(brettAus(aktuell(s))[0][0]).toMatchObject({ type: 'n', color: 'w' });
    expect(s.zuege[0].label).toBe('a7-a8=S');
  });
});

describe('Schach ohne Hilfe – keine Schachregeln', () => {
  it('Figur im Schach darf wegziehen, auch gefesselte und der König auf ein bedrohtes Feld', () => {
    // Schwarzer Turm e8 fesselt den weißen Läufer e2 am König e1, der weiße König steht im Schach.
    const fen = '4r2k/8/8/8/8/8/4B3/4K3 w - - 0 1';
    expect(nachZiele(fen, 'e2')).toContain('d3'); // gefesselt, nach echten Regeln verboten
    expect(nachZiele(fen, 'e1')).toContain('d1');
    expect(nachZiele(fen, 'e1')).toContain('f1');
    expect(lage({ ...leerer(), fens: [fen] }, 'w').text).toBe('Weiß ist am Zug'); // keine Schach-Warnung
  });

  it('wer den König nicht rettet, verliert ihn', () => {
    const fen = '4k3/8/8/8/8/8/P7/R3K2r w - - 0 1'; // Turm h1 bedroht Ke1 über f1,g1 (frei), Weiß zieht a2-a3
    const s = spiele([['a2', 'a3'], ['h1', 'e1']], fen); // Schwarz schlägt den König
    expect(koenigGeschlagen(aktuell(s))).toBe('w');
    expect(lage(s, amZug(aktuell(s)))).toMatchObject({ ausgang: 'schwarz', vorbei: true });
    expect(lage(s, 'w').text).toContain('König geschlagen');
    expect(ziele(aktuell(s), 'a1')).toEqual([]); // nach dem Ende kein Zug mehr
  });

  it('Aufgabe beendet von Hand', () => {
    const s: Stand = { ...leerer(), beendet: { ausgang: 'weiss', grund: 'Schwarz gibt auf – Weiß gewinnt' } };
    expect(lage(s, 'w')).toMatchObject({ vorbei: true, ausgang: 'weiss' });
  });
});
