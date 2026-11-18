/**
 * NEXOR - Interacciones del sitio.
 * Menú, revelado de secciones y campo de partículas del hero.
 * El hero es de una sola pantalla: no hay motor de scroll ni parallax.
 */

(() => {
    "use strict";

    const menuBtn = document.getElementById("menu-btn");
    const menu = document.getElementById("main-menu");
    const heroCanvas = document.getElementById("particle-canvas");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // --- Reveal al hacer scroll ---
    const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (typeof window.IntersectionObserver === "function") {
        const observer = new window.IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting !== false) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            }
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    // --- Campo de partículas del hero ---
    if (heroCanvas && typeof window.createParticleField === "function") {
        const field = window.createParticleField(heroCanvas, { reducedMotion });
        field.start();
    }
})();
