import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const exists = (name) => existsSync(join(root, name));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');
const heroHeader = html.slice(html.indexOf('<header'), html.indexOf('</header>'));

test('no queda nada de la intro de Three.js', () => {
  assert.doesNotMatch(html, /scene\.js|three|ezgif-frame-/i);
  assert.doesNotMatch(html, /\.mp4|\.png/i);
  assert.equal(exists('scene.js'), false);
  assert.equal(exists('frames'), false);
});

test('el hero ocupa una sola pantalla', () => {
  assert.match(css, /\.hero\s*\{[^}]*min-height:\s*100vh/);
  assert.doesNotMatch(css, /400vh|hero__sticky-container/);
});

test('el logo es inline, sin imagen', () => {
  assert.match(heroHeader, /<svg/);
  assert.doesNotMatch(heroHeader, /<img/);
});
