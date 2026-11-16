/** Rangliste über alle Spiele: zählt Siege nach Namen. Reine Funktionen plus Speicher im Browser. */

export type SpielArt = 'kniffel' | 'yahtzee' | 'schocken' | 'schach';

export const ART_NAME: Record<SpielArt, string> = {
  kniffel: 'Kniffel', yahtzee: 'Yahtzee', schocken: 'Schocken', schach: 'Schach',
};

export interface Partie {
  /** Kennung der Partie – so wird sie nur einmal gezählt und lässt sich bei „Zurück“ wieder austragen. */
  id: string;
  spiel: SpielArt;
  datum: number;
  /** Alle, die mitgespielt haben. */
  spieler: string[];
  /** Wer gewonnen hat (bei Gleichstand mehrere, bei Remis niemand). */
  sieger: string[];
}

export interface Zeile { name: string; siege: number; spiele: number; quote: number }

export const neueId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const normName = (n: string): string => n.trim().replace(/\s+/g, ' ');
const schluessel = (n: string): string => normName(n).toLocaleLowerCase('de');

/**
 * Tabelle für alle Spiele oder eines. Gleiche Namen (Groß-/Kleinschreibung egal) zählen zusammen,
 * angezeigt wird die zuletzt benutzte Schreibweise. Sortiert nach Siegen, dann Quote, dann Name.
 */
export function tabelle(partien: Partie[], art?: SpielArt): Zeile[] {
  const map = new Map<string, Zeile & { zuletzt: number }>();
  const nimm = (name: string, datum: number) => {
    const k = schluessel(name);
    let z = map.get(k);
    if (!z) { z = { name: normName(name), siege: 0, spiele: 0, quote: 0, zuletzt: datum }; map.set(k, z); }
    if (datum >= z.zuletzt) { z.zuletzt = datum; z.name = normName(name); }
    return z;
  };
  for (const p of partien) {
    if (art && p.spiel !== art) continue;
    const gezaehlt = new Set<string>();
    for (const n of p.spieler) {
      if (!normName(n) || gezaehlt.has(schluessel(n))) continue;
      gezaehlt.add(schluessel(n));
      nimm(n, p.datum).spiele += 1;
    }
    for (const n of new Set(p.sieger.map(schluessel))) {
      const z = map.get(n);
      if (z) z.siege += 1;
    }
  }
  return [...map.values()]
    .map(({ zuletzt: _zuletzt, ...z }) => ({ ...z, quote: z.spiele ? z.siege / z.spiele : 0 }))
    .sort((a, b) => b.siege - a.siege || b.quote - a.quote || a.name.localeCompare(b.name, 'de'));
}

/** Namen in der Reihenfolge, wie oft sie vorkommen – für die Vorschläge beim Eintippen. */
export function bekannteNamen(partien: Partie[]): string[] {
  return tabelle(partien).sort((a, b) => b.spiele - a.spiele || a.name.localeCompare(b.name, 'de')).map(z => z.name);
}

const KEY = 'wuerfelspiele.rangliste.v1';

export function ladePartien(): Partie[] {
  try {
    const roh = localStorage.getItem(KEY);
    const l = roh ? JSON.parse(roh) : [];
    return Array.isArray(l)
      ? l.filter((p: Partie) => p && typeof p.id === 'string' && Array.isArray(p.spieler) && Array.isArray(p.sieger) && p.spiel in ART_NAME)
      : [];
  } catch {
    return [];
  }
}
const schreibe = (l: Partie[]): void => {
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* Speicher gesperrt – dann wird nicht mitgezählt */ }
};

/** Trägt eine beendete Partie ein (oder aktualisiert sie, wenn die Kennung schon bekannt ist). */
export function speichereErgebnis(p: Omit<Partie, 'datum'> & { datum?: number }): void {
  const l = ladePartien();
  const i = l.findIndex(x => x.id === p.id);
  if (i >= 0) l[i] = { ...p, datum: l[i].datum };
  else l.push({ ...p, datum: p.datum ?? Date.now() });
  schreibe(l);
}

/** Nimmt eine Partie wieder heraus (zum Beispiel nach „Zurück“ aus dem Spielende). Ohne Eintrag passiert nichts. */
export function entferneErgebnis(id: string): void {
  const l = ladePartien();
  if (l.some(x => x.id === id)) schreibe(l.filter(x => x.id !== id));
}

export const loescheAlle = (): void => schreibe([]);
