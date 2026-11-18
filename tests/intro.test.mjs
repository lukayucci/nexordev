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

test('el canvas de partículas está debajo del contenido y no intercepta el mouse', () => {
  assert.match(html, /id="particle-canvas"/);
  assert.match(css, /\.hero__canvas\s*\{[^}]*pointer-events:\s*none/);
  assert.match(html, /src="particles\.js"/);
});

test('mantiene la paleta y el foco visible', () => {
  assert.match(css, /--accent:\s*#8c52ff/i);
  assert.match(css, /--bg-color:\s*#000000/i);
  assert.match(css, /:focus-visible/);
});

test('el reveal arranca oculto y se muestra con is-visible', () => {
  assert.match(css, /\[data-reveal\][\s\S]*opacity:\s*0/);
  assert.match(css, /\.is-visible[\s\S]*opacity:\s*1/);
});

test('respeta prefers-reduced-motion', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('el contenido sigue visible sin JavaScript', () => {
  assert.match(html, /<noscript>[\s\S]*\[data-reveal\][\s\S]*opacity:\s*1[\s\S]*<\/noscript>/);
});

test('el canvas permite el gesto touch sin cancelarse', () => {
  assert.match(css, /\.hero__canvas\s*\{[^}]*touch-action:\s*none/);
});
