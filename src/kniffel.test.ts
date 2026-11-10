import { describe, expect, it } from 'vitest';
import { freieFelder, istFertig, moeglicheWerte, punkteFuer, summen, ALLE_FELDER } from './kniffel';

describe('Kniffel – Punkte je Feld', () => {
  it('oberer Block zählt nur die eigene Augenzahl', () => {
    expect(punkteFuer('dreier', [3, 3, 1, 3, 6])).toBe(9);
    expect(punkteFuer('sechser', [1, 2, 3, 4, 5])).toBe(0);
    expect(punkteFuer('einser', [1, 1, 1, 1, 1])).toBe(5);
  });

  it('Dreier-/Viererpasch zählen alle Augen', () => {
    expect(punkteFuer('dreierpasch', [4, 4, 4, 2, 6])).toBe(20);
    expect(punkteFuer('dreierpasch', [4, 4, 5, 2, 6])).toBe(0);
    expect(punkteFuer('viererpasch', [2, 2, 2, 2, 5])).toBe(13);
    expect(punkteFuer('viererpasch', [2, 2, 2, 5, 5])).toBe(0);
    expect(punkteFuer('viererpasch', [6, 6, 6, 6, 6])).toBe(30); // Kniffel ist auch ein Viererpasch
  });

  it('Full House: 3+2, ein Kniffel zählt nicht', () => {
    expect(punkteFuer('fullhouse', [2, 2, 5, 5, 5])).toBe(25);
    expect(punkteFuer('fullhouse', [2, 2, 2, 2, 5])).toBe(0);
    expect(punkteFuer('fullhouse', [3, 3, 3, 3, 3])).toBe(0);
  });

  it('Straßen', () => {
    expect(punkteFuer('kleineStrasse', [1, 2, 3, 4, 6])).toBe(30);
    expect(punkteFuer('kleineStrasse', [3, 4, 5, 6, 6])).toBe(30);
    expect(punkteFuer('kleineStrasse', [2, 3, 4, 4, 5])).toBe(30);
    expect(punkteFuer('kleineStrasse', [1, 2, 3, 5, 6])).toBe(0);
    expect(punkteFuer('grosseStrasse', [1, 2, 3, 4, 5])).toBe(40);
    expect(punkteFuer('grosseStrasse', [6, 5, 4, 3, 2])).toBe(40);
    expect(punkteFuer('grosseStrasse', [1, 2, 3, 4, 6])).toBe(0);
    expect(punkteFuer('grosseStrasse', [1, 2, 3, 4, 4])).toBe(0);
  });

  it('Kniffel und Chance', () => {
    expect(punkteFuer('kniffel', [4, 4, 4, 4, 4])).toBe(50);
    expect(punkteFuer('kniffel', [4, 4, 4, 4, 3])).toBe(0);
    expect(punkteFuer('chance', [1, 2, 3, 4, 6])).toBe(16);
  });
});

describe('Kniffel – Summen', () => {
  it('Bonus 35 ab genau 63 im oberen Block', () => {
    const grenze = { einser: 3, zweier: 6, dreier: 9, vierer: 12, fuenfer: 15, sechser: 18 }; // 63
    expect(summen(grenze)).toMatchObject({ oben: 63, bonus: 35, gesamt: 98, bisBonus: 0 });
    expect(summen({ ...grenze, sechser: 12 })).toMatchObject({ oben: 57, bonus: 0, bisBonus: 6 });
  });

  it('gestrichene Felder (0) zählen als belegt', () => {
    expect(freieFelder({ kniffel: 0 })).toHaveLength(12);
    const voll = Object.fromEntries(ALLE_FELDER.map(f => [f, 0]));
    expect(istFertig(voll)).toBe(true);
  });

  it('möglicher Wert je Feld passt zur Wertung', () => {
    expect(moeglicheWerte('vierer')).toEqual([0, 4, 8, 12, 16, 20]);
    expect(moeglicheWerte('kniffel')).toEqual([0, 50]);
    expect(moeglicheWerte('chance')).toBe('frei');
  });
});

import { erlaubteFelder } from './kniffel';

describe('Yahtzee – weiterer Yahtzee und Joker-Regel', () => {
  const y = [4, 4, 4, 4, 4];
  it('ohne belegtes Yahtzee-Feld oder bei Kniffel-Regeln gilt der normale Wurf', () => {
    expect(erlaubteFelder(y, {}, 'yahtzee').joker).toBe(false);
    expect(erlaubteFelder(y, { kniffel: 50 }, 'kniffel').joker).toBe(false);
    expect(erlaubteFelder([1, 2, 3, 4, 6], { kniffel: 50 }, 'yahtzee').joker).toBe(false);
  });

  it('1. Pflicht: das passende obere Feld, wenn frei – mit Prämie bei 50', () => {
    const e = erlaubteFelder(y, { kniffel: 50 }, 'yahtzee');
    expect(e).toEqual({ felder: { vierer: 20 }, zusatz: true, joker: true });
  });

  it('2. Oberes Feld belegt: freie untere Felder, Full House/Straßen voll', () => {
    const e = erlaubteFelder(y, { kniffel: 50, vierer: 12 }, 'yahtzee');
    expect(e.felder.fullhouse).toBe(25);
    expect(e.felder.kleineStrasse).toBe(30);
    expect(e.felder.grosseStrasse).toBe(40);
    expect(e.felder.dreierpasch).toBe(20);
    expect(e.felder.chance).toBe(20);
    expect(e.felder.einser).toBeUndefined(); // oben ist nicht erlaubt, solange unten etwas frei ist
    expect(e.felder.kniffel).toBeUndefined();
  });

  it('3. Unten alles voll: nur oben, dort 0', () => {
    const unten = { dreierpasch: 1, viererpasch: 1, fullhouse: 1, kleineStrasse: 1, grosseStrasse: 1, kniffel: 50, chance: 1, vierer: 8 };
    expect(erlaubteFelder(y, unten, 'yahtzee').felder).toEqual({ einser: 0, zweier: 0, dreier: 0, fuenfer: 0, sechser: 0 });
  });

  it('bei gestrichenem Yahtzee-Feld (0): Joker ja, Prämie nein', () => {
    const e = erlaubteFelder(y, { kniffel: 0 }, 'yahtzee');
    expect(e.joker).toBe(true);
    expect(e.zusatz).toBe(false);
  });

  it('Summe enthält 100 je weiterem Yahtzee', () => {
    expect(summen({ kniffel: 50 }, 2)).toMatchObject({ zusatz: 200, gesamt: 250 });
  });
});
