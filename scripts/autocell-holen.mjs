// Holt die fertig gebaute Web-Version von AutoCell aus dem AutoCell-Repository nach apps/autocell.
// Aufruf: node scripts/autocell-holen.mjs [Pfad zum AutoCell-Repository, Standard: ../Autocell]
// Vorher im AutoCell-Repository `npm run build` ausführen.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const quelle = join(resolve(ROOT, process.argv[2] ?? '../Autocell'), 'apps', 'autocell', 'dist');
const ziel = join(ROOT, 'apps', 'autocell');
if (!existsSync(join(quelle, 'index.html'))) {
  console.error(`Keine gebaute Web-Version gefunden: ${quelle}\nIm AutoCell-Repository zuerst \`npm run build\` ausführen.`);
  process.exit(1);
}
// Alte Dateien (mit Prüfsummen im Namen) entfernen, die README bleibt
for (const name of readdirSync(ziel)) if (name !== 'README.md') rmSync(join(ziel, name), { recursive: true, force: true });
cpSync(quelle, ziel, { recursive: true });
console.log(`AutoCell nach ${ziel} kopiert.`);
