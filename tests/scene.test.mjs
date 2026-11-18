import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let scene = '';
try { scene = readFileSync(join(root, 'scene.js'), 'utf8'); } catch {}

test('la palabra se define con trazos para N, E, X, O y R', () => {
  for (const letter of ['N', 'E', 'X', 'O', 'R']) {
    assert.match(scene, new RegExp(`\\b${letter}:`), `falta la letra ${letter}`);
  }
});

test('la X inicial se interpola hasta la X de la palabra', () => {
  assert.match(scene, /startX/);
  assert.match(scene, /endX\s*=\s*glyphs\.X/);
  assert.match(scene, /morph\s*=\s*smoothstep/);
});

test('las letras aparecen en orden N, E, O, R despues de la X', () => {
  assert.match(scene, /reveals\s*=\s*\{[\s\S]*N:\s*\[0\.02,\s*0\.28\][\s\S]*E:\s*\[0\.24,\s*0\.5\][\s\S]*O:\s*\[0\.55,\s*0\.8\][\s\S]*R:\s*\[0\.72,\s*0\.98\]/);
});

test('los adornos tecnologicos se apagan al avanzar el scroll', () => {
  assert.match(scene, /decorAlpha/);
  assert.match(scene, /fineX/);
  assert.match(scene, /ring/);
  assert.match(scene, /particles/);
});

test('el canvas no pinta fondo y respeta reduced motion', () => {
  assert.match(scene, /alpha:\s*true/);
  assert.match(scene, /setClearColor\(0x000000,\s*0\)/);
  assert.match(scene, /reduceMotion/);
});

test('en pantallas angostas la palabra se escala para no cortarse', () => {
  assert.match(scene, /camera\.aspect/);
  assert.match(scene, /root\.scale\.setScalar\(/);
});

test('si WebGL falla se muestra el video de respaldo', () => {
  assert.match(scene, /webglcontextlost/);
  assert.match(scene, /video\.style\.display\s*=\s*"block"/);
});
