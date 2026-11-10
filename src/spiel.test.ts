import { describe, expect, it } from 'vitest';
import { ALLE_FELDER } from './kniffel';
import { eintragen, neuesSpiel, rangliste, rueckgaengig, spielZuEnde } from './spiel';

describe('Spielablauf', () => {
  it('Eintrag rückt den Zug weiter, Rückgängig stellt alles her', () => {
    const s0 = neuesSpiel(['Anna', 'Ben']);
    const s1 = eintragen(s0, 0, 'kniffel', 50);
    expect(s1.dran).toBe(1);
    expect(s1.spieler[0].blatt.kniffel).toBe(50);
    expect(rueckgaengig(s1)).toEqual({ ...s0, verlauf: [] });
  });

  it('Korrektur eines fremden oder belegten Felds ändert nicht, wer dran ist', () => {
    let s = neuesSpiel(['Anna', 'Ben']);
    s = eintragen(s, 0, 'chance', 20);
    s = eintragen(s, 0, 'chance', 22); // Anna ist nicht dran, Feld belegt → Korrektur
    expect(s.dran).toBe(1);
    expect(s.spieler[0].blatt.chance).toBe(22);
    expect(rueckgaengig(s).spieler[0].blatt.chance).toBe(20);
  });

  it('Spielende und Rangliste mit Gleichstand', () => {
    let s = neuesSpiel(['A', 'B', 'C']);
    for (const f of ALLE_FELDER) for (let p = 0; p < 3; p++) s = eintragen(s, p, f, p === 2 ? 0 : f === 'chance' ? 10 : 0);
    expect(spielZuEnde(s)).toBe(true);
    expect(rangliste(s).map(r => [r.name, r.platz])).toEqual([['A', 1], ['B', 1], ['C', 3]]);
  });

  it('leere Namen werden zu „Spieler n“', () => {
    expect(neuesSpiel(['', ' Zoe ']).spieler.map(s => s.name)).toEqual(['Spieler 1', 'Zoe']);
  });
});

describe('Spielablauf – weiterer Yahtzee', () => {
  it('Prämie wird gezählt und mit Rückgängig wieder abgezogen', () => {
    let s = neuesSpiel(['A', 'B'], 'yahtzee');
    s = eintragen(s, 0, 'kniffel', 50);
    s = eintragen(s, 1, 'chance', 20);
    s = eintragen(s, 0, 'vierer', 20, true);
    expect(s.spieler[0].zusatz).toBe(1);
    expect(rueckgaengig(s).spieler[0].zusatz).toBe(0);
  });
});
