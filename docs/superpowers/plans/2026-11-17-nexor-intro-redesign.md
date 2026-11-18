# Nexor Intro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redisenar la intro de Nexor con identidad propia, oscura e inmersiva, manteniendo el parallax de 100 frames.

**Architecture:** Se conserva el hero sticky de 400vh y el canvas que dibuja los frames segun el scroll. Se cambia la composicion a asimetrica, la paleta a grafito con naranja senal y la tipografia a grotesca condensada mas serif. El JS existing se ajusta para exponer el contador real de frames y el parallax por capas.

**Tech Stack:** HTML, CSS y JS puro, sin dependencias. Google Fonts para dos familias.

**Spec:** docs/superpowers/specs/2026-11-17-nexor-intro-redesign-design.md

## Global Constraints

- Sin Three.js en esta pasada.
- Sin kicker en mayusculas espaciadas, sin numeros 01/02/03 decorativos, sin Scroll para descubrir.
- Mantener 100 frames, video fallback, prefers-reduced-motion, menu y secciones posteriores.
- Un solo CTA en el hero.

## Review Focus

- Scroll al final: el contenido debe desaparecer sin dejar elementos clicables.
- prefers-reduced-motion: sin animacion continua, contenido visible.
- Sin canvas: el video debe tomar el lugar.
- Mobile: el titulo no debe desbordar y la columna debe apilarse.
- Fuentes externas: debe haber fallback legible si no cargan.

---

### Task 1: Estructura y estilos del hero

**Files:**
- Modify: index.html (bloque section.hero)
- Modify: style.css (variables y bloque HERO)

- [ ] **Step 1: Reemplazar el contenido del hero en index.html**
  Dejar el canvas y el video, mas: marca NEXOR / contador, titulo en tres lineas apoyado a la izquierda, bajada serif a la derecha, un CTA subrayado. Sacar kicker, dos botones y hint.

- [ ] **Step 2: Reescribir variables y estilos del hero en style.css**
  Paleta grafito y naranja senal. Tipografia grotesca condensada para titulo, serif para bajada. Composicion grid asimetrica. Contador con numeros tabulares. Sacar overlay radial y par de botones.

- [ ] **Step 3: Verificar el HTML renderizado**
  Levantar servidor local y confirmar con Chrome headless que el titulo, la bajada y el contador estan presentes, sin errores 404.

- [ ] **Step 4: Commit**
  `git add index.html style.css && git commit -m "Rediseno la intro de Nexor"`

### Task 2: Parallax y contador real

**Files:**
- Modify: main.js

- [ ] **Step 1: Exponer el frame actual al DOM**
  Mantener el calculo de scrollFraction y currentFrame. Escribir el numero del frame en el elemento contador con padding de 3 digitos.

- [ ] **Step 2: Ajustar el parallax por capas**
  Titulo, bajada y CTA deben desplazarse a velocidades distintas usando transform, con throttle por requestAnimationFrame. Mantener fade al final y pointer-events none.

- [ ] **Step 3: Verificar sintaxis y consola**
  `node --check main.js` y carga headless sin errores JS.

- [ ] **Step 4: Commit**
  `git add main.js docs && git commit -m "Ajusta parallax y contador de frames"`

### Task 3: Revision visual

**Files:**
- Modify: index.html, style.css, main.js si hace falta

- [ ] **Step 1: Capturar desktop y mobile**
  Screenshots headless en 1280x900 y 390x844.

- [ ] **Step 2: Revisar contraste, desbordes y reduced motion**
  Ajustar lo que aparezca.

- [ ] **Step 3: Commit final si hubo cambios**
  `git add . && git commit -m "Ajustes visuales de la intro"`
