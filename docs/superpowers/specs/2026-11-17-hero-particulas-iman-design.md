# Hero de partículas imán + mejora integral del front

## Intención y por qué

La intro de la X con Three.js no terminó de convencer. Se descarta y se reemplaza por un hero donde el **fondo interactúa con el mouse**: un campo de partículas violeta que se agrupan hacia el cursor formando un halo y vuelven a su lugar al alejarse. Después se mejora el frente completo de la página.

La opción de comportamiento se eligió entre tres mockups: **B. Imán**. Las alternativas fueron A (constelación con líneas, más sutil) y C (rejilla en perspectiva con ondas, más "topography"). Se eligió B porque es la más visible y juguetón sin dejar de ser un fondo.

Dos decisiones confirmadas después del builder check:
- El hero pasa a ser de **una sola pantalla (100vh)**: se elimina el sticky de 400vh, el motor de scroll/parallax, el contador y `window.nexorState`. El header queda siempre visible.
- La mejora del resto de la página es un **ajuste conservador dentro de violeta/negro**: mismos tokens y mismas secciones, con mejor ejecución (jerarquía, tipografía, espaciado, cards, microinteracciones). No se cambia la composición ni la paleta.

## Objetivos

1. Borrar todo el material de la intro anterior: `scene.js`, la carpeta `frames/` con la secuencia de imágenes, el video MP4 de respaldo y el PNG del logo X usado como imagen inicial. El logo pasa a ser un wordmark inline (SVG o texto con la X estilizada), sin archivo de imagen.
2. Hero con canvas 2D y JavaScript vanilla, sin librerías ni CDN, donde las partículas son atraídas por el cursor.
3. Mejorar el front completo: header, tipografía, jerarquía visual, secciones, tarjetas, CTA, footer, responsive y accesibilidad.

## No objetivos / anti-objetivos

- No Three.js, no WebGL, no CDN, no secuencias de frames, no video de fondo.
- No reintroducir la paleta grafito/naranja (rechazada explícitamente). Se mantiene violeta `#8c52ff` sobre negro `#000000`.
- No agregar dependencias, build ni frameworks. Sigue siendo HTML/CSS/JS servido por GitHub Pages.

## Restricciones

- El sitio es estático: `index.html`, `style.css`, `main.js` y un nuevo módulo de partículas.
- Tests con `node:test` y verificación en Chrome headless.
- Debe seguir funcionando sin mouse (touch) y con `prefers-reduced-motion`.
- El hero ocupa `100vh` y no tiene narrativa de scroll. El header queda siempre visible; el menú, los anclas y el scroll normal del resto de la página se conservan.

## Decisiones de implementación

### Partículas
- Canvas 2D a pantalla completa dentro del hero de `100vh`, con `devicePixelRatio` limitado a 2.
- Población aproximada de 150-220 partículas según el área disponible; cada una tiene posición base, posición actual y velocidad.
- Dentro de un radio de ~180 px del cursor se aplica una fuerza de atracción; fuera de ese radio un muelle devuelve cada partícula a su posición base con damping.
- Las partículas cercanas al cursor crecen y aumentan su opacidad; se dibuja además un halo radial violeta suave siguiendo el puntero. No se dibujan líneas entre partículas (eso era la opción A).
- `pointermove` actualiza el objetivo; `pointerleave` lo desactiva y las partículas vuelven a su lugar. En touch, el último punto tocado cumple el mismo rol.
- Un clic o tap genera un pulso breve que empuja las partículas hacia afuera.
- `prefers-reduced-motion`: se dibuja el campo quieto y no se sigue al puntero.
- Si el canvas 2D no está disponible, el hero queda con el fondo negro y el contenido legible; no hay video de respaldo.

### Front en general
- Header: siempre visible, wordmark inline, menú con estado de apertura claro y foco visible.
- Hero: metadata con la marca y un indicador de scroll hacia el contenido; título con mejor jerarquía y CTA principal. No hay contador de frames ni de progreso.
- Secciones: se mantienen las actuales y su estructura; se ajusta el ritmo vertical, la jerarquía tipográfica, el espaciado y el hover de tarjetas y botones dentro de los tokens violeta/negro existentes.
- Microinteracciones: transiciones cortas con `transform`/`opacity`, respeto por `prefers-reduced-motion`.
- Reveal al hacer scroll con `IntersectionObserver`, con fallback de contenido visible si no hay soporte.
- Accesibilidad: contraste, foco visible, `aria` donde corresponde, texto alternativo solo para elementos informativos.

### Pruebas
- Nuevo archivo de tests para el módulo de partículas: inicialización, reacción al puntero, retorno al soltar y reduced motion, usando un canvas simulado.
- Reescribir `scroll.test.mjs` para el nuevo `main.js` sin estado de scroll: menú, indicador de scroll y reveal por `IntersectionObserver`.
- Actualizar los tests existentes para afirmar que **no** quedan `three`, `scene.js`, `ezgif-frame-`, MP4 ni PNG del logo, y que el hero mide `100vh`.
- Verificación en Chrome headless: sin errores de consola, canvas dibujando y contenido visible.

## Lo que queda al builder

- El número exacto de partículas y la fuerza del imán se ajustan durante la implementación y verificación visual.
- Los textos actuales se conservan en esencia; se puede pulir el copy sin cambiar el tono.
