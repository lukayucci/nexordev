/**
 * NEXOR - Script de Animación Interactiva
 * Canvas: Partículas de fondo + Secuencia de frames por scroll
 */

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const header = document.getElementById("main-header");
const heroSection = document.getElementById("hero-section");

// --- CONFIGURACIÓN ---
const frameCount = 100; // Tus 120 frames de ezgif
const images = [];
const particles = [];
let currentFrame = 0;
let scrollFraction = 0;

// 1. AJUSTE DE TAMAÑO (Responsive)
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// 2. PRE-CARGA DE IMÁGENES
// Cargamos ezgif-frame-001.jpg hasta ezgif-frame-120.jpg
for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    const fileName = `ezgif-frame-${i.toString().padStart(3, '0')}.jpg`;
    img.src = `frames/${fileName}`;
    images.push(img);
    
    img.onerror = () => console.error(`Error cargando: ${img.src}. Revisá nombres y ruta.`);
}

// 3. LÓGICA DE PARTÍCULAS (Sistema de Red/Constelación)
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

        // Rebote suave en los bordes
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
    }
    draw() {
        ctx.fillStyle = "rgba(140, 82, 255, 0.4)"; // Violeta Nexor traslúcido
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Creamos unas 70 partículas para no sobrecargar el procesador
for (let i = 0; i < 70; i++) {
    particles.push(new Particle());
}

// 4. FUNCIÓN DE RENDERIZADO (Loop Principal)
function render() {
    // Limpiamos el canvas en cada frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DIBUJAR FONDO: Partículas y Líneas
    particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Dibujar líneas entre partículas cercanas
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                ctx.strokeStyle = `rgba(140, 82, 255, ${0.2 - distance / 600})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });

    // DIBUJAR LOGO: El frame actual basado en el scroll
    const img = images[currentFrame];
    if (img && img.complete) {
        // Mantenemos el aspecto ratio y centramos
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.88;
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        
        ctx.drawImage(img, x, y, w, h);
    }

    requestAnimationFrame(render);
}

// 5. CONTROL DE SCROLL (Manejo de estados)
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const maxScroll = heroSection.offsetHeight - window.innerHeight;
    
    // Calculamos el progreso (0 a 1)
    scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));

    // Mapeamos el progreso a los 120 frames
    const frameIndex = Math.floor(scrollFraction * (frameCount - 1));
    currentFrame = frameIndex;

    // Lógica visual del Header y Fade del Canvas al final del scroll
    if (scrollFraction > 0.95) {
        // Aparece el Header con facha
        header.classList.add('header--visible');
        // El canvas se desvanece rápido para dar paso al contenido
        canvas.style.opacity = (1 - (scrollFraction - 0.95) * 20).toString();
    } else {
        header.classList.remove('header--visible');
        canvas.style.opacity = "1";
    }
});

// Arrancamos la magia
render();