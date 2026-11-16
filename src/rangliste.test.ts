import { describe, expect, it } from 'vitest';
import { bekannteNamen, tabelle, type Partie } from './rangliste';

const p = (id: string, spiel: Partie['spiel'], spieler: string[], sieger: string[], datum = 1): Partie => ({ id, spiel, datum, spieler, sieger });

describe('Rangliste', () => {
  const partien = [
    p('1', 'schocken', ['Anna', 'Ben'], ['Anna'], 1),
    p('2', 'schocken', ['Anna', 'Ben'], ['Ben'], 2),
    p('3', 'schocken', ['ben', 'anna'], ['anna'], 3), // andere Schreibweise = dieselben Personen, zuletzt gespielt
    p('4', 'kniffel', ['Anna', 'Ben', 'Clara'], ['Clara'], 0),
  ];

  it('zählt Siege und Spiele je Name, Schreibweise egal', () => {
    expect(tabelle(partien, 'schocken')).toEqual([
      { name: 'anna', siege: 2, spiele: 3, quote: 2 / 3 },
      { name: 'ben', siege: 1, spiele: 3, quote: 1 / 3 },
    ]);
  });

  it('Gesamtwertung über alle Spiele, Sortierung nach Siegen, dann Quote', () => {
    const t = tabelle(partien);
    expect(t.map(z => [z.name, z.siege, z.spiele])).toEqual([['anna', 2, 4], ['Clara', 1, 1], ['ben', 1, 4]]);
  });

  it('Gleichstand teilt den Sieg, Remis zählt nur als Spiel', () => {
    const t = tabelle([p('a', 'kniffel', ['A', 'B'], ['A', 'B']), p('b', 'schach', ['A', 'B'], [])]);
    expect(t).toEqual([
      { name: 'A', siege: 1, spiele: 2, quote: 0.5 },
      { name: 'B', siege: 1, spiele: 2, quote: 0.5 },
    ]);
  });

  it('derselbe Name zweimal in einer Partie zählt einmal, leere Namen gar nicht', () => {
    const t = tabelle([p('x', 'kniffel', ['Max', 'max', ' '], ['Max'])]);
    expect(t).toEqual([{ name: 'Max', siege: 1, spiele: 1, quote: 1 }]);
  });

  it('Namensvorschläge: wer am häufigsten spielt, steht vorn', () => {
    expect(bekannteNamen(partien)).toEqual(['anna', 'ben', 'Clara']);
  });
});
