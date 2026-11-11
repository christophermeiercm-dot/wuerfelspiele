import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { geschlagen, lage, leerer, spielAus } from './schach';

const partie = (...zuege: string[]) => spielAus({ ...leerer(), zuege });

describe('Schach – Lage', () => {
  it('Anfangsstellung: Weiß am Zug, nicht vorbei', () => {
    expect(lage(new Chess(), null)).toMatchObject({ text: 'Weiß ist am Zug', vorbei: false, ausgang: null });
  });

  it('Schäfermatt: Weiß gewinnt', () => {
    const l = lage(partie('e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'), null);
    expect(l).toMatchObject({ ausgang: 'weiss', vorbei: true });
    expect(l.text).toContain('Schachmatt');
  });

  it('Narrenmatt: Schwarz gewinnt', () => {
    expect(lage(partie('f3', 'e5', 'g4', 'Qh4#'), null).ausgang).toBe('schwarz');
  });

  it('Schach wird gemeldet, Spiel läuft weiter', () => {
    const l = lage(partie('e4', 'f6', 'Qh5+'), null);
    expect(l).toMatchObject({ schach: true, vorbei: false });
    expect(l.text).toContain('Schach!');
  });

  it('Aufgabe und Remis-Einigung beenden von Hand', () => {
    const b = { ausgang: 'schwarz' as const, grund: 'Weiß gibt auf – Schwarz gewinnt' };
    expect(lage(new Chess(), b)).toMatchObject({ vorbei: true, ausgang: 'schwarz' });
  });

  it('Patt ist Remis', () => {
    const c = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(lage(c, null)).toMatchObject({ ausgang: 'remis', vorbei: true });
  });
});

describe('Schach – Nachspielen und Schlagen', () => {
  it('Stand lässt sich aus der Zugliste wiederherstellen', () => {
    const c = partie('e4', 'e5', 'Nf3');
    expect(c.history()).toEqual(['e4', 'e5', 'Nf3']);
  });

  it('geschlagene Figuren je Seite, nach Wert sortiert', () => {
    const g = geschlagen(partie('e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qxg2'));
    expect(g.w).toEqual(['p']);
    expect(g.b).toEqual(['p', 'p']);
  });
});
