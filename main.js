/**
 * NEXOR - Estado de la intro.
 * Calcula el avance del scroll y se lo pasa a scene.js, que mueve la escena 3D.
 */

(() => {
    "use strict";

    const header = document.getElementById("main-header");
    const heroSection = document.querySelector(".hero");
    const heroContent = document.getElementById("hero-content");
    const heroCanvas = document.getElementById("particle-canvas");
    const progressCounter = document.querySelector("[data-progress-counter]");
    const heroLayers = Array.from(document.querySelectorAll("[data-hero-layer]"));
    const menuBtn = document.getElementById("menu-btn");
    const menu = document.getElementById("main-menu");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scrollFraction = 0;
    let ticking = false;

    const state = { progress: 0, fraction: 0, frame: 0, mouseX: 0, mouseY: 0 };
    window.nexorState = state;

    // --- Menú ---
    function setMenu(open) {
        if (!menu || !menuBtn) return;
        menu.classList.toggle("header__menu--open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }

    if (menuBtn && menu) {
        menuBtn.addEventListener("click", () => {
            setMenu(!menu.classList.contains("header__menu--open"));
        });
        menu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => setMenu(false));
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setMenu(false);
        });
    }

    // --- Puntero, para el parallax de la cámara ---
    window.addEventListener("mousemove", (event) => {
        if (reduceMotion) return;
        state.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        state.mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // --- Scroll ---
    function updateFromScroll() {
        const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight * 4;
        const maxScroll = Math.max(1, heroHeight - window.innerHeight);
        scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));

        state.progress = scrollFraction;
        state.fraction = scrollFraction;
        state.frame = Math.floor(scrollFraction * 99);

        const fadeStart = 0.86;
        const fade = scrollFraction > fadeStart
            ? Math.max(0, 1 - (scrollFraction - fadeStart) / (1 - fadeStart))
            : 1;

        if (progressCounter) {
            progressCounter.textContent = String(Math.round(scrollFraction * 100)).padStart(3, "0");
        }

        if (heroCanvas) heroCanvas.style.opacity = String(fade);

        heroLayers.forEach((layer, index) => {
            const speed = [0.5, 0.9, 1.3][index] ?? 1;
            const shift = reduceMotion ? 0 : -scrollFraction * 26 * speed;
            layer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        });

        if (heroContent) {
            heroContent.style.opacity = String(fade);
            heroContent.style.pointerEvents = fade < 0.1 ? "none" : "auto";
        }

        const showHeader = window.scrollY < 10 || scrollFraction > 0.95;
        if (header) header.classList.toggle("header--visible", showHeader);
        if (!showHeader) setMenu(false);
    }

    updateFromScroll();
    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
                updateFromScroll();
                ticking = false;
            });
        }
    }, { passive: true });

    // --- Campo de partículas del hero ---
    if (heroCanvas && typeof window.createParticleField === "function") {
        const field = window.createParticleField(heroCanvas, { reducedMotion });
        field.start();
    }
})();
