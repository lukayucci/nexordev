# De la X a NEXOR - design corto

## Intencion
Reemplazar la animacion de 100 frames por una escena Three.js: una X tecnologica violeta que, con el scroll, se convierte en la palabra NEXOR.

## Composicion
- Inicio: X principal de doble brazo diagonal, segunda X fina girada, anillo HUD, nodos y particulas que recorren los brazos.
- Scroll: la X fina y el anillo se apagan; la X principal se interpola hasta la X de la palabra; N, E, O y R aparecen en orden de izquierda a derecha con trazos y glow.
- Color: violeta #8c52ff. Canvas con alpha y hero sin fondo propio: el video de la máquina se ve detrás, sin capa negra.

## Restricciones
- Three.js desde CDN, sin build.
- main.js publica el progreso y el puntero; scene.js renderiza.
- prefers-reduced-motion y fallback al video si WebGL falla.
- El contador pasa a ser porcentaje de formacion, no frame.
