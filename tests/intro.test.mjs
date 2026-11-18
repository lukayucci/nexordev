import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');
const js = readFileSync(join(root, 'main.js'), 'utf8');

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

test('la paleta usa naranja senal', () => {
  assert.match(css, /--signal/);
});

test('el JS actualiza el contador', () => {
  assert.match(js, /frameCounter/);
});

test('se mantiene el parallax por scroll', () => {
  assert.match(js, /scrollFraction/);
  assert.match(js, /requestAnimationFrame/);
});
