# Würfelspiele

Punkteblock für Würfelspiele, läuft als PWA komplett offline. Die Würfel bleiben physisch, die App trägt nur ein.
Erstes Spiel: **Kniffel** (2–6 Spieler).

**Eintragen:** die fünf gewürfelten Augen antippen → die App zeigt, was jedes freie Feld bringt → Feld antippen.
Alternativ ein Feld direkt antippen und die Punkte wählen. Zelle im Punkteblock antippen = ändern/löschen, ↶ = rückgängig.
Der Spielstand liegt im Browser (localStorage) und übersteht Neustarts.

## Entwickeln

```bash
npm install
npm run dev       # Entwicklung
npm test          # Regeln und Spielablauf
npm run build     # nach dist/, inkl. Offline-Dateiliste im Service Worker
npm run preview   # gebaute App ansehen
```

## Offline im Urlaub

`dist/` auf irgendein statisches Hosting legen (GitHub Pages, Netlify, Firebase Hosting, …; die App nutzt relative Pfade).
Einmal mit Netz öffnen, dann „Zum Home-Bildschirm“ – ab da läuft sie ohne Netz. Neuer Build = neuer Cache.

## Neues Spiel ergänzen

Regeln als reine Funktionen in `src/<spiel>.ts` (mit Test), Oberfläche in `src/<Spiel>.tsx`, Karte in `src/App.tsx`.
