import { describe, expect, it } from 'vitest';
import { neuesSchocken, rueckgaengig, verlieren } from './schocken';

const spiel = () => neuesSchocken('Anna', 'Ben');

describe('Schocken – erste Hälfte', () => {
  it('Deckel kommen aus der Mitte zum Verlierer', () => {
    const s = verlieren(spiel(), 0, 3);
    expect(s.z).toMatchObject({ vorrat: 10, deckel: [3, 0], phase: 'haelfte1' });
  });

  it('nimmt nie mehr, als in der Mitte liegt – danach holt der Verlierer beim anderen', () => {
    let s = verlieren(spiel(), 0, 6);
    s = verlieren(s, 1, 6); // vorrat 1
    s = verlieren(s, 1, 4); // nimmt nur 1 aus der Mitte
    expect(s.z).toMatchObject({ vorrat: 0, deckel: [6, 7] });
    s = verlieren(s, 0, 2); // Mitte leer: 2 von Ben
    expect(s.z).toMatchObject({ deckel: [8, 5] });
  });

  it('Hälfte endet bei 13 Deckeln, die zweite beginnt mit frischem Vorrat', () => {
    let s = verlieren(spiel(), 0, 6);
    s = verlieren(s, 1, 6);
    s = verlieren(s, 0, 1); // Anna 7, Ben 6, Vorrat 0
    s = verlieren(s, 0, 6); // holt 6 von Ben -> 13
    expect(s.z).toMatchObject({ phase: 'haelfte2', vorrat: 13, deckel: [0, 0], verloren: [1, 0] });
    expect(s.z.meldung).toContain('1. Hälfte');
  });

  it('Schock Out: sofort alle 13, Hälfte verloren', () => {
    const s = verlieren(spiel(), 1, 1, true);
    expect(s.z).toMatchObject({ phase: 'haelfte2', verloren: [0, 1] });
  });
});

describe('Schocken – Ende', () => {
  const haelfteVerlieren = (s: ReturnType<typeof spiel>, wer: 0 | 1) => verlieren(s, wer, 1, true);

  it('beide Hälften verloren = Spiel verloren', () => {
    const s = haelfteVerlieren(haelfteVerlieren(spiel(), 0), 0);
    expect(s.z).toMatchObject({ phase: 'ende', verlierer: 0 });
  });

  it('je eine Hälfte verloren = Finale, wer es verliert, verliert das Spiel', () => {
    let s = haelfteVerlieren(haelfteVerlieren(spiel(), 0), 1);
    expect(s.z.phase).toBe('finale');
    s = verlieren(s, 1, 1);
    expect(s.z).toMatchObject({ phase: 'ende', verlierer: 1 });
    expect(verlieren(s, 0, 1)).toBe(s); // nach dem Ende nichts mehr
  });

  it('Rückgängig stellt den Zustand davor her, auch über die Hälfte hinweg', () => {
    const s0 = spiel();
    const s1 = haelfteVerlieren(s0, 0);
    expect(rueckgaengig(s1).z).toEqual(s0.z);
    expect(rueckgaengig(s0)).toBe(s0);
  });
});
