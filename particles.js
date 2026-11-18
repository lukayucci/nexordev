/**
 * NEXOR - Campo de partículas del hero.
 * Canvas 2D, sin dependencias: las partículas siguen al puntero como un imán
 * y vuelven a su lugar con un muelle amortiguado.
 */

(() => {
    "use strict";

    const DEFAULTS = {
        particleCount: 180,
        magnetRadius: 180,
        seed: 1,
        reducedMotion: false,
    };

    function mulberry32(seed) {
        let a = seed;
        return () => {
            a |= 0;
            a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    window.createParticleField = function createParticleField(canvas, options = {}) {
        const config = Object.assign({}, DEFAULTS, options);
        const ctx = canvas && canvas.getContext("2d");
        const available = Boolean(ctx);
        const reducedMotion = Boolean(config.reducedMotion);
        let destroyed = false;
        let pointerActive = false;
        let width = 0;
        let height = 0;
        let rafId = null;
        let particles = [];
        const pointer = { x: 0, y: 0 };
        const bound = [];

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const area = width * height;
            const count = Math.min(config.particleCount, Math.max(40, Math.floor(area / 6000)));
            const random = mulberry32(config.seed);
            const previous = particles;
            particles = [];

            for (let i = 0; i < count; i++) {
                const baseX = random() * width;
                const baseY = random() * height;
                const old = previous[i];
                particles.push({
                    baseX,
                    baseY,
                    x: old ? old.x : baseX,
                    y: old ? old.y : baseY,
                    vx: 0,
                    vy: 0,
                    radius: 0.8 + random() * 1.4,
                });
            }
        }

        function update() {
            for (const particle of particles) {
                let ax = (particle.baseX - particle.x) * 0.02;
                let ay = (particle.baseY - particle.y) * 0.02;

                if (pointerActive && !reducedMotion) {
                    const dx = pointer.x - particle.x;
                    const dy = pointer.y - particle.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < config.magnetRadius && distance > 0.1) {
                        const strength = (1 - distance / config.magnetRadius) * 2.2;
                        ax += dx / distance * strength;
                        ay += dy / distance * strength;
                    }
                }

                particle.vx = (particle.vx + ax) * 0.82;
                particle.vy = (particle.vy + ay) * 0.82;
                particle.x += particle.vx;
                particle.y += particle.vy;
            }
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            if (pointerActive && !reducedMotion) {
                const halo = ctx.createRadialGradient(
                    pointer.x, pointer.y, 0,
                    pointer.x, pointer.y, config.magnetRadius,
                );
                halo.addColorStop(0, "rgba(140, 82, 255, 0.18)");
                halo.addColorStop(1, "rgba(140, 82, 255, 0)");
                ctx.fillStyle = halo;
                ctx.fillRect(0, 0, width, height);
            }

            ctx.fillStyle = "#8c52ff";
            for (const particle of particles) {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function frame() {
            if (destroyed) return;
            update();
            draw();
            rafId = window.requestAnimationFrame(frame);
        }

        function onPointerMove(event) {
            if (destroyed || reducedMotion) return;
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointerActive = true;
        }

        function deactivate() {
            pointerActive = false;
        }

        function onPointerDown(event) {
            if (destroyed || reducedMotion) return;
            for (const particle of particles) {
                const dx = particle.x - event.clientX;
                const dy = particle.y - event.clientY;
                const distance = Math.hypot(dx, dy) || 1;
                if (distance < config.magnetRadius) {
                    const force = (1 - distance / config.magnetRadius) * 6;
                    particle.vx += dx / distance * force;
                    particle.vy += dy / distance * force;
                }
            }
        }

        function start() {
            if (!available || destroyed || rafId !== null) return;
            rafId = window.requestAnimationFrame(frame);
        }

        function stop() {
            if (rafId === null) return;
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        function destroy() {
            if (destroyed) return;
            stop();
            destroyed = true;
            for (const [name, handler] of bound) {
                window.removeEventListener(name, handler);
            }
            bound.length = 0;
        }

        function getState() {
            return {
                available,
                count: particles.length,
                pointerActive,
                pointer: { x: pointer.x, y: pointer.y },
                reducedMotion,
                destroyed,
                particles: particles.map(({ x, y, baseX, baseY }) => ({ x, y, baseX, baseY })),
            };
        }

        if (available) {
            const handlers = {
                pointermove: onPointerMove,
                pointerleave: deactivate,
                pointerup: deactivate,
                pointercancel: deactivate,
                pointerdown: onPointerDown,
                resize,
            };
            for (const [name, handler] of Object.entries(handlers)) {
                window.addEventListener(name, handler);
                bound.push([name, handler]);
            }
            resize();
            start();
        }

        return { start, stop, destroy, getState };
    };
})();
