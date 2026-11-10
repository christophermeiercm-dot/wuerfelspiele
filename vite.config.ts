import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Trägt nach dem Build die Dateiliste in `dist/sw.js` ein. Der Service Worker legt
 * beim ersten Besuch ALLES davon ab – danach läuft die App ohne Netz.
 * Die Version ist ein Hash der Inhalte: neuer Build = neuer Cache, alter wird geräumt.
 */
function offlineListe(): Plugin {
  let outDir = 'dist';
  const alle = (ordner: string): string[] =>
    readdirSync(ordner).flatMap(n => {
      const p = join(ordner, n);
      return statSync(p).isDirectory() ? alle(p) : [p];
    });
  return {
    name: 'offline-liste',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      const dateien = alle(outDir).filter(p => !p.endsWith('sw.js'));
      const hash = createHash('sha1');
      for (const p of dateien) hash.update(readFileSync(p));
      const urls = ['./', ...dateien.map(p => './' + relative(outDir, p).split('\\').join('/'))];
      const swPfad = join(outDir, 'sw.js');
      const sw = readFileSync(swPfad, 'utf8')
        .replace('__VERSION__', hash.digest('hex').slice(0, 10))
        .replace("'__PRECACHE__'", JSON.stringify(urls));
      writeFileSync(swPfad, sw);
    },
  };
}

export default defineConfig({
  // Relativ, damit die App unter jedem Pfad läuft (eigene Domain, Unterordner, lokal).
  base: './',
  plugins: [react(), offlineListe()],
  test: { include: ['src/**/*.test.ts'] },
});
