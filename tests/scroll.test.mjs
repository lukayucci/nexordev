import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'main.js'), 'utf8');

function el(extra = {}) {
  return {
    style: {},
    classList: { toggle() {}, contains() { return false; } },
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener() {},
    querySelectorAll() { return []; },
    textContent: '',
    ...extra,
  };
}

function setup({ reduceMotion = false } = {}) {
  const listeners = {};
  let rafQueue = [];
  const ctx = new Proxy({}, { get: (target, key) => (target[key] ??= () => {}) });

  function flushRaf() {
    const pending = rafQueue;
    rafQueue = [];
    pending.forEach((cb) => cb());
  }

  const canvas = el({ getContext: () => ctx });
  const video = el({ pause() {} });
  const header = el();
  const heroContent = el();
  const menuBtn = el();
  const menu = el();
  const counter = el({ textContent: '001' });
  const layers = [el(), el(), el()];
  const hero = el({ offsetHeight: 4000 });

  const document = {
    getElementById(id) {
      return {
        'hero-canvas': canvas,
        'hero-video': video,
        'main-header': header,
        'hero-content': heroContent,
        'menu-btn': menuBtn,
        'main-menu': menu,
      }[id] ?? null;
    },
    querySelector(selector) {
      return { '.hero': hero, '[data-frame-counter]': counter }[selector] ?? null;
    },
    querySelectorAll(selector) {
      return selector === '[data-hero-layer]' ? layers : [];
    },
    addEventListener() {},
  };

  const window = {
    innerWidth: 1280,
    innerHeight: 1000,
    scrollY: 0,
    matchMedia: () => ({ matches: reduceMotion }),
    addEventListener(name, cb) { (listeners[name] ??= []).push(cb); },
  };

  vm.runInNewContext(code, {
    window,
    document,
    Image: class { set src(_value) {} },
    requestAnimationFrame(cb) { rafQueue.push(cb); },
    console,
  });

  function scrollTo(y) {
    window.scrollY = y;
    (listeners.scroll ?? []).forEach((cb) => cb());
    flushRaf();
  }

  return { counter, layers, canvas, heroContent, window, scrollTo };
}

test('el scroll mueve el contador y aplica parallax por capas', () => {
  const { counter, layers, scrollTo } = setup();
  scrollTo(2000);

  assert.equal(counter.textContent, '067');
  const shifts = layers.map((layer) => layer.style.transform);
  assert.deepEqual(shifts, [
    'translate3d(0, -8.7px, 0)',
    'translate3d(0, -15.6px, 0)',
    'translate3d(0, -22.5px, 0)',
  ]);
});

test('el estado del scroll se publica para la escena 3D', () => {
  const { window: fakeWindow, scrollTo } = setup();
  scrollTo(2000);

  assert.ok(Math.abs(fakeWindow.nexorState.fraction - 2 / 3) < 0.001);
  assert.equal(fakeWindow.nexorState.frame, 66);
  assert.equal(typeof fakeWindow.nexorState.mouseX, 'number');
});

test('al final del hero el contenido desaparece y deja de ser clicable', () => {
  const { counter, canvas, heroContent, scrollTo } = setup();
  scrollTo(3000);

  assert.equal(counter.textContent, '100');
  assert.equal(canvas.style.opacity, '0');
  assert.equal(heroContent.style.opacity, '0');
  assert.equal(heroContent.style.pointerEvents, 'none');
});

test('con prefers-reduced-motion el contador sigue funcionando pero no hay parallax', () => {
  const { counter, layers, scrollTo } = setup({ reduceMotion: true });
  scrollTo(2000);

  assert.equal(counter.textContent, '067');
  assert.deepEqual(
    layers.map((layer) => layer.style.transform),
    ['translate3d(0, 0.0px, 0)', 'translate3d(0, 0.0px, 0)', 'translate3d(0, 0.0px, 0)'],
  );
});
