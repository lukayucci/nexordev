# Hero de partículas imán y mejora del front Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la intro de Three.js por un hero de una pantalla con un campo de partículas que siguen al mouse como un imán, y dejar el resto del front prolijo dentro de la paleta violeta/negro.

**Architecture:** Se eliminan `scene.js`, `frames/`, el MP4 y el PNG del logo. El hero pasa a `100vh`; un módulo vanilla `particles.js` dibuja en canvas 2D y expone `window.createParticleField`. `main.js` pierde el motor de scroll y solo gestiona menú, indicador de scroll y reveal con `IntersectionObserver`. Todo sigue siendo HTML/CSS/JS estático, sin dependencias.

**Tech Stack:** HTML5, CSS, JavaScript vanilla, Canvas 2D, `node:test`, Chrome headless.

**Spec:** `docs/superpowers/specs/2026-11-17-hero-particulas-iman-design.md`

## Global Constraints

- Paleta: acento `#8c52ff`, fondo `#000000`. No reintroducir grafito/naranja.
- Hero: `100vh`, sin sticky de 400vh, sin contador de frames ni `window.nexorState`.
- Sin Three.js, WebGL, CDN, secuencias `ezgif-frame-`, video MP4 ni imágenes del logo.
- Sin dependencias ni build. Sin fuentes de Google Fonts.
- `devicePixelRatio` limitado a 2; radio del imán `180` px; seed por defecto `1`.
- Debe funcionar con touch, con `prefers-reduced-motion` y sin contexto 2D.
- Tests con `node:test`; verificación final en Chrome headless con SwiftShader no requerido (canvas 2D).

## Review Focus

- **Touch sin `pointerleave`:** el imán debe desactivarse con `pointerup`/`pointercancel`. Pinchado en Task 2 con un test que despacha `pointerup` y afirma `pointerActive === false`.
- **Resize de ventana:** el canvas y las posiciones base deben recalcularse. Pinchado en Task 2 con un test que cambia `clientWidth` y verifica `canvas.width`.
- **Sin contexto 2D:** no debe romper la página. Pinchado en Task 2 con un test donde `getContext` devuelve `null` y se afirma `available === false`.
- **Pantalla chica:** la cantidad de partículas debe toparse para no saturar. Pinchado en Task 2 con un test que pasa `particleCount: 5000` en un área pequeña y verifica que el count devuelto sea menor.
- **Teclado y menú:** el botón de menú debe alternar `aria-expanded` y Escape debe cerrarlo. Pinchado en Task 4 con tests en `scroll.test.mjs`.

---

### Task 1: Limpieza de la intro y estructura del hero 100vh

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `tests/intro.test.mjs`
- Delete: `scene.js`, `tests/scene.test.mjs`, `ANIMACIONES/2a2d767e-b33f-4c46-bd95-76b78cad05da.mp4`, `ANIMACIONES/X-logo.png`, `frames/` (carpeta completa)

**Interfaces:**
- Produces: IDs `#particle-canvas`, `#hero-content`, `#menu-btn`, `#main-menu`; atributos `[data-scroll-indicator]`, `[data-reveal]`; wordmark inline con `<svg>` y sin `<img>` en el header.

- [ ] **Step 1: Write the failing test**

En `tests/intro.test.mjs`, reemplazar el archivo por assertions sobre el estado deseado:

```js
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
```

`exists()` es un helper local con `existsSync(join(root, name))`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/intro.test.mjs`
Expected: FAIL porque siguen existiendo `scene.js`, `frames/`, el MP4, el PNG y el CSS de 400vh.

- [ ] **Step 3: Implement the minimal change**

En `index.html`: sacar `<video>`, el `<canvas>` viejo, el script `scene.js` y el `<img>` del header; dejar `<canvas id="particle-canvas">`, el wordmark SVG y un `<a class="hero__scroll" data-scroll-indicator href="#intro">`.
En `style.css`: `.hero { min-height: 100vh; }`, eliminar `.hero__sticky-container` y sus reglas, dejar el header siempre visible (sin `transform: translateY(-100%)`).
Borrar los archivos y la carpeta indicados.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/intro.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove Three.js intro and switch hero to 100vh"
```

---

### Task 2: Campo de partículas imán

**Files:**
- Create: `particles.js`
- Create: `tests/particles.test.mjs`

**Interfaces:**
- Produces: `window.createParticleField(canvas, options)` donde `options` es `{ particleCount = 180, magnetRadius = 180, seed = 1, reducedMotion = false }`. Devuelve un controlador `{ start(), stop(), destroy(), getState() }`. `getState()` devuelve `{ available, count, pointerActive, pointer: {x, y}, reducedMotion, destroyed, particles: [{ x, y, baseX, baseY }] }`.

- [ ] **Step 1: Write the failing test**

```js
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

test('pointerup y pointercancel desactivan el imán en touch', () => {
  const { control, dispatch } = setup();
  dispatch('pointermove', { clientX: 10, clientY: 10 });
  assert.equal(control.getState().pointerActive, true);
  dispatch('pointerup', {});
  assert.equal(control.getState().pointerActive, false);
});
```

Agregar además tests para `pointercancel`, `resize`, `reducedMotion`, `getContext() === null`, tope de partículas en área chica y `destroy()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/particles.test.mjs`
Expected: FAIL con `createParticleField is not a function` porque `particles.js` no existe.

- [ ] **Step 3: Implement `createParticleField`**

IIFE clásica que asigna `window.createParticleField`. Usar PRNG `mulberry32(seed)` para posiciones base deterministas. En cada frame: si `pointerActive`, aplicar atracción inversamente proporcional a la distancia dentro de `magnetRadius`; si no, aplicar muelle con damping hacia `baseX/baseY`; dibujar `clearRect`, halo radial y puntos. Registrar `pointermove`, `pointerleave`, `pointerup`, `pointercancel` y `resize`. Si `canvas.getContext('2d')` es `null`, devolver un controlador con `available: false` que no registra listeners. Tope de partículas: `Math.min(particleCount, Math.max(40, Math.floor(area / 6000)))`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/particles.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add particles.js tests/particles.test.mjs
git commit -m "feat: add pointer-driven particle field"
```

---

### Task 3: Conectar el campo de partículas al hero

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `main.js`
- Modify: `tests/intro.test.mjs`

**Interfaces:**
- Consumes: `window.createParticleField(canvas, options)` de Task 2.
- Produces: canvas `#particle-canvas` posicionado debajo del contenido, con `pointer-events: none`; `main.js` inicializa el campo al cargar.

- [ ] **Step 1: Write the failing test**

```js
test('el canvas de partículas está debajo del contenido y no intercepta el mouse', () => {
  assert.match(html, /id="particle-canvas"/);
  assert.match(css, /\.hero__canvas\s*\{[^}]*pointer-events:\s*none/);
  assert.match(html, /src="particles\.js"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/intro.test.mjs`
Expected: FAIL porque faltan el id, la regla CSS y el script.

- [ ] **Step 3: Implement the minimal change**

Agregar `<script src="particles.js"></script>` antes de `main.js`. En `main.js`, al final del IIFE, si existe `#particle-canvas`, crear el campo con `reducedMotion` según `matchMedia` y iniciarlo. En CSS, `.hero__canvas { position:absolute; inset:0; z-index:0; pointer-events:none; }` y `.hero__content { position:relative; z-index:1; }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/intro.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css main.js tests/intro.test.mjs
git commit -m "feat: wire particle field into hero"
```

---

### Task 4: Reescribir `main.js` sin motor de scroll

**Files:**
- Modify: `main.js`
- Modify: `tests/scroll.test.mjs`

**Interfaces:**
- Consumes: `[data-reveal]` y `[data-scroll-indicator]` de Task 1.
- Produces: menú con `aria-expanded`, cierre con Escape y click en link; elementos `[data-reveal]` reciben la clase `is-visible` cuando entran al viewport.

- [ ] **Step 1: Write the failing test**

Reemplazar `tests/scroll.test.mjs`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/scroll.test.mjs`
Expected: FAIL porque `main.js` todavía no expone ese comportamiento.

- [ ] **Step 3: Implement the minimal change**

`main.js`: sacar `scrollFraction`, `state`, `requestAnimationFrame` de scroll, fade y parallax. Mantener menú. Agregar: si `IntersectionObserver` existe, observar `[data-reveal]` y agregar `is-visible` al entrar; si no, agregar la clase a todos. El indicador de scroll es un ancla común (`href="#intro"`), sin lógica JS.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/scroll.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add main.js tests/scroll.test.mjs
git commit -m "refactor: simplify main.js for single-screen hero"
```

---

### Task 5: Mejora conservadora del resto del front

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `tests/intro.test.mjs`

**Interfaces:**
- Consumes: `[data-reveal]` de Task 1 y `.is-visible` de Task 4.
- Produces: estilos finales de secciones, cards, botones y footer dentro de los tokens existentes.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/intro.test.mjs`
Expected: FAIL porque aún no están las reglas de reveal ni el foco visible.

- [ ] **Step 3: Implement the minimal change**

Ajustar `style.css`: escala tipográfica y ritmo vertical consistente, cards con borde y hover, botones con transición, footer prolijo, `[data-reveal] { opacity:0; transform:translateY(18px); }` y `.is-visible { opacity:1; transform:none; }`, bloque `@media (prefers-reduced-motion: reduce)` que anula transformaciones y animaciones. Agregar `data-reveal` a los `.container` de las secciones en `index.html`. No cambiar la paleta ni el contenido.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/intro.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css tests/intro.test.mjs
git commit -m "style: refine sections, cards and accessibility"
```

---

### Task 6: Verificación final y push

**Files:**
- Modify: `docs/superpowers/specs/2026-11-17-hero-particulas-iman-design.md` (si hace falta algún ajuste menor)
- Test: `tests/*.mjs`

**Interfaces:**
- Consumes: todos los tasks anteriores.

- [ ] **Step 1: Run the full suite**

Run: `node --test tests/*.mjs`
Expected: PASS con 0 failures.

- [ ] **Step 2: Syntax check**

Run: `node --check main.js; node --check particles.js`
Expected: sin errores.

- [ ] **Step 3: Verify in Chrome headless**

Servir el repo con `python -m http.server` y abrir la página con Chrome headless. Afirmar: sin errores de consola, `#particle-canvas` con `width > 0`, `#hero-content` visible, menú funcional y secciones con `is-visible` después del scroll.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: final verification of particle hero"
git push origin main
```
