/**
 * NEXOR - Escena 3D de la intro.
 * Los 100 frames son la textura de un plano en WebGL; el scroll y el puntero
 * manejan la cámara y la rotación. Si WebGL no está disponible, queda el video.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(() => {
    "use strict";

    const canvas = document.getElementById("hero-canvas");
    const video = document.getElementById("hero-video");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FRAME_COUNT = 100;
    const PLANE_SIZE = 2.7;

    function fallback() {
        if (canvas) canvas.style.display = "none";
        if (video) {
            video.style.display = "block";
            const play = video.play();
            if (play && typeof play.catch === "function") play.catch(() => {});
        }
        window.nexorSceneReady = false;
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
        console.warn("WebGL no disponible: se usa el video de respaldo.", error);
        fallback();
        return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    canvas.style.display = "block";
    if (video) {
        video.pause();
        video.style.display = "none";
    }
    window.nexorSceneReady = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // --- La foto: un plano con el frame correspondiente al scroll ---
    const loader = new THREE.TextureLoader();
    const textures = new Map();
    let aspect = 1;

    function getTexture(index) {
        const safeIndex = Math.max(0, Math.min(FRAME_COUNT - 1, index));
        if (!textures.has(safeIndex)) {
            const src = `frames/ezgif-frame-${String(safeIndex + 1).padStart(3, "0")}.jpg`;
            const texture = loader.load(src, (loaded) => {
                if (loaded.image && loaded.image.width && loaded.image.height) {
                    aspect = loaded.image.width / loaded.image.height;
                }
            });
            texture.colorSpace = THREE.SRGBColorSpace;
            textures.set(safeIndex, texture);
        }
        return textures.get(safeIndex);
    }

    const photoMaterial = new THREE.MeshBasicMaterial({
        map: getTexture(0),
        transparent: true,
    });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE), photoMaterial);
    scene.add(photo);

    // --- Partículas violetas en el espacio ---
    const count = window.innerWidth < 768 ? 220 : 480;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
        particlesGeometry,
        new THREE.PointsMaterial({
            color: 0x8c52ff,
            size: 0.028,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
        }),
    );
    scene.add(particles);

    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }
    window.addEventListener("resize", resize);

    canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        fallback();
    });

    let lastFrame = -1;

    function animate() {
        requestAnimationFrame(animate);

        const state = window.nexorState || { fraction: 0, frame: 0, mouseX: 0, mouseY: 0 };
        const progress = state.fraction || 0;
        const mouseX = reduceMotion ? 0 : state.mouseX || 0;
        const mouseY = reduceMotion ? 0 : state.mouseY || 0;

        if (state.frame !== lastFrame) {
            lastFrame = state.frame;
            photoMaterial.map = getTexture(lastFrame);
            photoMaterial.needsUpdate = true;
        }

        const zoom = 1 + progress * 0.12;
        photo.scale.set(aspect * zoom, zoom, 1);
        photo.position.y = 0.22 + progress * 0.16;
        photo.rotation.y = reduceMotion ? -0.18 : -0.18 + progress * 0.42 + mouseX * 0.09;
        photo.rotation.x = reduceMotion ? 0 : mouseY * 0.06;

        particles.rotation.y = reduceMotion ? 0 : progress * 0.35;
        particles.rotation.x = reduceMotion ? 0 : mouseY * 0.1;
        particles.position.z = progress * 1.2;

        camera.position.x = mouseX * 0.22;
        camera.position.y = mouseY * 0.16;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    animate();
})();
