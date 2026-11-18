import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let code = '';
try { code = readFileSync(join(root, 'particles.js'), 'utf8'); } catch {}

function distanceSum(particles, x, y) {
  return particles.reduce((sum, p) => sum + Math.hypot(p.x - x, p.y - y), 0);
}

function setup(options = {}) {
  const listeners = {};
  let queue = [];
  let nextId = 1;

  const ctx = new Proxy({}, { get: (target, key) => {
    if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
    return target[key] ??= () => {};
  } });

  const canvas = {
    clientWidth: options.clientWidth ?? 200,
    clientHeight: options.clientHeight ?? 200,
    width: 0,
    height: 0,
    getContext: () => options.noContext ? null : ctx,
  };

  const window = {
    devicePixelRatio: options.dpr ?? 1,
    addEventListener(name, cb) { (listeners[name] ??= []).push(cb); },
    removeEventListener(name, cb) {
      listeners[name] = (listeners[name] || []).filter((fn) => fn !== cb);
    },
    requestAnimationFrame(cb) { queue.push({ id: nextId, cb }); return nextId++; },
    cancelAnimationFrame(id) { queue = queue.filter((item) => item.id !== id); },
  };

  vm.runInNewContext(code, { window, Math, console });

  if (typeof window.createParticleField !== 'function') {
    throw new Error('createParticleField is not a function');
  }
  const control = window.createParticleField(canvas, options);

  return {
    control,
    canvas,
    window,
    listeners,
    dispatch(name, event = {}) { (listeners[name] || []).forEach((cb) => cb(event)); },
    frames(n) {
      for (let i = 0; i < n; i++) {
        const pending = queue;
        queue = [];
        pending.forEach(({ cb }) => cb(i * 16));
      }
    },
  };
}

test('inicializa el canvas con DPR limitado a 2', () => {
  const { control, canvas } = setup({ clientWidth: 100, clientHeight: 50, dpr: 3, particleCount: 12 });
  assert.equal(control.getState().count, 12);
  assert.equal(canvas.width, 200);
  assert.equal(canvas.height, 100);
});

test('el mouse atrae partículas hacia el cursor', () => {
  const { control, dispatch, frames } = setup({ particleCount: 40, seed: 7 });
  const before = distanceSum(control.getState().particles, 50, 50);
  dispatch('pointermove', { clientX: 50, clientY: 50 });
  frames(30);
  assert.ok(distanceSum(control.getState().particles, 50, 50) < before);
});

test('al salir el mouse las partículas vuelven a su base', () => {
  const { control, dispatch, frames } = setup({ particleCount: 40, seed: 7 });
  dispatch('pointermove', { clientX: 50, clientY: 50 });
  frames(30);
  dispatch('pointerleave', {});
  frames(160);
  for (const p of control.getState().particles) {
    assert.ok(Math.hypot(p.x - p.baseX, p.y - p.baseY) < 2);
  }
});

test('pointerup desactiva el imán en touch', () => {
  const { control, dispatch } = setup();
  dispatch('pointermove', { clientX: 10, clientY: 10 });
  assert.equal(control.getState().pointerActive, true);
  dispatch('pointerup', {});
  assert.equal(control.getState().pointerActive, false);
});

test('pointercancel desactiva el imán', () => {
  const { control, dispatch } = setup();
  dispatch('pointermove', { clientX: 10, clientY: 10 });
  dispatch('pointercancel', {});
  assert.equal(control.getState().pointerActive, false);
});

test('resize recalcula el tamaño del canvas', () => {
  const { control, canvas, dispatch } = setup({ dpr: 2 });
  canvas.clientWidth = 120;
  canvas.clientHeight = 80;
  dispatch('resize', {});
  assert.equal(canvas.width, 240);
  assert.equal(canvas.height, 160);
  assert.equal(control.getState().count > 0, true);
});

test('con reduced motion el puntero no mueve las partículas', () => {
  const { control, dispatch, frames } = setup({ reducedMotion: true });
  dispatch('pointermove', { clientX: 30, clientY: 30 });
  frames(30);
  for (const p of control.getState().particles) {
    assert.ok(Math.hypot(p.x - p.baseX, p.y - p.baseY) < 0.01);
  }
});

test('sin contexto 2D no registra listeners y no arranca', () => {
  const { control, listeners } = setup({ noContext: true });
  assert.equal(control.getState().available, false);
  assert.equal(Object.keys(listeners).length, 0);
});

test('en area chica limita la cantidad de partículas', () => {
  const { control } = setup({ clientWidth: 100, clientHeight: 100, particleCount: 5000 });
  assert.equal(control.getState().count, 40);
});

test('el clic empuja las partículas hacia afuera', () => {
  const { control, dispatch, frames } = setup({ particleCount: 40, seed: 7 });
  const before = control.getState().particles.map((p) => Math.hypot(p.x - 100, p.y - 100));
  dispatch('pointerdown', { clientX: 100, clientY: 100 });
  frames(5);
  const after = control.getState().particles.map((p) => Math.hypot(p.x - 100, p.y - 100));
  assert.ok(after.some((distance, i) => distance > before[i]));
});

test('destroy desactiva el campo y limpia los listeners', () => {
  const { control, dispatch, listeners } = setup();
  control.destroy();
  assert.equal(control.getState().destroyed, true);
  dispatch('pointermove', { clientX: 10, clientY: 10 });
  assert.equal(control.getState().pointerActive, false);
  assert.equal(Object.keys(listeners).every((name) => listeners[name].length === 0), true);
});
