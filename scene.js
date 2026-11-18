/**
 * NEXOR - Intro 3D: una X tecnologica se convierte en la palabra NEXOR.
 * main.js publica el progreso del scroll y el puntero; aca se renderiza todo.
 * El canvas es transparente: el video de la maquina se ve detras, sin capa negra.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(() => {
    "use strict";

    const canvas = document.getElementById("hero-canvas");
    const video = document.getElementById("hero-video");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function fallback() {
        if (canvas) canvas.style.display = "none";
        if (video) {
            video.style.display = "block";
            const play = video.play();
            if (play && typeof play.catch === "function") play.catch(() => {});
        }
        window.nexorSceneReady = false;
        window.sceneReady = false;
    }

    if (!canvas) {
        fallback();
        return;
    }

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        });
    } catch (error) {
        console.warn("WebGL no disponible: se deja el video de fondo.", error);
        fallback();
        return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    canvas.style.display = "block";
    if (video) video.pause();
    window.nexorSceneReady = true;
    window.sceneReady = true;

    const VIOLET = 0x8c52ff;
    const LIGHT = 0xcbb6ff;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const root = new THREE.Group();
    scene.add(root);

    const barGeometry = new THREE.PlaneGeometry(1, 1);

    function makeBar(parent) {
        const group = new THREE.Group();
        const glow = new THREE.Mesh(barGeometry, new THREE.MeshBasicMaterial({
            color: VIOLET,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        const core = new THREE.Mesh(barGeometry, new THREE.MeshBasicMaterial({
            color: VIOLET,
            transparent: true,
            opacity: 0,
            depthWrite: false,
        }));
        group.add(glow, core);
        parent.add(group);
        return { group, glow, core };
    }

    function setBar(bar, x1, y1, x2, y2, thickness, alpha, extraRotation = 0) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        bar.group.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
        bar.group.rotation.z = Math.atan2(dy, dx) + extraRotation;
        bar.core.scale.set(length, thickness, 1);
        bar.glow.scale.set(length, thickness * 3.6, 1);
        bar.core.material.opacity = alpha;
        bar.glow.material.opacity = alpha * 0.2;
    }

    function smoothstep(from, to, value) {
        const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
        return t * t * (3 - 2 * t);
    }

    // --- La palabra, definida como trazos ---
    const circle = [];
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const b = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        circle.push([
            Math.cos(a) * 0.5, Math.sin(a) * 0.75,
            Math.cos(b) * 0.5, Math.sin(b) * 0.75,
        ]);
    }

    const glyphs = {
        N: [[-0.5, -0.75, -0.5, 0.75], [-0.5, 0.75, 0.5, -0.75], [0.5, -0.75, 0.5, 0.75]],
        E: [[0.5, -0.75, -0.5, -0.75], [-0.5, -0.75, -0.5, 0.75], [-0.5, 0.75, 0.5, 0.75], [-0.5, 0, 0.35, 0]],
        X: [[-0.5, -0.75, 0.5, 0.75], [-0.5, 0.75, 0.5, -0.75]],
        O: circle,
        R: [
            [-0.5, -0.75, -0.5, 0.75],
            [-0.5, 0.75, 0.25, 0.75],
            [0.25, 0.75, 0.5, 0.5],
            [0.5, 0.5, 0.25, 0.2],
            [0.25, 0.2, -0.5, 0.2],
            [0.05, 0.2, 0.5, -0.75],
        ],
    };

    const word = "NEXOR";
    const spacing = 1.45;
    const startX = [[-1.35, -1.35, 1.35, 1.35], [-1.35, 1.35, 1.35, -1.35]];
    const endX = glyphs.X;

    const reveals = {
        N: [0.02, 0.28],
        E: [0.24, 0.5],
        O: [0.55, 0.8],
        R: [0.72, 0.98],
    };

    const xBars = [makeBar(root), makeBar(root)];
    const otherBars = [];

    word.split("").forEach((letter, index) => {
        if (letter === "X") return;
        const offset = (index - 2) * spacing;
        const reveal = reveals[letter];
        glyphs[letter].forEach((segment) => {
            otherBars.push({
                bar: makeBar(root),
                segment: segment.map((value, i) => i % 2 === 0 ? value + offset : value),
                reveal,
            });
        });
    });

    // --- Adornos de la X inicial: doble trazo, anillo HUD, nodos y particulas ---
    const decor = new THREE.Group();
    root.add(decor);

    const fineX = [makeBar(decor), makeBar(decor)];

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.55, 1.58, 96, 1, 0.15, Math.PI * 1.55),
        new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    decor.add(ring);

    const nodeMaterial = new THREE.MeshBasicMaterial({ color: LIGHT, transparent: true, opacity: 0.95 });
    const nodes = [[-1.35, -1.35], [1.35, 1.35], [-1.35, 1.35], [1.35, -1.35], [0, 0]];
    nodes.forEach(([x, y]) => {
        const node = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), nodeMaterial);
        node.position.set(x, y, 0.01);
        decor.add(node);
    });

    const particleCount = 60;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
        color: LIGHT,
        size: 0.055,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));
    decor.add(particles);

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        root.scale.setScalar(Math.min(1, camera.aspect / 1.2));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener("resize", resize);
    resize();

    canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        fallback();
    });

    function animate(time) {
        requestAnimationFrame(animate);

        const state = window.nexorState || { progress: 0, mouseX: 0, mouseY: 0 };
        const progress = state.progress ?? state.fraction ?? 0;
        const mouseX = reduceMotion ? 0 : state.mouseX || 0;
        const mouseY = reduceMotion ? 0 : state.mouseY || 0;
        const morph = smoothstep(0.08, 0.62, progress);
        const decorAlpha = 1 - smoothstep(0.02, 0.4, progress);

        // La X grande se achica y se convierte en la X de NEXOR.
        startX.forEach((from, index) => {
            const to = endX[index];
            const segment = from.map((value, i) => value + (to[i] - value) * morph);
            setBar(xBars[index], ...segment, 0.22 - 0.11 * morph, 1);
        });

        // La segunda X fina, girada 45 grados, se apaga con el scroll.
        setBar(fineX[0], ...startX[0], 0.035, decorAlpha, Math.PI / 4);
        setBar(fineX[1], ...startX[1], 0.035, decorAlpha, Math.PI / 4);

        // Las demas letras aparecen de izquierda a derecha.
        otherBars.forEach(({ bar, segment, reveal }) => {
            const alpha = smoothstep(reveal[0], reveal[1], progress);
            setBar(bar, ...segment, 0.11, alpha);
        });

        ring.material.opacity = decorAlpha * 0.55;
        nodeMaterial.opacity = decorAlpha * 0.95;
        particles.material.opacity = decorAlpha * 0.9;
        if (!reduceMotion) ring.rotation.z += 0.003;

        for (let i = 0; i < particleCount; i++) {
            const t = reduceMotion
                ? i / particleCount
                : (time * 0.00016 + i / particleCount) % 1;
            const source = startX[i % 2];
            particlePositions[i * 3] = source[0] + (source[2] - source[0]) * t;
            particlePositions[i * 3 + 1] = source[1] + (source[3] - source[1]) * t;
            particlePositions[i * 3 + 2] = 0.02;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        root.rotation.y = mouseX * 0.14;
        root.rotation.x = -mouseY * 0.09;

        renderer.render(scene, camera);
    }

    window.nexorDebug = { scene, camera, renderer };

    animate(0);
})();
