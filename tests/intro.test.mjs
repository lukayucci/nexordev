import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function read(name) {
  try { return readFileSync(join(root, name), 'utf8'); } catch { return ''; }
}
const html = read('index.html');
const css = read('style.css');
const js = read('main.js');
const scene = read('scene.js');

const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf('</section>', html.indexOf('<section class="hero"')));

test('el hero no tiene kicker generico', () => {
  assert.equal(hero.includes('hero__kicker'), false);
});

test('el hero expone un contador de progreso, no de frames', () => {
  assert.match(hero, /data-progress-counter/);
  assert.doesNotMatch(hero, /data-frame-counter/);
});

test('el hero tiene un solo CTA', () => {
  assert.equal((hero.match(/hero__cta/g) || []).length, 1);
});

test('mantiene el violeta de Nexor', () => {
  assert.match(css, /--accent:\s*#8c52ff/i);
  assert.doesNotMatch(css, /--signal/);
});

test('el canvas y el hero son transparentes', () => {
  assert.match(css, /\.hero\s*\{[^}]*background(?:-color)?:\s*transparent/);
  assert.match(css, /\.hero__sticky-container\s*\{[^}]*background(?:-color)?:\s*transparent/);
  assert.doesNotMatch(css, /\.hero__sticky-container::before/);
  assert.match(scene, /alpha:\s*true/);
  assert.match(scene, /setClearColor\(0x000000,\s*0\)/);
});

test('no carga fuentes externas', () => {
  assert.doesNotMatch(html, /fonts\.googleapis/);
});

test('la intro es una X tecnologica que se convierte en NEXOR', () => {
  assert.match(html, /src="scene\.js"/);
  assert.match(scene, /import \* as THREE/);
  assert.match(scene, /WebGLRenderer/);
  assert.match(scene, /const word = "NEXOR"/);
  assert.doesNotMatch(scene, /ezgif-frame-/);
});

test('main.js ya no dibuja la secuencia de frames en canvas 2D', () => {
  assert.doesNotMatch(js, /getContext\("2d"\)/);
  assert.doesNotMatch(js, /ezgif-frame-/);
});

test('el JS actualiza el contador de progreso', () => {
  assert.match(js, /progressCounter/);
});

test('se mantiene el parallax por scroll', () => {
  assert.match(js, /scrollFraction/);
  assert.match(js, /requestAnimationFrame/);
});

test('el video de la maquina queda de fondo y el canvas transparente va encima', () => {
  assert.match(css, /\.hero__video\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.hero__canvas\s*\{[^}]*z-index:\s*1/);
  assert.match(scene, /video\.style\.display\s*=\s*"block"/);
});
