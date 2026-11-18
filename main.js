/**
 * NEXOR - Animación interactiva del hero
 * Canvas con partículas + secuencia de 100 frames controlada por el scroll.
 */

(() => {
    "use strict";

    const canvas = document.getElementById("hero-canvas");
    const video = document.getElementById("hero-video");
    const header = document.getElementById("main-header");
    const heroSection = document.querySelector(".hero");
    const heroContent = document.getElementById("hero-content");
    const frameCounter = document.querySelector("[data-frame-counter]");
    const heroLayers = Array.from(document.querySelectorAll("[data-hero-layer]"));
    const menuBtn = document.getElementById("menu-btn");
    const menu = document.getElementById("main-menu");

    const FRAME_COUNT = 100; // frames/ezgif-frame-001.jpg ... ezgif-frame-100.jpg
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const images = [];
    const particles = [];
    let currentFrame = 0;
    let scrollFraction = 0;
    let ticking = false;

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

    // --- Canvas, con video como fallback ---
    const ctx = canvas ? canvas.getContext("2d") : null;
    if (!ctx) {
        if (canvas) canvas.style.display = "none";
        if (video) video.style.display = "block";
    } else if (video) {
        video.pause();
        video.style.display = "none";
    }

    // --- Partículas ---
    class Particle {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.speedY = (Math.random() - 0.5) * 0.8;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = "rgba(255, 92, 53, 0.5)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles.length = 0;
        const count = window.innerWidth < 768 ? 40 : 70;
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    // --- Precarga de frames ---
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = () => {
            if (reduceMotion) drawScene(false);
        };
        img.onerror = () => console.warn(`No se pudo cargar el frame ${i}.`);
        img.src = `frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;
        images.push(img);
    }

    // --- Dibujo ---
    function drawScene(animate) {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((particle, index) => {
            if (animate) particle.update();
            particle.draw();

            for (let j = index + 1; j < particles.length; j++) {
                const other = particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.strokeStyle = `rgba(255, 92, 53, ${Math.max(0, 0.2 - distance / 600)})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }
        });

        const img = images[currentFrame];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        if (img && img.complete && img.naturalWidth > 0) {
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.88;
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
        } else {
            // Placeholder mientras cargan los frames
            const radius = Math.min(canvas.width, canvas.height) * 0.16;
            ctx.fillStyle = "rgba(255, 92, 53, 0.16)";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            ctx.font = `600 ${Math.max(12, radius * 0.16)}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("NEXOR", cx, cy);
        }
    }

    function loop() {
        drawScene(true);
        requestAnimationFrame(loop);
    }

    // --- Scroll ---
    function updateFromScroll() {
        const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight * 4;
        const maxScroll = Math.max(1, heroHeight - window.innerHeight);
        scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        currentFrame = Math.floor(scrollFraction * (FRAME_COUNT - 1));

        const fadeStart = 0.86;
        const fade = scrollFraction > fadeStart
            ? Math.max(0, 1 - (scrollFraction - fadeStart) / (1 - fadeStart))
            : 1;

        if (frameCounter) {
            frameCounter.textContent = String(currentFrame + 1).padStart(3, "0");
        }

        if (canvas) canvas.style.opacity = String(fade);

        heroLayers.forEach((layer, index) => {
            const speed = [0.35, 0.75, 1.15][index] ?? 1;
            const shift = reduceMotion ? 0 : -scrollFraction * 44 * speed;
            layer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        });

        if (heroContent) {
            heroContent.style.opacity = String(fade);
            heroContent.style.pointerEvents = fade < 0.1 ? "none" : "auto";
        }

        const showHeader = window.scrollY < 10 || scrollFraction > 0.95;
        if (header) header.classList.toggle("header--visible", showHeader);
        if (!showHeader) setMenu(false);

        if (reduceMotion) drawScene(false);
    }

    function resize() {
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
        drawScene(false);
    }

    // --- Arranque ---
    resize();
    updateFromScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
                updateFromScroll();
                ticking = false;
            });
        }
    }, { passive: true });

    if (!reduceMotion && ctx) requestAnimationFrame(loop);
})();
