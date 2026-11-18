import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');
const js = readFileSync(join(root, 'main.js'), 'utf8');
const scene = readFileSync(join(root, 'scene.js'), 'utf8');

const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf('</section>', html.indexOf('<section class="hero"')));

test('el hero no tiene kicker generico', () => {
  assert.equal(hero.includes('hero__kicker'), false);
});

test('el hero expone un contador de frames', () => {
  assert.match(hero, /data-frame-counter/);
});

test('el hero tiene un solo CTA', () => {
  assert.equal((hero.match(/hero__cta/g) || []).length, 1);
});

test('mantiene el violeta de Nexor y el fondo negro', () => {
  assert.match(css, /--accent:\s*#8c52ff/i);
  assert.match(css, /--bg-color:\s*#000000/i);
  assert.doesNotMatch(css, /--signal/);
});

test('no carga fuentes externas', () => {
  assert.doesNotMatch(html, /fonts\.googleapis/);
});

test('la foto se mueve en una escena 3D hecha con JavaScript', () => {
  assert.match(html, /src="scene\.js"/);
  assert.match(scene, /import \* as THREE/);
  assert.match(scene, /WebGLRenderer/);
  assert.match(scene, /ezgif-frame-/);
});

test('main.js ya no dibuja la foto en canvas 2D', () => {
  assert.doesNotMatch(js, /getContext\("2d"\)/);
});

test('el JS actualiza el contador', () => {
  assert.match(js, /frameCounter/);
});

test('se mantiene el parallax por scroll', () => {
  assert.match(js, /scrollFraction/);
  assert.match(js, /requestAnimationFrame/);
});
