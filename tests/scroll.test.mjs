import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'main.js'), 'utf8');

function el(extra = {}) {
  const classes = new Set(extra.classes ?? []);
  const listeners = {};
  return {
    style: {},
    attrs: {},
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      toggle(name, force) {
        const value = force ?? !classes.has(name);
        value ? classes.add(name) : classes.delete(name);
        return value;
      },
      contains(name) { return classes.has(name); },
    },
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name] ?? null; },
    addEventListener(name, cb) { (listeners[name] ??= []).push(cb); },
    querySelectorAll() { return []; },
    click() { (listeners.click ?? []).forEach((cb) => cb()); },
    textContent: '',
    ...extra,
  };
}

function setup({ withObserver = true } = {}) {
  const documentListeners = {};
  const menuBtn = el();
  const menu = el();
  const menuLinks = [el(), el()];
  menu.querySelectorAll = () => menuLinks;
  const reveal = el();
  const observed = [];
  let observerCallback = null;

  const document = {
    getElementById(id) {
      return {
        'menu-btn': menuBtn,
        'main-menu': menu,
        'particle-canvas': null,
      }[id] ?? null;
    },
    querySelector(selector) {
      return selector === '[data-reveal]' ? reveal : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-reveal]' ? [reveal] : [];
    },
    addEventListener(name, cb) { (documentListeners[name] ??= []).push(cb); },
  };

  const window = {
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
  };

  if (withObserver) {
    window.IntersectionObserver = class {
      constructor(cb) { observerCallback = cb; }
      observe(target) { observed.push(target); }
      unobserve() {}
    };
  }

  vm.runInNewContext(code, { window, document, console });

  return {
    menuBtn,
    menu,
    reveal,
    observed,
    click(element) { element.click(); },
    key(value) { (documentListeners.keydown ?? []).forEach((cb) => cb({ key: value })); },
    observer: {
      trigger(target) {
        observerCallback([{ target, isIntersecting: true }]);
      },
    },
  };
}

test('el botón de menú alterna aria-expanded', () => {
  const { menuBtn, click } = setup();
  click(menuBtn);
  assert.equal(menuBtn.attrs['aria-expanded'], 'true');
  click(menuBtn);
  assert.equal(menuBtn.attrs['aria-expanded'], 'false');
});

test('Escape cierra el menú', () => {
  const { menuBtn, menu, click, key } = setup();
  click(menuBtn);
  assert.equal(menu.classList.contains('header__menu--open'), true);
  key('Escape');
  assert.equal(menu.classList.contains('header__menu--open'), false);
});

test('los elementos reveal se muestran al entrar', () => {
  const { reveal, observer } = setup();
  observer.trigger(reveal);
  assert.equal(reveal.classList.contains('is-visible'), true);
});

test('sin IntersectionObserver todo queda visible', () => {
  const { reveal } = setup({ withObserver: false });
  assert.equal(reveal.classList.contains('is-visible'), true);
});
