// ========================================================
// SPRITE CONFIG
// -- Rellena los paths con tus archivos de imagen --
// ========================================================
const SPRITE_CONFIG = {
    // Fase 1 - Stealth
    playerIdleDown: 'sprites/player.png',
    playerIdleUp: 'sprites/player_up.png',
    playerIdleLeft: 'sprites/player_left.png',
    playerIdleRight: 'sprites/player_right.png',

    playerMoveDown: ['sprites/player_down_walk1.png', 'sprites/player_down_walk2.png'],
    playerMoveUp: ['sprites/player_up_walk1.png', 'sprites/player_up_walk2.png'],
    playerMoveLeft: ['sprites/player_left_walk1.png', 'sprites/player_left_walk2.png'],
    playerMoveRight: ['sprites/walk_right_1.png', 'sprites/walk_right_2.png'],

    enemyPatrolRight: ['sprites/run_right_1.png', 'sprites/run_right_2.png'],   // Guardia yendo derecha (patrulla)
    enemyChaseRight: ['sprites/run_right_1.png', 'sprites/run_right_2.png'],    // Guardia yendo derecha (persecución)
    enemyPatrolLeft: ['sprites/run_left_1.png', 'sprites/run_left_2.png'],      // Guardia yendo izquierda (patrulla)
    enemyChaseLeft: ['sprites/run_left_1.png', 'sprites/run_left_2.png'],       // Guardia yendo izquierda (persecución)
    enemyPatrolDown: ['sprites/walk_down_1.png', 'sprites/walk_down_2.png'],    // Guardia yendo abajo
    enemyChaseDown: ['sprites/walk_down_1.png', 'sprites/walk_down_2.png'],
    enemyPatrolUp: ['sprites/run_right_1.png', 'sprites/run_right_2.png'],    // Guardia yendo arriba (fallback provisorio)
    enemyChaseUp: ['sprites/run_right_1.png', 'sprites/run_right_2.png'],
    mapBackground: 'sprites/ingame_bg.png',   // Fondo del mapa/pasillos (reemplaza #stealth-screen background)
    wallTexture: '',   // Textura para las paredes
    poiIcon: '',   // Icono para los puntos de interés (POI)

    // Fase 2 - Point & Click
    sceneBackground: '',   // Fondo de la escena de point & click
    clueIcon: '',   // Icono de pista real
    fakeClueIcon: '',   // Icono de pista falsa

    // Pantallas
    startBackground: 'sprites/start_retro_bg.jpeg',   // Fondo de la pantalla de inicio
    gameOverBg: 'sprites/game_over_clean.png',   // Fondo de Game Over
    victoryBg: 'sprites/victory_bg.png',   // Fondo de Victoria
};

// Precargar imágenes para evitar parpadeos en el juego
// Los valores del config pueden ser strings (una imagen) o arrays (animación con frames)
const sprites = {};
for (const [k, p] of Object.entries(SPRITE_CONFIG)) {
    if (!p) continue;
    if (Array.isArray(p)) {
        // Precargar todos los frames del array
        sprites[k] = p.map(src => { const img = new Image(); img.src = src; return img; });
    } else {
        const img = new Image(); img.src = p; sprites[k] = img;
    }
}

// ========================================================
// IMAGE OPTIMIZATION ENGINE (HTML5 CANVAS)
// ========================================================
const optimizedImageCache = {};

function applyOptimizedBackground(element, path) {
    if (!path || !element) return;

    // Si ya la optimizamos, usarla directo
    if (optimizedImageCache[path]) {
        element.style.backgroundImage = `url('${optimizedImageCache[path]}')`;
        return;
    }

    // Cargar la imagen y escalarla si excede los límites (evita lag por alto uso de VRAM)
    const img = new Image();
    img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Dibujar la imagen escalada en el canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a base64 DataURL (JPEG al 70% de calidad para ahorrar memoria)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
            optimizedImageCache[path] = dataUrl;

            element.style.backgroundImage = `url('${dataUrl}')`;
        } else {
            optimizedImageCache[path] = path;
            element.style.backgroundImage = `url('${path}')`;
        }
    };
    img.onerror = () => {
        // Fallback en caso de error
        element.style.backgroundImage = `url('${path}')`;
    };
    img.src = path;
}

// Helper: aplica un path de imagen directamente a un elemento
function applyDirectSprite(element, path) {
    if (!path || !element) return;
    element.style.backgroundImage = `url('${path}')`;
    element.style.backgroundColor = 'transparent';
    element.style.border = 'none';
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
    element.style.backgroundSize = '100% 100%';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundPosition = 'center';
}

// Helper: aplica sprite por key. Si es un array, devuelve true y hay que animar manualmente.
function applySprite(element, key) {
    const val = SPRITE_CONFIG[key];
    if (!val || !element) return;
    // Si es string, aplicar directo
    const path = Array.isArray(val) ? val[0] : val;
    applyDirectSprite(element, path);
}

// Helper: aplica sprite de fondo a pantallas o contenedores grandes
function applyBgSprite(element, key) {
    const path = SPRITE_CONFIG[key];
    if (!path || !element) return;
    applyOptimizedBackground(element, path);
    element.style.backgroundColor = 'transparent';
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';

    // Custom exception for game-over to crop out the native black bar embedded in the user's image file
    if (element.id === 'game-over-screen') {
        element.style.backgroundSize = '100% 135%';
        element.style.backgroundPosition = 'center top';
    }
}

// Conectar todos los sprites a sus elementos cuando el DOM está listo.
// Cada applySprite solo actúa si el path está relleno; de lo contrario los gráficos CSS siguen igual.
function initSprites() {
    // Jugador
    applySprite(document.getElementById('player'), 'playerIdleDown');

    // Fondo del mapa phase 1
    applyBgSprite(document.getElementById('stealth-screen'), 'mapBackground');

    // Fondo escena point & click
    applyBgSprite(document.getElementById('scene-image'), 'sceneBackground');

    // Pantallas de UI
    applyBgSprite(document.getElementById('start-screen'), 'startBackground');
    applyBgSprite(document.getElementById('game-over-screen'), 'gameOverBg');
    applyBgSprite(document.getElementById('victory-screen'), 'victoryBg');

    // Textura de paredes (se aplica a todos los .wall)
    if (SPRITE_CONFIG.wallTexture) {
        document.querySelectorAll('.wall').forEach(w => applyBgSprite(w, 'wallTexture'));
    }

    // Icono POI
    if (SPRITE_CONFIG.poiIcon) {
        document.querySelectorAll('.poi').forEach(p => applySprite(p, 'poiIcon'));
    }

    // Iconos de pistas / pistas falsas
    if (SPRITE_CONFIG.clueIcon) {
        document.querySelectorAll('.clue').forEach(c => applySprite(c, 'clueIcon'));
    }
    if (SPRITE_CONFIG.fakeClueIcon) {
        document.querySelectorAll('.fake-clue').forEach(f => applySprite(f, 'fakeClueIcon'));
    }

    // Tutorial static sprites
    applySprite(document.getElementById('tut-player'), 'playerIdleDown');
    applySprite(document.getElementById('tut-enemy'), 'enemyPatrolRight');
    if (SPRITE_CONFIG.clueIcon) applySprite(document.getElementById('tut-clue'), 'clueIcon');
    if (SPRITE_CONFIG.fakeClueIcon) applySprite(document.getElementById('tut-fake'), 'fakeClueIcon');
}

// Ejecutar cuando el DOM haya terminado de cargar
document.addEventListener('DOMContentLoaded', initSprites);

// ========================================================
// AUDIO CONFIG
// ========================================================
const AUDIO_CONFIG = {
    bgmMusic: '',
    alertSound: '',
    chaseMusic: '',
    findClue: '',
    fakeClue: '',
    gameOver: 'audio/estudiocoati-glitch_02-226609.mp3',
    victory: ''
};

// ========================================================
// AUDIO ENGINE (Pre-buffered synth sounds to avoid lag)
// ========================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const synthBuffers = {};
function createSynthBuffer(name, fn) {
    const sr = audioCtx.sampleRate;
    const len = sr * 0.25;
    const buf = audioCtx.createBuffer(1, len, sr);
    fn(buf.getChannelData(0), sr, len);
    synthBuffers[name] = buf;
}
createSynthBuffer('error', (data, sr, len) => {
    for (let i = 0; i < len; i++) {
        const t = i / sr;
        const env = Math.max(0, 1 - (t / 0.25));
        data[i] = (Math.random() * 2 - 1) * 0.15 * env + Math.sin(2 * Math.PI * (150 - t * 400) * t) * 0.2 * env;
    }
});
createSynthBuffer('alert', (data, sr, len) => {
    for (let i = 0; i < len; i++) {
        const t = i / sr;
        data[i] = Math.sin(2 * Math.PI * 800 * t) * 0.25 * Math.max(0, 1 - (t / 0.15));
    }
});

// Reloj (tick) para cuando pasa el minuto
createSynthBuffer('tick', (data, sr, len) => {
    for (let i = 0; i < len; i++) {
        const t = i / sr;
        const env = Math.max(0, 1 - (t / 0.05)); // decaimiento ultracorto
        data[i] = (Math.random() * 2 - 1) * 0.5 * env;
    }
});

function playMinuteTick() {
    let ticks = 0;
    let int = setInterval(() => {
        playSynth('tick');
        ticks++;
        if (ticks >= 4) clearInterval(int); // 4 ticks = 2 seconds approx
    }, 500);
}

function playSynth(name) {
    if (!synthBuffers[name]) return;
    const src = audioCtx.createBufferSource();
    src.buffer = synthBuffers[name];
    src.connect(audioCtx.destination);
    src.start(0);
}

const audioElements = {};
for (const [k, p] of Object.entries(AUDIO_CONFIG)) {
    if (p) {
        const el = new Audio(p);
        el.preload = 'auto';
        if (k === 'bgmMusic' || k === 'chaseMusic') el.loop = true;
        audioElements[k] = el;
    }
}

const activeSFX = [];
function stopAllSFX() {
    activeSFX.forEach(sfx => sfx.pause());
    activeSFX.length = 0;
}

function playAudio(k) {
    if (audioElements[k]) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (k === 'chaseMusic' || k === 'bgmMusic') {
            if (audioElements.bgmMusic && k !== 'bgmMusic') audioElements.bgmMusic.pause();
            if (audioElements.chaseMusic && k !== 'chaseMusic') audioElements.chaseMusic.pause();
            audioElements[k].currentTime = 0;
            audioElements[k].play().catch(e => console.warn("Audio play blocked:", e));
        } else {
            // Force clone node to avoid browser caching / overlapping issues for SFX and UI
            const clone = audioElements[k].cloneNode();
            clone.volume = audioElements[k].volume || 1;
            clone.play().catch(e => console.warn("Audio play blocked:", e));
            activeSFX.push(clone);
            clone.onended = () => {
                const idx = activeSFX.indexOf(clone);
                if (idx > -1) activeSFX.splice(idx, 1);
            };
        }
    }
}

function playErrorSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (audioElements.fakeClue) playAudio('fakeClue');
    else playSynth('error');
}
function playAlertSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (audioElements.alertSound) playAudio('alertSound');
    else playSynth('alert');
}

document.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });

// ========================================================
// LEVEL BGM ENGINE (Música de fondo en bucle por nivel)
// ========================================================
// Volúmenes para cada estado del juego:
// - Patrulla normal (lejos): volumen base estable
// - Patrulla normal (cerca): volumen intermedio alto
// - Persecución (chase): el volumen sube para aumentar la tensión
// - POI / Intro: el volumen baja para no distraer
const BGM_VOLUME_NORMAL = 0.4;        // Volumen durante patrulla normal (lejos)
const BGM_VOLUME_NORMAL_HIGH = 0.55;  // Volumen durante patrulla normal (mismo cuadrante)
const BGM_VOLUME_CHASE = 0.75;        // Volumen durante persecución (alto pero no molesto)
const BGM_VOLUME_POI = 0.15;          // Volumen bajo al entrar a un POI/intro

let currentLevelBGM = null; // Elemento Audio del BGM del nivel actual

// Inicia la música del nivel indicado en bucle infinito
function playLevelBGM(levelIndex) {
    // Detener BGM anterior si existe
    stopLevelBGM();

    const bgmPath = LEVELS[levelIndex] ? LEVELS[levelIndex].bgm : null;
    if (!bgmPath) return;

    currentLevelBGM = new Audio(bgmPath);
    currentLevelBGM.loop = true;              // Bucle infinito: si la pista termina, reinicia
    currentLevelBGM.volume = BGM_VOLUME_NORMAL;
    currentLevelBGM.play().catch(e => console.warn("Level BGM play blocked:", e));
}

// Detiene completamente el BGM del nivel y libera el recurso
function stopLevelBGM() {
    if (currentLevelBGM) {
        currentLevelBGM.pause();
        currentLevelBGM.currentTime = 0;
        currentLevelBGM = null;
    }
}

// Pausa el BGM del nivel (mantiene la posición para reanudar después)
function pauseLevelBGM() {
    if (currentLevelBGM) currentLevelBGM.pause();
}

// Reanuda el BGM del nivel desde donde se pausó
function resumeLevelBGM() {
    if (currentLevelBGM) {
        currentLevelBGM.play().catch(e => console.warn("Level BGM resume blocked:", e));
    }
}

// Cambia el volumen del BGM suavemente usando una transición gradual
// targetVolume: volumen destino (0.0 a 1.0)
// durationMs: duración de la transición en milisegundos
function setLevelBGMVolume(targetVolume, durationMs) {
    if (!currentLevelBGM) return;

    const startVolume = currentLevelBGM.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 20; // Número de pasos para la transición
    const stepDuration = durationMs / steps;
    let currentStep = 0;

    // Limpiar transición anterior si existe
    if (currentLevelBGM._volumeTransition) {
        clearInterval(currentLevelBGM._volumeTransition);
    }

    currentLevelBGM._volumeTransition = setInterval(() => {
        currentStep++;
        if (currentStep >= steps || !currentLevelBGM) {
            if (currentLevelBGM) {
                currentLevelBGM.volume = targetVolume;
                clearInterval(currentLevelBGM._volumeTransition);
                currentLevelBGM._volumeTransition = null;
            }
            return;
        }
        // Interpolación lineal entre volumen actual y destino
        currentLevelBGM.volume = startVolume + (volumeDiff * (currentStep / steps));
    }, stepDuration);
}

// ========================================================
// DOM REFS
// ========================================================
const screens = document.querySelectorAll('.screen');
const stealthScreen = document.getElementById('stealth-screen');
const playerEl = document.getElementById('player');
const timerDisplay = document.getElementById('global-timer');
const cluesDisplay = document.getElementById('global-clues');
const mistakesDisplay = document.getElementById('mistakes-display');
const gameOverReason = document.getElementById('game-over-reason');

function formatTime(s) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
}

// ========================================================
// LEVEL CONFIGURATION ENGINE
// ========================================================
let currentLevel = 0;

const LEVELS = [
    {
        name: "Sector de Entrada",
        bgm: 'audio/level1_bgm.m4a',          // Música de fondo en bucle para este nivel
        background: 'sprites/ingame_bg.png',
        playerSpawn: { x: 480, y: 410 },
        enemySpawn: { x: 216, y: 72 },
        enemyRoutes: [
            [{ x: 216, y: 72 }, { x: 744, y: 72 }, { x: 864, y: 120 }, { x: 864, y: 384 }, { x: 744, y: 416 }, { x: 216, y: 416 }, { x: 96, y: 384 }, { x: 96, y: 120 }],
            [{ x: 216, y: 176 }, { x: 744, y: 176 }, { x: 744, y: 304 }, { x: 216, y: 304 }]
        ],
        walls: [
            { x: 300, y: 120, w: 360, h: 32 }, { x: 300, y: 328, w: 360, h: 32 }, { x: 300, y: 152, w: 48, h: 32 },
            { x: 300, y: 296, w: 48, h: 32 }, { x: 612, y: 152, w: 48, h: 32 }, { x: 612, y: 296, w: 48, h: 32 },
            { x: 120, y: 240, w: 96, h: 32 }, { x: 744, y: 240, w: 96, h: 32 }
        ],
        pois: [
            {
                id: 'poi-1', x: 864, y: 416, sceneBg: 'sprites/bg_desk.png',
                // ACERTIJO A → type-paper
                introText: "Me puedes doblar pero no caminar. Guardo secretos sin poder hablar.",
                clueText: "19", containerType: "type-paper"
            },
            {
                id: 'poi-1b', x: 150, y: 150, sceneBg: 'sprites/bg_shelf.png',
                // ACERTIJO A → type-box
                introText: "Tengo tapa y fondo pero no soy una habitación. Guardo lo que no quieren que veas.",
                clueText: "8", containerType: "type-box"
            },
            {
                id: 'poi-1c', x: 480, y: 200, sceneBg: 'sprites/bg_cabinet.png',
                // ACERTIJO A → type-trash
                introText: "Nadie me revisa porque creen que soy basura. Ese fue su error.",
                clueText: "4", containerType: "type-trash"
            }
        ],
        exit: { x: 480, y: 72 },
        passcode: "1984",
        lore: "<h3>REPORTE 001</h3>\nEncontré la entrada principal vacía... o al menos eso parece.\nLos guardias siguen patrones predecibles, pero algo se siente mal.\nEsta instalación esconde algo enorme.\n"
    },
    {
        name: "Oficinas de Seguridad",
        bgm: 'audio/Nivel2.m4a',
        background: 'sprites/ingame_bg_nivel2.jpg',
        playerSpawn: { x: 96, y: 410 },
        enemySpawn: { x: 480, y: 72 },
        enemyRoutes: [
            [{ x: 480, y: 72 }, { x: 864, y: 72 }, { x: 864, y: 400 }, { x: 480, y: 400 }, { x: 120, y: 240 }]
        ],
        walls: [
            { x: 200, y: 100, w: 48, h: 250 }, { x: 700, y: 100, w: 48, h: 250 },
            { x: 350, y: 200, w: 200, h: 48 }
        ],
        pois: [
            {
                id: 'poi-2', x: 480, y: 100, sceneBg: 'sprites/bg_cabinet.png',
                // ACERTIJO A → type-electronic
                introText: "Tengo pantalla pero no tengo ojos. Guardo memoria aunque finjan que estoy apagado.",
                clueText: "23", containerType: "type-electronic"
            },
            {
                id: 'poi-2b', x: 100, y: 300, sceneBg: 'sprites/bg_desk.png',
                // ACERTIJO B → type-box
                introText: "Me cierran con fuerza para que no salga lo que está adentro. Soy cuadrado y guardo el secreto.",
                clueText: "0", containerType: "type-box"
            },
            {
                id: 'poi-2c', x: 800, y: 300, sceneBg: 'sprites/bg_shelf.png',
                // ACERTIJO B → type-paper
                introText: "Soy delgado y fácil de ignorar. Pero en mí está escrito lo que alguien quiso esconder.",
                clueText: "9", containerType: "type-paper"
            }
        ],
        exit: { x: 480, y: 400 },
        passcode: "2309",
        lore: "<h3>REPORTE 002</h3>\nLogré infiltrar las oficinas de seguridad.\nHe recuperado parte de los archivos codificados.\nEl proyecto se llama 'O.M.N.I.'.\nRequiero acceso a la base de datos principal.\n"
    },
    {
        name: "Almacén Subterráneo",
        bgm: 'audio/Nivel3.m4a',              // Música de fondo en bucle para el nivel 3
        background: 'sprites/ingame_bg_nivel3.jpg',
        playerSpawn: { x: 480, y: 410 },
        enemySpawn: { x: 100, y: 60 },
        enemyRoutes: [
            [{ x: 100, y: 60 }, { x: 840, y: 60 }, { x: 840, y: 400 }, { x: 100, y: 400 }]
        ],
        extraEnemies: [
            {
                spawn: { x: 100, y: 275 },
                routes: [[{ x: 100, y: 275 }, { x: 350, y: 275 }]]
            }
        ],
        walls: [
            { x: 150, y: 150, w: 150, h: 100 }, { x: 650, y: 150, w: 150, h: 100 },
            { x: 400, y: 300, w: 150, h: 50 }, { x: 450, y: 100, w: 50, h: 100 }
        ],
        pois: [
            {
                id: 'poi-3', x: 96, y: 64, sceneBg: 'sprites/bg_shelf.png',
                // ACERTIJO A → type-box (igual al nivel 1, se reutiliza)
                introText: "Tengo tapa y fondo pero no soy una habitación. Guardo lo que no quieren que veas.",
                clueText: "7", containerType: "type-box"
            },
            {
                id: 'poi-3b', x: 800, y: 60, sceneBg: 'sprites/bg_cabinet.png',
                // ACERTIJO B → type-trash
                introText: "Lo tiraron aquí pensando que desaparecería. Busca lo que descartaron con prisa.",
                clueText: "3", containerType: "type-trash"
            },
            {
                id: 'poi-3c', x: 450, y: 420, sceneBg: 'sprites/bg_desk.png',
                // ACERTIJO B → type-electronic
                introText: "Parpadeo en la oscuridad. Mi memoria no se borra sola. Alguien olvidó cerrar la sesión.",
                clueText: "44", containerType: "type-electronic"
            }
        ],
        exit: { x: 480, y: 60 },
        passcode: "7344",
        lore: "<h3>REPORTE 003</h3>\nEl almacén está lleno de piezas mecánicas.\nConstruyen androides. Endo-esqueletos imparables.\nNo somos los primeros en intentar detenerlos.\nY probablemente tampoco los últimos...\n"
    },
    {
        name: "Cuarto de Servidores",
        bgm: 'audio/nivel_4.m4a',
        background: 'sprites/ingame_bg_nivel4.jpeg',
        playerSpawn: { x: 200, y: 400 },
        enemySpawn: { x: 800, y: 80 },
        enemyRoutes: [
            [{ x: 800, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 400 }, { x: 800, y: 400 }]
        ],
        extraEnemies: [
            {
                spawn: { x: 500, y: 300 },
                routes: [[{ x: 500, y: 300 }, { x: 500, y: 440 }, { x: 690, y: 440 }, { x: 690, y: 300 }]]
            }
        ],
        walls: [
            { x: 300, y: 50, w: 50, h: 300 }, { x: 600, y: 150, w: 50, h: 220 },
            { x: 450, y: 200, w: 100, h: 50 }
        ],
        pois: [
            {
                id: 'poi-4', x: 864, y: 416, sceneBg: 'sprites/bg_desk.png',
                // ACERTIJO B → type-box
                introText: "Me cierran con fuerza para que no salga lo que está adentro. Soy cuadrado y guardo el secreto.",
                clueText: "8", containerType: "type-box"
            },
            {
                id: 'poi-4b', x: 100, y: 100, sceneBg: 'sprites/bg_cabinet.png',
                // ACERTIJO A → type-electronic (igual al nivel 2, se reutiliza)
                introText: "Tengo pantalla pero no tengo ojos. Guardo memoria aunque finjan que estoy apagado.",
                clueText: "1", containerType: "type-electronic"
            },
            {
                id: 'poi-4c', x: 480, y: 80, sceneBg: 'sprites/bg_shelf.png',
                // ACERTIJO A → type-trash (igual al nivel 1, se reutiliza)
                introText: "Nadie me revisa porque creen que soy basura. Ese fue su error.",
                clueText: "22", containerType: "type-trash"
            }
        ],
        exit: { x: 480, y: 400 },
        passcode: "8122",
        lore: "<h3>REPORTE 004</h3>\nLos servidores están encriptados con un algoritmo mutante.\nCasi me detectan las cámaras termales.\nEsta es la última barrera antes del núcleo central.\nPreparando rutina de desactivación.\n"
    },
    {
        name: "Computadora Central",
        bgm: 'audio/level1_bgm.m4a',          // TODO: Reemplazar con audio del nivel 5 cuando esté listo
        background: 'sprites/ingame_bg_nivel5.jpeg',
        playerSpawn: { x: 480, y: 410 },
        enemySpawn: null,
        enemyRoutes: [],
        extraEnemies: [
            {
                spawn: { x: 50, y: 240 },
                routes: [[{ x: 50, y: 240 }]],
                isExecutioner: true
            },
            {
                spawn: { x: 910, y: 240 },
                routes: [[{ x: 910, y: 240 }]],
                isExecutioner: true
            }
        ],
        walls: [
            { x: 250, y: 200, w: 460, h: 32, invisible: true }, { x: 250, y: 200, w: 32, h: 100, invisible: true }, { x: 678, y: 200, w: 32, h: 100, invisible: true }
        ],
        pois: [
            { id: 'poi-5', x: 480, y: 150, sceneBg: 'sprites/ingame_bg_nivel5.jpeg', introText: "La computadora central está protegida. Descifra el código de acceso.", clueText: "9999", containerType: "type-electronic", invisible: true, hitOffsetX: 150, hitOffsetY: -20, hitW: 300, hitH: 150 }
        ],
        exit: { x: 480, y: 72 },
        passcode: "9999",
        lore: "<h3>REPORTE FINAL</h3>\nEl núcleo está expuesto.\nSi destruyo esto, todas las unidades activas caerán.\nEs ahora o nunca.\nFin de la transmisión...\n"
    }
];

let walls = [];
let poiData = [];
let poiEls = [];
let currentExitData = null;
let exitEl = null;

function loadLevel(index) {
    if (index >= LEVELS.length) index = LEVELS.length - 1;
    const data = LEVELS[index];

    // Limpiar DOM de nivel previo
    document.querySelectorAll('.wall').forEach(e => e.remove());
    document.querySelectorAll('.poi').forEach(e => e.remove());
    if (exitEl) { exitEl.remove(); exitEl = null; }

    // Cargar físicas y lógica
    walls = data.walls.map(w => ({ ...w }));
    poiData = data.pois.map(p => ({ ...p }));
    if (data.exit) {
        currentExitData = data.exit;
    }

    // Limpiar enemigos DOM previos
    document.querySelectorAll('.enemy').forEach(e => e.remove());
    enemies = [];

    // Configurar enemigos del nivel
    let enemyDefs = [];
    if (data.enemySpawn) enemyDefs.push({ spawn: data.enemySpawn, routes: data.enemyRoutes });
    if (data.extraEnemies) enemyDefs.push(...data.extraEnemies);

    enemyDefs.forEach((def, index) => {
        const en = {
            id: 'enemy-' + index,
            x: def.spawn.x, y: def.spawn.y,
            patrolSpeed: def.isExecutioner ? 0 : 1.2, chaseSpeed: def.isExecutioner ? 4.5 : 2.8,
            radius: 16, width: 48, height: 96,
            state: def.isExecutioner ? 'idle' : 'patrol',
            angle: def.isExecutioner ? (def.spawn.x < 480 ? 0 : Math.PI) : 0,
            patrolIndex: 1, activeRoute: 0,
            routes: def.routes,
            visionRange: def.isExecutioner ? 0 : 250, visionAngle: Math.PI / 4,
            loseAggroTimer: 0,
            wallStuckTimer: 0,
            isExecutioner: def.isExecutioner || false
        };
        enemies.push(en);

        // Crear DOM element
        const el = document.createElement('div');
        el.className = 'enemy';
        el.id = en.id;
        const cone = document.createElement('div');
        cone.className = 'vision-cone';
        el.appendChild(cone);
        stealthScreen.appendChild(el);
    });

    // Cargar config jugador
    player.x = data.playerSpawn.x;
    player.y = data.playerSpawn.y;

    // Renderizar paredes
    walls.forEach(w => {
        const el = document.createElement('div');
        el.className = 'wall';
        if (w.invisible) el.classList.add('invisible-wall');
        el.style.cssText = `left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px`;
        stealthScreen.appendChild(el);
    });

    // Aplicar textura exclusiva de fondo al mapa usando optimización JS directa
    if (data.background) {
        applyOptimizedBackground(stealthScreen, data.background);
    } else if (SPRITE_CONFIG.mapBackground) {
        applyOptimizedBackground(stealthScreen, SPRITE_CONFIG.mapBackground);
    }

    // Volver a aplicar texturas a las paredes nuevas
    if (SPRITE_CONFIG.wallTexture) {
        document.querySelectorAll('.wall').forEach(w => applyBgSprite(w, 'wallTexture'));
    }

    // Renderizar POIs (ahora con forma geométrica/mueble)
    poiEls = poiData.map(p => {
        const el = document.createElement('div');
        el.className = 'poi';
        el.id = p.id;
        el.style.cssText = `left:${p.x}px;top:${p.y}px`;

        // Asignar apariencia basada en su sceneBg
        if (p.sceneBg && !p.invisible) {
            if (p.sceneBg.includes('desk')) el.classList.add('poi-desk');
            else if (p.sceneBg.includes('cabinet')) el.classList.add('poi-cabinet');
            else if (p.sceneBg.includes('shelf')) el.classList.add('poi-shelf');
            else el.classList.add('poi-trash');
        } else if (!p.invisible) {
            if (SPRITE_CONFIG.poiIcon) applySprite(el, 'poiIcon');
        }

        if (p.invisible) {
            el.style.opacity = '0';
        }

        stealthScreen.appendChild(el);
        return el;
    });

    // Renderizar Exit Terminal
    if (currentExitData) {
        exitEl = document.createElement('div');
        exitEl.className = 'exit-terminal-point';
        exitEl.style.cssText = `left:${currentExitData.x}px;top:${currentExitData.y}px`;
        stealthScreen.appendChild(exitEl);
    }
}

function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
}

// ========================================================
// CONTROLS & STATE
// ========================================================
const keys = {};
const validKeys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
window.addEventListener('keydown', e => {
    if (validKeys.includes(e.key)) keys[e.key] = true;

    // Cheat para avanzar de nivel (Tecla L)
    if ((e.key === 'l' || e.key === 'L') && gameState === 'stealth') {
        currentLevel++;
        if (currentLevel >= LEVELS.length) {
            victory();
        } else {
            showLoreScreen();
        }
    }
});
window.addEventListener('keyup', e => { if (validKeys.includes(e.key)) keys[e.key] = false; });

let gameState = 'start';
let animFrameId = 0;
let maxLevelTime = 0; // Tiempo límite asignado por nivel
let timeLeft = 0;
let globalTimerInterval = 0;
let localCluesFound = 0, mistakes = 0;
let globalCluesFound = 0;
// Calcular dinámicamente el total de pistas (POIs) en todos los niveles
const TOTAL_CLUES = LEVELS.reduce((sum, level) => sum + level.pois.length, 0);
const MAX_MISTAKES = 3, TIME_PENALTY = 15;

// La velocidad del jugador en 4.0, la velocidad de persecución en 3.5 para que siempre puedas escapar corriendo
// invincibleTimer: frames restantes de invulnerabilidad post-POI (180 = ~3 segundos a 60fps)
const player = { x: 480, y: 384, speed: 4.0, radius: 12, width: 40, height: 80, lastDirection: 'down', invincibleTimer: 0 };
let enemies = [];
let _globalBgmTension = false;
let _globalBgmChase = false;     // Bandera para evitar llamar setLevelBGMVolume cada frame durante persecución

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('victory-restart-btn').addEventListener('click', startGame);

// ========================================================
// QUADRANT SYSTEM
// Divide el mapa (960×480) en 4 zonas iguales para optimizar
// cálculos de distancia y posicionamiento.
// ========================================================
// Dimensiones del área de juego
const MAP_WIDTH = 960;
const MAP_HEIGHT = 480;
// Punto medio de cada eje
const MAP_HALF_W = MAP_WIDTH / 2;   // 480
const MAP_HALF_H = MAP_HEIGHT / 2;  // 240

// Distribución de cuadrantes:
//   0 = Arriba-Izquierda  |  1 = Arriba-Derecha
//   2 = Abajo-Izquierda   |  3 = Abajo-Derecha

// Devuelve el cuadrante (0-3) en el que se encuentra un punto (x, y).
// Útil para saber en qué zona del mapa está cualquier entidad.
function getQuadrant(x, y) {
    if (x < MAP_HALF_W) {
        return y < MAP_HALF_H ? 0 : 2;  // Izquierda: arriba (0) o abajo (2)
    } else {
        return y < MAP_HALF_H ? 1 : 3;  // Derecha: arriba (1) o abajo (3)
    }
}

// Devuelve el cuadrante diagonalmente opuesto al dado.
// Q0 ↔ Q3, Q1 ↔ Q2. Es el cuadrante más lejano posible.
function getOppositeQuadrant(quadrant) {
    // XOR con 3 invierte ambos bits: 00↔11, 01↔10
    return quadrant ^ 3;
}

// Devuelve las coordenadas del centro de un cuadrante.
// Útil para calcular distancias aproximadas o como punto de referencia.
function getQuadrantCenter(quadrant) {
    const halfW = MAP_HALF_W / 2;  // 240 = centro horizontal de cada mitad
    const halfH = MAP_HALF_H / 2;  // 120 = centro vertical de cada mitad
    switch (quadrant) {
        case 0: return { x: halfW, y: halfH };             // Arriba-Izquierda
        case 1: return { x: MAP_HALF_W + halfW, y: halfH };         // Arriba-Derecha
        case 2: return { x: halfW, y: MAP_HALF_H + halfH };         // Abajo-Izquierda
        case 3: return { x: MAP_HALF_W + halfW, y: MAP_HALF_H + halfH }; // Abajo-Derecha
        default: return { x: MAP_HALF_W, y: MAP_HALF_H };  // Centro del mapa (fallback)
    }
}

// Devuelve los límites {x, y, w, h} del cuadrante dado.
// Útil para verificar si un objeto está dentro de una zona, generar spawns, etc.
function getQuadrantBounds(quadrant) {
    switch (quadrant) {
        case 0: return { x: 0, y: 0, w: MAP_HALF_W, h: MAP_HALF_H };
        case 1: return { x: MAP_HALF_W, y: 0, w: MAP_HALF_W, h: MAP_HALF_H };
        case 2: return { x: 0, y: MAP_HALF_H, w: MAP_HALF_W, h: MAP_HALF_H };
        case 3: return { x: MAP_HALF_W, y: MAP_HALF_H, w: MAP_HALF_W, h: MAP_HALF_H };
        default: return { x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT };
    }
}

// Devuelve todos los puntos de un array que caen dentro del cuadrante indicado.
// Cada punto del array debe tener propiedades { x, y }.
// Retorna un array de objetos { point, index } donde index es la posición original.
function getPointsInQuadrant(points, quadrant) {
    const results = [];
    for (let i = 0; i < points.length; i++) {
        if (getQuadrant(points[i].x, points[i].y) === quadrant) {
            results.push({ point: points[i], index: i });
        }
    }
    return results;
}

// ========================================================
// MATH & COLLISIONS
// ========================================================
function normalizeAngle(a) {
    while (a <= -Math.PI) a += 6.2831853;
    while (a > Math.PI) a -= 6.2831853;
    return a;
}

function segSegIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (denom === 0) return false;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
    const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
    return t > 0 && t < 1 && u > 0 && u < 1;
}

function lineHitsWall(x1, y1, x2, y2) {
    for (let i = 0; i < walls.length; i++) {
        const w = walls[i], l = w.x, r = w.x + w.w, t = w.y, b = w.y + w.h;
        if (segSegIntersect(x1, y1, x2, y2, l, t, r, t) || segSegIntersect(x1, y1, x2, y2, r, t, r, b) ||
            segSegIntersect(x1, y1, x2, y2, r, b, l, b) || segSegIntersect(x1, y1, x2, y2, l, b, l, t)) return true;
    }
    return false;
}

function rectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2;
}

function collidesWithWalls(ent, x, y) {
    if (ent.width && ent.height) {
        // Reducir la hitbox para que sea más permisiva (evita quedarse atascado en bordes)
        // Usamos solo el 60% del ancho y 50% del alto para la caja de colisiones real
        const hitW = ent.width * 0.6;
        const hitH = ent.height * 0.5;
        const l1 = x - hitW / 2;
        const t1 = y - hitH / 2;

        for (let i = 0; i < walls.length; i++) {
            const w = walls[i];
            if (rectRect(l1, t1, hitW, hitH, w.x, w.y, w.w, w.h)) return true;
        }
    } else {
        // Reducir ligeramente el radio para esquinas suaves
        const hitR = ent.radius * 0.8;
        for (let i = 0; i < walls.length; i++) {
            if (circleRect(x, y, hitR, walls[i].x, walls[i].y, walls[i].w, walls[i].h)) return true;
        }
    }
    return false;
}

function moveWithCollisions(ent, dx, dy) {
    let movedX = false, movedY = false;

    // Try moving X
    if (!collidesWithWalls(ent, ent.x + dx, ent.y)) {
        ent.x += dx;
        movedX = Math.abs(dx) > 0;
    } else {
        // Slide or step until collision
        const stepX = Math.sign(dx) * 0.5;
        while (Math.abs(dx) > 0.5 && !collidesWithWalls(ent, ent.x + stepX, ent.y)) {
            ent.x += stepX;
            dx -= stepX;
            movedX = true;
        }
    }

    // Try moving Y
    if (!collidesWithWalls(ent, ent.x, ent.y + dy)) {
        ent.y += dy;
        movedY = Math.abs(dy) > 0;
    } else {
        // Slide or step until collision
        const stepY = Math.sign(dy) * 0.5;
        while (Math.abs(dy) > 0.5 && !collidesWithWalls(ent, ent.x, ent.y + stepY)) {
            ent.y += stepY;
            dy -= stepY;
            movedY = true;
        }
    }

    // Boundaries
    const extX = ent.width ? ent.width / 2 : ent.radius;
    // Reducir la colisión vertical a un cuarto de la altura para que la "cabeza" pueda superponerse a la pared superior 
    // y para evitar trabarse al aparecer en el juego.
    const extY = ent.height ? ent.height * 0.25 : ent.radius;

    if (ent.x < extX) ent.x = extX;
    if (ent.x > 960 - extX) ent.x = 960 - extX;
    if (ent.y < extY) ent.y = extY;
    if (ent.y > 480 - extY) ent.y = 480 - extY;

    return movedX || movedY;
}


// ========================================================
// CORE LOGIC
// ========================================================
function showScreen(id) {
    for (let s of screens) s.classList.remove('active');
    document.getElementById(id).classList.add('active');
}

// Esta función arranca el juego desde cero (Nivel 1) O reinicia tras Game Over.
// NO debe usarse para avanzar de nivel, para eso usamos continue-lore-btn.
function startGame(reset = true) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gameState = 'stealth';

    if (reset) {
        currentLevel = 0;
        globalCluesFound = 0;
        mistakes = 0;
    }

    // El tiempo es independiente por cada nivel (Niveles 1-3 = 180s, Niveles 4-5 = 150s)
    maxLevelTime = (currentLevel < 3) ? 180 : 150;
    timeLeft = maxLevelTime;

    loadLevel(currentLevel); // Generar el mapa y spawnear todo en base al nivel

    // Enemies logic is handled entirely by loadLevel

    for (let el of poiEls) { el.dataset.cleared = '0'; el.style.display = 'block'; }

    showScreen('stealth-screen');
    document.getElementById('global-hud').style.display = 'flex'; // Mostrar HUD in-game
    document.getElementById('global-hud').classList.remove('hud-transparent');
    stopAllSFX();
    _globalBgmChase = false;     // Resetear banderas de volumen para el nuevo nivel
    _globalBgmTension = false;
    stopLevelBGM();          // Detener BGM de nivel anterior si había uno activo
    playLevelBGM(currentLevel); // Iniciar BGM en bucle para el nivel actual

    timerDisplay.textContent = formatTime(timeLeft);
    cluesDisplay.textContent = globalCluesFound + '/' + TOTAL_CLUES;

    if (globalTimerInterval) clearInterval(globalTimerInterval);
    globalTimerInterval = setInterval(() => {
        if (gameState === 'start' || gameState === 'gameover' || gameState === 'victory') return;
        timeLeft--;
        timerDisplay.textContent = formatTime(timeLeft);

        if (timeLeft > 0 && timeLeft % 60 === 0 && timeLeft !== maxLevelTime) {
            playMinuteTick();
        }

        if (timeLeft <= 0) {
            clearInterval(globalTimerInterval);
            triggerGameOverOrExecution('¡Se acabó el tiempo!');
        }
    }, 1000);

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys.w || keys.ArrowUp) { dy = -1; player.lastDirection = 'up'; }
    if (keys.s || keys.ArrowDown) { dy = 1; player.lastDirection = 'down'; }
    if (keys.a || keys.ArrowLeft) { dx = -1; player.lastDirection = 'left'; }
    if (keys.d || keys.ArrowRight) { dx = 1; player.lastDirection = 'right'; }

    let isMoving = dx !== 0 || dy !== 0;
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

    moveWithCollisions(player, dx * player.speed, dy * player.speed);

    // ---- Sprite / Animation logic ----
    // Decide which config key to use (idle or move variant for the current direction)
    let spriteDir = player.lastDirection.charAt(0).toUpperCase() + player.lastDirection.slice(1);
    let spriteKey = isMoving ? ('playerMove' + spriteDir) : ('playerIdle' + spriteDir);

    const spriteVal = SPRITE_CONFIG[spriteKey];

    if (!spriteVal) {
        // Fallback: show idle down if specific direction / state has no sprite configured
        applySprite(playerEl, 'playerIdleDown');
    } else if (Array.isArray(spriteVal)) {
        // Multi-frame animation: cycle at WALK_ANIM_FPS frames per second
        const WALK_ANIM_FPS = 8;        // Frames per second for the walk animation
        const FRAME_DURATION = 1000 / WALK_ANIM_FPS; // ms per frame
        const frameCount = spriteVal.length;
        const frame = Math.floor(Date.now() / FRAME_DURATION) % frameCount;
        applyDirectSprite(playerEl, spriteVal[frame]);
    } else {
        // Single static image
        applyDirectSprite(playerEl, spriteVal);
    }

    // ---- Efecto visual de invulnerabilidad post-POI ----
    // Cuando el jugador es invulnerable tras salir de un POI, parpadea rápidamente
    // alternando la opacidad para indicar visualmente que es temporalmente inmune
    if (player.invincibleTimer > 0) {
        // Parpadeo rápido: alterna entre visible e invisible cada 6 frames
        playerEl.style.opacity = (Math.floor(player.invincibleTimer / 6) % 2 === 0) ? '0.3' : '1';
    } else {
        playerEl.style.opacity = '1';
    }

    // La física se calcula con la Y fijada abajo (height * 0.25). Renderizamos subiendo el sprite.
    playerEl.style.transform = `translate(${player.x - player.width / 2}px, ${player.y - (player.height * 0.75)}px)`;
}


function updateEnemies() {
    // ---- Decrementar el temporizador de invulnerabilidad del jugador ----
    if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
    }

    let anyChasing = false;
    let anyInSameQuadrant = false;

    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        let enemyEl = document.getElementById(enemy.id);
        if (!enemyEl) continue;

        const pdx = player.x - enemy.x, pdy = player.y - enemy.y;
        const pDist = Math.hypot(pdx, pdy);

        let hasLoS = false;
        if (player.invincibleTimer <= 0 && pDist <= enemy.visionRange) {
            if (Math.abs(normalizeAngle(Math.atan2(pdy, pdx) - enemy.angle)) <= enemy.visionAngle) {
                if (!lineHitsWall(enemy.x, enemy.y, player.x, player.y)) hasLoS = true;
            }
        }

        const currentPoints = enemy.routes[enemy.activeRoute] || [{ x: enemy.x, y: enemy.y }];

        if (enemy.state === 'idle') {
            // Executioner waiting...
            // Do nothing
        } else if (enemy.state === 'patrol') {
            if (hasLoS) {
                enemy.state = 'chase';
                enemy.loseAggroTimer = 3.0;
                enemyEl.classList.add('alert');
                playAlertSound(); playAudio('chaseMusic');
            } else {
                const t = currentPoints[enemy.patrolIndex];
                const dx = t.x - enemy.x;
                const dy = t.y - enemy.y;
                const dist = Math.hypot(dx, dy);
                const tAngle = Math.atan2(dy, dx);

                enemy.angle += normalizeAngle(tAngle - enemy.angle) * 0.1;

                if (dist > 5) {
                    let moved = moveWithCollisions(enemy, Math.cos(tAngle) * enemy.patrolSpeed, Math.sin(tAngle) * enemy.patrolSpeed);
                    if (!moved) {
                        enemy.wallStuckTimer++;
                        if (enemy.wallStuckTimer >= 90) {
                            currentPoints.reverse();
                            enemy.patrolIndex = 1;
                            enemy.wallStuckTimer = 0;
                        } else if (enemy.wallStuckTimer >= 15) {
                            enemy.patrolIndex = (enemy.patrolIndex + 1) % currentPoints.length;
                        }
                    } else {
                        enemy.wallStuckTimer = 0;
                    }
                } else {
                    enemy.patrolIndex = (enemy.patrolIndex + 1) % currentPoints.length;
                    enemy.wallStuckTimer = 0;
                }
            }
        } else if (enemy.state === 'chase') {
            if (enemy.evadeTimer === undefined) enemy.evadeTimer = 0;

            if (hasLoS) {
                enemy.loseAggroTimer = 3.0;
            } else {
                enemy.loseAggroTimer -= (1 / 60);
                if (enemy.loseAggroTimer <= 0) {
                    enemy.state = 'patrol';
                    enemyEl.classList.remove('alert');
                    enemy.evadeTimer = 0;
                    if (enemy.routes.length > 1) {
                        enemy.activeRoute = enemy.activeRoute === 0 ? 1 : 0;
                    }

                    const newPoints = enemy.routes[enemy.activeRoute];
                    if (newPoints) {
                        let closestId = 0, minDist = Infinity;

                        let minId = 0, minD = Infinity;
                        for (let j = 0; j < newPoints.length; j++) {
                            const d = Math.hypot(enemy.x - newPoints[j].x, enemy.y - newPoints[j].y);
                            const hasVisionToPoint = !lineHitsWall(enemy.x, enemy.y, newPoints[j].x, newPoints[j].y);
                            if (d < minDist && hasVisionToPoint) { minDist = d; closestId = j; }
                            if (d < minD) { minD = d; minId = j; }
                        }

                        if (minDist !== Infinity) {
                            enemy.patrolIndex = closestId;
                        } else {
                            enemy.patrolIndex = minId;
                        }
                    }
                }
            }

            if (enemy.state === 'chase') {
                const reqAngle = Math.atan2(pdy, pdx);

                if (enemy.evadeTimer > 0) {
                    enemy.evadeTimer--;
                    enemy.angle += normalizeAngle(enemy.evadeAngle - enemy.angle) * 0.2;
                    let moved = moveWithCollisions(enemy, Math.cos(enemy.angle) * enemy.chaseSpeed, Math.sin(enemy.angle) * enemy.chaseSpeed);
                    if (!moved) enemy.evadeAngle += Math.PI;
                } else {
                    enemy.angle += normalizeAngle(reqAngle - enemy.angle) * (hasLoS ? 0.2 : 0.05);
                    let moved = moveWithCollisions(enemy, Math.cos(enemy.angle) * enemy.chaseSpeed, Math.sin(enemy.angle) * enemy.chaseSpeed);
                    if (!moved) {
                        enemy.evadeTimer = 30;
                        enemy.evadeAngle = enemy.angle + (Math.random() > 0.5 ? 1.57 : -1.57);
                    }
                }
            }
        }

        if (enemy.state === 'chase') anyChasing = true;
        if (gameState === 'stealth' && getQuadrant(player.x, player.y) === getQuadrant(enemy.x, enemy.y)) {
            anyInSameQuadrant = true;
        }

        if (enemy.lastDirection === undefined) enemy.lastDirection = 'Right';
        let angleDeg = enemy.angle * 180 / Math.PI;
        let normAngle = ((angleDeg % 360) + 360) % 360;

        if (normAngle >= 315 || normAngle < 45) enemy.lastDirection = 'Right';
        else if (normAngle >= 45 && normAngle < 135) enemy.lastDirection = 'Down';
        else if (normAngle >= 135 && normAngle < 225) enemy.lastDirection = 'Left';
        else enemy.lastDirection = 'Up';

        const stateKey = (enemy.state === 'chase') ? 'enemyChase' : 'enemyPatrol';
        const spriteKey = stateKey + enemy.lastDirection;
        let spriteVal = SPRITE_CONFIG[spriteKey] || SPRITE_CONFIG.enemyPatrolRight;

        if (spriteVal) {
            if (Array.isArray(spriteVal)) {
                let frame = 0;
                if (enemy.state !== 'idle') {
                    const ANIM_FPS = (enemy.state === 'chase') ? 8 : 4;
                    const FRAME_MS = 1000 / ANIM_FPS;
                    frame = Math.floor(Date.now() / FRAME_MS) % spriteVal.length;
                }
                applyDirectSprite(enemyEl, spriteVal[frame]);
            } else {
                applyDirectSprite(enemyEl, spriteVal);
            }
        }

        enemyEl.style.transform = `translate(${enemy.x - enemy.width / 2}px, ${enemy.y - (enemy.height * 0.75)}px)`;
        const visionCone = enemyEl.querySelector('.vision-cone');
        if (visionCone) {
            visionCone.style.transform = `translateY(-50%) rotate(${enemy.angle}rad)`;
            visionCone.style.display = enemy.state === 'idle' ? 'none' : 'block';
        }

        if (player.invincibleTimer <= 0 && pDist < player.radius + enemy.radius) {
            triggerGameOverOrExecution(pendingGameOverReason ? pendingGameOverReason : '¡El guardia te atrapó!');
        }
    }

    if (gameState === 'stealth') {
        if (anyChasing) {
            // Solo ajustar el volumen UNA VEZ al entrar en persecución,
            // no cada frame (eso creaba miles de setIntervals y rompía el audio)
            if (!_globalBgmChase) {
                _globalBgmChase = true;
                _globalBgmTension = false;
                setLevelBGMVolume(BGM_VOLUME_CHASE, 500);
            }
        } else {
            // Al salir de persecución, resetear la bandera de chase
            _globalBgmChase = false;

            if (anyInSameQuadrant) {
                if (!_globalBgmTension) {
                    _globalBgmTension = true;
                    setLevelBGMVolume(BGM_VOLUME_NORMAL_HIGH, 1000);
                }
            } else {
                if (_globalBgmTension) {
                    _globalBgmTension = false;
                    setLevelBGMVolume(BGM_VOLUME_NORMAL, 1500);
                }
            }
        }
    }
}

function checkPOIs() {
    const centerY = player.height ? player.y - (player.height * 0.4) : player.y;

    // Verificar colisión con el punto de salida (Terminal)
    if (currentExitData && !enemies.some(e => e.state === 'chase')) {
        if (circleRect(player.x, centerY, player.radius, currentExitData.x - 16, currentExitData.y - 24, 64, 64)) {
            // Verificar si tenemos todas las pistas del nivel
            let clearedCount = poiEls.filter(el => el.dataset.cleared === '1').length;
            let requiredClues = LEVELS[currentLevel].pois.length;
            if (clearedCount >= requiredClues) {
                showKeypadScreen();
                return;
            } else {
                // Pequeño tip visual (opcional) o rechazar silenciosamente si no tiene todo.
            }
        }
    }

    for (let i = 0; i < poiEls.length; i++) {
        if (poiEls[i].dataset.cleared === '1') continue;
        const p = poiData[i];

        const ox = p.hitOffsetX !== undefined ? p.hitOffsetX : 10;
        const oy = p.hitOffsetY !== undefined ? p.hitOffsetY : 10;
        const hw = p.hitW !== undefined ? p.hitW : 48;
        const hh = p.hitH !== undefined ? p.hitH : 48;

        if (circleRect(player.x, centerY, player.radius, p.x - ox, p.y - oy, hw, hh)) {
            if (!enemies.some(e => e.state === 'chase')) {
                // If it is Level 5 computer, start Hack minigame
                if (currentLevel === 4) {
                    activePOI = poiEls[i];
                    startHackMinigame();
                } else {
                    startPOIIntro(poiEls[i], p);
                }
            }
            return;
        }
    }
}

function gameLoop() {
    if (gameState !== 'stealth') return;
    updatePlayer(); updateEnemies(); checkPOIs();
    animFrameId = requestAnimationFrame(gameLoop);
}

// ========================================================
// PHASE 2 & ADVANCED LOGIC
// ========================================================
let activePOI = null;
let activePOIData = null;

function startPOIIntro(poiElement, poiConfig) {
    gameState = 'intro';
    activePOI = poiElement;
    activePOIData = poiConfig;

    document.getElementById('global-hud').style.display = 'none';
    document.getElementById('poi-riddle').textContent = `"${poiConfig.introText}"`;
    showScreen('poi-intro-screen');

    if (audioElements.chaseMusic) audioElements.chaseMusic.volume = 0.2;
    if (audioElements.bgmMusic) audioElements.bgmMusic.volume = 0.2;
    // Bajar volumen del BGM del nivel al entrar en la intro del POI
    setLevelBGMVolume(BGM_VOLUME_POI, 300);
}

document.getElementById('start-poi-btn').addEventListener('click', () => {
    startPointAndClick();
});

function startPointAndClick() {
    gameState = 'point';

    // Restaurar UI Bar (HUD) ocultada durante la intro
    document.getElementById('global-hud').style.display = 'flex';
    if (currentLevel === 4) {
        document.getElementById('global-hud').classList.add('hud-transparent');
    }

    showScreen('point-screen');

    // Set Custom Background for P&C phase
    const sceneImg = document.getElementById('scene-image');
    if (activePOIData && activePOIData.sceneBg) {
        sceneImg.style.backgroundImage = `url('${activePOIData.sceneBg}')`;
        sceneImg.style.backgroundSize = 'cover';
    } else {
        sceneImg.style.background = '#1a1a24';
    }

    // Clear old items
    sceneImg.innerHTML = '';

    localCluesFound = 0;
    // Los errores se reinician a 0 al comienzo de CADA fase Point & Click.
    // Esto significa que el jugador tiene 3 intentos por POI, no en total.
    mistakes = 0;
    mistakesDisplay.textContent = mistakes + '/' + MAX_MISTAKES;

    // Difficulty scaling: Number of total containers increases with level
    const totalContainers = 5 + (currentLevel * 2);
    const correctType = activePOIData.containerType || "type-paper";
    const availableTypes = ["type-box", "type-paper", "type-trash", "type-electronic"];

    // -------------------------------------------------------
    // PISTA VISUAL PERSISTENTE: el acertijo del introText se
    // muestra en un banner fijo dentro de la pantalla P&C.
    // Así el jugador puede leerlo mientras busca el objeto,
    // sin tener que recordarlo de la pantalla anterior.
    // -------------------------------------------------------
    const clueHintEl = document.createElement('div');
    clueHintEl.id = 'clue-hint-banner';
    // Mostrar el acertijo completo del POI como referencia persistente
    clueHintEl.textContent = '🔍 PISTA: ' + (activePOIData.introText || '');
    clueHintEl.style.cssText = [
        'position: absolute',
        'top: 8px',
        'left: 50%',
        'transform: translateX(-50%)',
        'background: rgba(0,0,0,0.85)',
        'color: #ffd700',
        'font-family: inherit',
        'font-size: 0.82rem',
        'font-weight: bold',
        'padding: 7px 18px',
        'border-radius: 8px',
        'border: 2px solid #ffd700',
        'letter-spacing: 0.5px',
        'z-index: 999',
        'pointer-events: none',
        'max-width: 90%',
        'text-align: center',
        'line-height: 1.4'
    ].join(';');
    sceneImg.appendChild(clueHintEl);

    // Gen posiciones variables
    const placedPositions = [];
    function getValidPosition() {
        let top, left, valid = false, attempts = 0;
        while (!valid && attempts < 100) {
            top = 10 + Math.random() * 80;
            left = 10 + Math.random() * 80;
            valid = true;
            for (let pos of placedPositions) {
                let dx = pos.left - left, dy = pos.top - top;
                if (Math.sqrt(dx * dx + dy * dy) < 15) { valid = false; break; }
            }
            attempts++;
        }
        placedPositions.push({ top, left });
        return { top, left };
    }

    // Un único clue real por POI (posición aleatoria entre todos los contenedores)
    const trueIndex = Math.floor(Math.random() * totalContainers);

    // -------------------------------------------------------
    // REGLA DE TIPOS DE DISTRACTORES:
    // La pista del introText le dice al jugador QUÉ tipo de objeto buscar.
    // Para que esa información sea útil, limitamos cuántos distractores
    // pueden ser del mismo tipo que el objeto correcto (máximo 2).
    // El resto de distractores son de tipos DISTINTOS al correcto,
    // así el jugador puede descartar la mayoría solo leyendo la pista.
    // -------------------------------------------------------
    const MAX_SAME_TYPE_DISTRACTORS = 2;

    // Tipos disponibles SOLO para los distractores (excluye el tipo correcto)
    const distractorOnlyTypes = availableTypes.filter(t => t !== correctType);

    // Pre-generar la lista de tipos de cada contenedor
    const containerTypes = [];
    let sameTypeCount = 0; // Cuántos distractores del mismo tipo ya pusimos

    for (let i = 0; i < totalContainers; i++) {
        if (i === trueIndex) {
            // El objeto correcto siempre tiene el tipo que indica la pista
            containerTypes.push(correctType);
        } else {
            // Solo se permiten hasta MAX_SAME_TYPE_DISTRACTORS del mismo tipo que el correcto
            if (sameTypeCount < MAX_SAME_TYPE_DISTRACTORS && Math.random() < 0.4) {
                containerTypes.push(correctType);
                sameTypeCount++;
            } else {
                // Tipo completamente diferente al del objeto correcto
                const randIdx = Math.floor(Math.random() * distractorOnlyTypes.length);
                containerTypes.push(distractorOnlyTypes[randIdx]);
            }
        }
    }

    for (let i = 0; i < totalContainers; i++) {
        const isTrue = (i === trueIndex);
        const pos = getValidPosition();
        const currentType = containerTypes[i];

        const el = document.createElement('div');
        el.className = `clue-item-container ${currentType}`;
        el.style.top = pos.top + '%';
        el.style.left = pos.left + '%';
        el.dataset.isTrue = isTrue ? '1' : '0';

        el.addEventListener('click', function () {
            if (gameState !== 'point' || this.dataset.clicked === '1') return;
            this.dataset.clicked = '1';
            this.style.pointerEvents = 'none';

            // Animación de pop con el número de pista o "VACÍO"
            const popAlert = document.createElement('div');
            popAlert.className = 'clue-text-pop';
            popAlert.style.left = pos.left + '%';
            popAlert.style.top = pos.top + '%';
            popAlert.style.zIndex = '9999'; // <-- SUPERPONER AL TEXTO
            sceneImg.appendChild(popAlert);

            if (this.dataset.isTrue === '1') {
                this.style.filter = "brightness(2) sepia(1)";
                popAlert.textContent = activePOIData.clueText;
                popAlert.style.color = "#00ff88";
                playAudio('findClue');

                // -------------------------------------------------------
                // RECOMPENSA DE TIEMPO: +10 segundos por completar correcto.
                // Se muestra un mensaje flotante en la pantalla antes de
                // avanzar a la siguiente fase, para que el jugador lo note.
                // -------------------------------------------------------
                const bonusMsg = document.createElement('div');
                bonusMsg.className = 'clue-text-pop';
                bonusMsg.textContent = '+10s ⏱';
                bonusMsg.style.left = '50%';
                bonusMsg.style.top = '10%';
                bonusMsg.style.transform = 'translateX(-50%)';
                bonusMsg.style.color = '#00ccff';
                bonusMsg.style.fontSize = '1.6rem';
                bonusMsg.style.fontWeight = 'bold';
                bonusMsg.style.zIndex = '9999'; // <-- SUPERPONER AL TEXTO
                sceneImg.appendChild(bonusMsg);

                // Sumar 10 segundos al tiempo restante y actualizar el HUD
                timeLeft += 10;
                timerDisplay.textContent = formatTime(timeLeft);

                setTimeout(() => {
                    if (currentLevel === 4) {
                        showHackTerminalScreen();
                    } else {
                        localCluesFound++;
                        globalCluesFound++;
                        cluesDisplay.textContent = globalCluesFound + '/' + TOTAL_CLUES;
                        activePOI.dataset.cleared = '1'; activePOI.style.display = 'none'; showPaperScreen();
                    }
                }, 1500); // 1.5 seconds so player can read the code before typing it
            } else {
                this.style.opacity = '0.5';
                if (currentType === 'type-box') this.style.backgroundImage = 'none'; // open empty
                popAlert.textContent = "VACÍO";
                popAlert.style.color = "#ff3366";

                mistakes++; timeLeft -= TIME_PENALTY; if (timeLeft < 0) timeLeft = 0;
                playErrorSound();
                mistakesDisplay.textContent = mistakes + '/' + MAX_MISTAKES;
                timerDisplay.textContent = formatTime(timeLeft);

                if (mistakes >= MAX_MISTAKES) {
                    setTimeout(() => triggerGameOverOrExecution('¡Te equivocaste demasiadas veces!'), 400);
                } else if (timeLeft <= 0) {
                    setTimeout(() => triggerGameOverOrExecution('¡Se acabó el tiempo!'), 400);
                }
            }
        });
        sceneImg.appendChild(el);
    }
}

// ========================================================
// HACK MINIGAME (LEVEL 5)
// ========================================================
let hackPhase = 0;
let hackInput = "";
const HACK_PHASES = [
    {
        glitch: "INICIANDO PUERTA TRASERA...",
        prompt: "CÓDIGO REQUERIDO: Ingrese la clave hallada en el primer reporte de exploración.",
        riddle: "Tengo pantalla pero no tengo ojos. Guardo memoria aunque finjan que estoy apagado.",
        answer: "1984",
        containerType: "type-electronic"
    },
    {
        glitch: "BYPASS DE SEGURIDAD FASE 1 COMPLETADO",
        prompt: "SEGUNDA CAPA: El cortafuegos exige el número de unidades identificado en el Almacén Subterráneo (Nivel 3).",
        riddle: "Me puedes doblar pero no caminar. Guardo secretos sin poder hablar.",
        answer: "7344",
        containerType: "type-paper"
    },
    {
        glitch: "ADVERTENCIA: ACCESO CRÍTICO DETECTADO",
        prompt: "NÚCLEO FINAL: Ingrese la clave maestra de sobrecarga.",
        riddle: "Tengo tapa y fondo pero no soy una habitación. Guardo lo que no quieren que veas.",
        answer: "9999",
        containerType: "type-box"
    }
];

function startHackMinigame() {
    hackPhase = 0;
    mistakes = 0;
    document.getElementById('hack-mistakes').textContent = mistakes + '/' + MAX_MISTAKES;

    // Música y atmósfera
    if (audioElements.chaseMusic) audioElements.chaseMusic.volume = 0.2;
    if (audioElements.bgmMusic) audioElements.bgmMusic.volume = 0.2;
    setLevelBGMVolume(BGM_VOLUME_POI, 300);

    activePOI.dataset.cleared = '0';
    startHackPhasePointAndClick();
}

function startHackPhasePointAndClick() {
    activePOIData = {
        clueText: HACK_PHASES[hackPhase].answer,
        containerType: HACK_PHASES[hackPhase].containerType,
        sceneBg: 'sprites/hacker_8bit_bg.png',
        // Usar el acertijo (riddle) visual para la fase Point&Click
        introText: HACK_PHASES[hackPhase].riddle 
    };
    startPOIIntro(activePOI, activePOIData);
}

function showHackTerminalScreen() {
    gameState = 'hack';
    document.getElementById('global-hud').style.display = 'flex';
    if (currentLevel === 4) {
        document.getElementById('global-hud').classList.add('hud-transparent');
    }
    showScreen('hack-screen');
    loadHackPhase();
}

function loadHackPhase() {
    hackInput = "";
    document.getElementById('hack-display').textContent = "_";
    document.getElementById('hack-glitch-text').textContent = HACK_PHASES[hackPhase].glitch;
    document.getElementById('hack-prompt').textContent = HACK_PHASES[hackPhase].prompt;
    document.getElementById('hack-status-msg').textContent = "LISTO";
    document.getElementById('hack-status-msg').style.color = "#00ff88";
    document.getElementById('hack-mistakes').textContent = mistakes + '/' + MAX_MISTAKES;

    // Configurar layout de teclas
    const btns = document.querySelectorAll('.hack-key');
    btns.forEach(b => {
        const newB = b.cloneNode(true);
        b.parentNode.replaceChild(newB, b);
        newB.addEventListener('click', () => handleHackKey(newB.textContent));
    });
}

function handleHackKey(val) {
    const display = document.getElementById('hack-display');
    const status = document.getElementById('hack-status-msg');

    if (val === 'C') {
        hackInput = "";
        display.textContent = "_";
    } else if (val === 'E') {
        if (hackInput === HACK_PHASES[hackPhase].answer) {
            status.textContent = "ACCESO " + (hackPhase + 1) + " CONCEDIDO";
            status.style.color = "#00ff88";
            playAudio('findClue');

            localCluesFound++;
            globalCluesFound++;
            cluesDisplay.textContent = globalCluesFound + '/' + TOTAL_CLUES;

            setTimeout(() => {
                hackPhase++;
                if (hackPhase >= HACK_PHASES.length) {
                    activePOI.dataset.cleared = '1';
                    // Level 5 beat!
                    victory();
                } else {
                    document.getElementById('hack-display').textContent = "_";
                    startHackPhasePointAndClick();
                }
            }, 1000);
        } else {
            status.textContent = "ACCESO DENEGADO";
            status.style.color = "#ff3366";
            playErrorSound();
            hackInput = "";
            display.textContent = "_";

            mistakes++;
            timeLeft -= TIME_PENALTY;
            if (timeLeft < 0) timeLeft = 0;
            document.getElementById('hack-mistakes').textContent = mistakes + '/' + MAX_MISTAKES;
            timerDisplay.textContent = formatTime(timeLeft);

            if (mistakes >= MAX_MISTAKES) {
                setTimeout(() => triggerGameOverOrExecution('¡Cachado por el firewall!'), 400);
            } else if (timeLeft <= 0) {
                setTimeout(() => triggerGameOverOrExecution('¡Se acabó el tiempo!'), 400);
            }
        }
    } else {
        if (hackInput.length < 4) {
            hackInput += val;
            playSynth('tick');
            display.textContent = hackInput;
        }
    }
}

// Hint Button Logic
document.getElementById('hint-btn').addEventListener('click', () => {
    if (gameState !== 'point' || timeLeft <= 15) return;
    timeLeft -= 15;
    timerDisplay.textContent = formatTime(timeLeft);
    playSynth('alert');

    // Find the true clue
    const items = document.querySelectorAll('.clue-item-container');
    items.forEach(item => {
        if (item.dataset.isTrue === '1' && item.dataset.clicked !== '1') {
            item.classList.add('hint-highlight');
            setTimeout(() => item.classList.remove('hint-highlight'), 1500);
        }
    });
});

function returnToStealth() {
    if (audioElements.chaseMusic) audioElements.chaseMusic.volume = 1;
    if (audioElements.bgmMusic) audioElements.bgmMusic.volume = 1;

    gameState = 'stealth'; showScreen('stealth-screen');
    document.getElementById('global-hud').style.display = 'flex';
    document.getElementById('global-hud').classList.remove('hud-transparent');
    enemies.forEach(en => {
        en.state = 'patrol';
        const el = document.getElementById(en.id);
        if (el) el.classList.remove('alert');
    });
    // Restaurar volumen normal y reanudar BGM del nivel al volver al stealth
    setLevelBGMVolume(BGM_VOLUME_NORMAL, 300);
    resumeLevelBGM();

    // ---- Invulnerabilidad post-POI ----
    // Al regresar al modo stealth, el jugador recibe 3 segundos (~180 frames a 60fps)
    // de invulnerabilidad para que tenga tiempo de reaccionar y alejarse del enemigo.
    player.invincibleTimer = 180;

    // ---- Spawn inteligente del enemigo (basado en cuadrantes) ----
    enemies.forEach(enemy => {
        enemy.activeRoute = 0;
        enemy.wallStuckTimer = 0;
        const routePoints = enemy.routes[enemy.activeRoute];

        const playerQuadrant = getQuadrant(player.x, player.y);
        const targetQuadrant = getOppositeQuadrant(playerQuadrant);
        const candidatePoints = getPointsInQuadrant(routePoints, targetQuadrant);

        let bestIndex = 0;
        if (candidatePoints.length > 0) {
            let bestDist = 0;
            for (const candidate of candidatePoints) {
                const dist = Math.hypot(candidate.point.x - player.x, candidate.point.y - player.y);
                if (dist > bestDist) {
                    bestDist = dist;
                    bestIndex = candidate.index;
                }
            }
        } else {
            let bestDist = 0;
            for (let i = 0; i < routePoints.length; i++) {
                const dist = Math.hypot(routePoints[i].x - player.x, routePoints[i].y - player.y);
                if (dist > bestDist) {
                    bestDist = dist;
                    bestIndex = i;
                }
            }
        }

        enemy.x = routePoints[bestIndex].x;
        enemy.y = routePoints[bestIndex].y;
        enemy.patrolIndex = (bestIndex + 1) % routePoints.length;
    });

    animFrameId = requestAnimationFrame(gameLoop);
}

let pendingGameOverReason = "";

function triggerGameOverOrExecution(reason) {
    if (currentLevel === 4) { // Level 5
        // Activar a los verdugos en lugar del game over inmediato
        if (gameState === 'point') returnToStealth(); // Sacar de Point & Click si está ahí
        pendingGameOverReason = reason;

        let executionersActivated = false;
        enemies.forEach(en => {
            if (en.isExecutioner && en.state !== 'chase') {
                en.state = 'chase';
                en.visionRange = 2000; // Para que siempre te vea y persiga
                en.loseAggroTimer = 9999; // Para que nunca dejen de perseguir
                executionersActivated = true;
                const el = document.getElementById(en.id);
                if (el) el.classList.add('alert');
            }
        });

        if (executionersActivated) {
            player.invincibleTimer = 0; // Quitar invulnerabilidad para que te atrapen
            playAlertSound();
            playAudio('chaseMusic');
        } else {
            gameOver(reason); // Fallback si ya te atraparon
        }
    } else {
        gameOver(reason);
    }
}

function gameOver(reason) {
    // Ensure AudioContext is resumed to comply with autoplay policies
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gameState = 'gameover';
    document.getElementById('global-hud').style.display = 'none'; // Ocultar HUD
    stopLevelBGM(); // Detener completamente el BGM del nivel al perder
    playAudio('gameOver');
    gameOverReason.textContent = reason || pendingGameOverReason || "Game Over";
    pendingGameOverReason = "";
    showScreen('game-over-screen');
}

function victory() {
    gameState = 'victory';
    document.getElementById('global-hud').style.display = 'none'; // Ocultar HUD
    stopLevelBGM(); // Detener completamente el BGM del nivel al ganar
    playAudio('victory');

    // Set custom victory story text
    const victoryStoryHTML = `
        <h3 style="color:#00ff88; border-bottom:1px solid #00ff88; margin-bottom:15px; padding-bottom:10px;">[TRANSMISION INTERCEPTADA - FECHA DESCONOCIDA]</h3>
        <p style="color:#aaa; font-size:1.1rem; line-height:1.6; text-align:left;">El código fue aceptado. Los servidores principales comenzaron a colapsar bajo el peso del apagón crítico. Las luces rojas de la instalación parpadearon por última vez antes de sucumbir a la oscuridad total.</p>
        <p style="color:#aaa; font-size:1.1rem; line-height:1.6; text-align:left;">Mientras corría hacia el conducto de extracción, pude escuchar cómo los pesados pasos metálicos de las unidades de contención se ralentizaban, crujiendo hasta quedar inertes en los pasillos vacíos. El Proyecto O.M.N.I. ha sido purgado de la red.</p>
        <p style="color:#aaa; font-size:1.1rem; line-height:1.6; text-align:left;">He cerrado las puertas blindadas a mis espaldas y he detonado el túnel principal. Ya no hay camino de regreso para mí, pero tampoco hay salida para *ellos*. El silencio que envuelve ahora a este lugar es mi única recompensa.</p>
        <p style="color:#ff3366; font-size:1.1rem; line-height:1.6; text-align:center; font-weight:bold; margin-top:20px;">Si alguien encuentra esta grabación... el sótano está sellado. No intenten abrirlo.</p>
        <div style="text-align:center; margin-top:20px; color:#00ff88;">[FIN DE LA TRANSMISIÓN]</div>
    `;

    const victoryScreen = document.getElementById('victory-screen');
    // Clear out standard text and append the story
    victoryScreen.innerHTML = `
        <div class="paper-container" style="background:#0a0e14; border:1px solid #33ccff; width:800px; height:auto; padding:30px; margin-bottom:20px; box-shadow:0 0 30px rgba(0,255,136,0.2);">
            <div style="width:100%;">${victoryStoryHTML}</div>
        </div>
        <button id="victory-restart-btn">Salir de las Sombras (Reinicio)</button>
    `;

    // Bind click event again to the newly generated button
    document.getElementById('victory-restart-btn').addEventListener('click', startGame);

    showScreen('victory-screen');
}

function showKeypadScreen() {
    gameState = 'keypad';
    document.getElementById('global-hud').style.display = 'none';
    showScreen('keypad-screen');

    const display = document.getElementById('keypad-display');
    const status = document.getElementById('keypad-status');
    display.textContent = "_ _ _ _";
    status.textContent = "";

    let currentInput = "";

    const handleKeypadPress = (val) => {
        if (val === 'C') {
            currentInput = "";
        } else if (val === 'E') {
            if (currentInput === LEVELS[currentLevel].passcode) {
                status.textContent = "ACCESO CONCEDIDO";
                status.style.color = "#00ff88";
                playAudio('findClue');
                setTimeout(() => {
                    currentLevel++;
                    if (currentLevel >= LEVELS.length) {
                        // victory
                    } else {
                        showLoreScreen();
                    }
                }, 1000);
            } else {
                status.textContent = "ACCESO DENEGADO";
                status.style.color = "#ff3366";
                playErrorSound();
                currentInput = "";
            }
        } else {
            if (currentInput.length < 4) {
                currentInput += val;
                playSynth('tick');
            }
        }

        let visualStr = currentInput;
        while (visualStr.length < 4) visualStr += "_";
        display.textContent = visualStr.split("").join(" ");
    };

    // Remove old listeners to avoid multiple fires
    const btns = document.querySelectorAll('.keypad-btn');
    btns.forEach(b => {
        const newB = b.cloneNode(true);
        b.parentNode.replaceChild(newB, b);
        newB.addEventListener('click', () => handleKeypadPress(newB.textContent));
    });
}

document.getElementById('close-keypad-btn').addEventListener('click', returnToStealth);

// Lógica de Documentos de Lore (Entre niveles)
function showLoreScreen() {
    gameState = 'lore';
    document.getElementById('global-hud').style.display = 'none';
    stopAllSFX();
    stopLevelBGM(); // Detener BGM del nivel completado durante la pantalla de lore

    const loreContent = document.getElementById('lore-content');
    const pastLevel = currentLevel - 1;
    if (pastLevel >= 0 && LEVELS[pastLevel].lore) {
        loreContent.innerHTML = LEVELS[pastLevel].lore;
    }

    showScreen('lore-screen');
}

// Lógica de Papel (Inter-POI)
function showPaperScreen() {
    gameState = 'paper';
    document.getElementById('global-hud').style.display = 'none';
    showScreen('paper-reveal-screen');

    let clearedCount = 0;
    for (let el of poiEls) {
        if (el.dataset.cleared === '1') clearedCount++;
    }

    document.getElementById('paper-clue-1').classList.remove('visible');
    document.getElementById('paper-clue-2').classList.remove('visible');
    document.getElementById('paper-clue-3').classList.remove('visible');

    // Ocultar fragmentos por defecto para niveles con menos de 3 pistas (como el nivel 5 con 1 pista)
    document.getElementById('paper-clue-1').style.display = 'none';
    document.getElementById('paper-clue-2').style.display = 'none';
    document.getElementById('paper-clue-3').style.display = 'none';

    // Insert actual clue texts into the paper fragments CSS attributes using dataset or innerText
    const dataPOIs = LEVELS[currentLevel].pois;

    // Inject the passcode fragments into the blueprint with Tech styling
    if (dataPOIs[0]) {
        document.getElementById('paper-clue-1').style.display = 'block';
        document.getElementById('paper-clue-1').innerHTML = `<div style="font-family:monospace; font-size:2rem; color:#00f3ff; font-weight:bold; letter-spacing:2px; text-shadow:0 0 10px #00f3ff;">[SEC_A: ${dataPOIs[0].clueText}]</div>`;
    }
    if (dataPOIs[1]) {
        document.getElementById('paper-clue-2').style.display = 'block';
        document.getElementById('paper-clue-2').innerHTML = `<div style="font-family:monospace; font-size:2rem; color:#00f3ff; font-weight:bold; letter-spacing:2px; text-shadow:0 0 10px #00f3ff;">[SEC_B: ${dataPOIs[1].clueText}]</div>`;
    }
    if (dataPOIs[2]) {
        document.getElementById('paper-clue-3').style.display = 'block';
        document.getElementById('paper-clue-3').innerHTML = `<div style="font-family:monospace; font-size:2rem; color:#00f3ff; font-weight:bold; letter-spacing:2px; text-shadow:0 0 10px #00f3ff;">[SEC_C: ${dataPOIs[2].clueText}]</div>`;
    }

    // Remove old CSS pseudoelement artifacts for the dynamic system
    document.getElementById('paper-clue-1').style.setProperty('--after-content', 'none');

    // Retraso ligero para que la transición de CSS se aplique después de hacer display:flex
    setTimeout(() => {
        if (clearedCount >= 1 && dataPOIs[0]) document.getElementById('paper-clue-1').classList.add('visible');
        if (clearedCount >= 2 && dataPOIs[1]) document.getElementById('paper-clue-2').classList.add('visible');
        if (clearedCount >= 3 && dataPOIs[2]) document.getElementById('paper-clue-3').classList.add('visible');
    }, 50);
}

document.getElementById('close-paper-btn').addEventListener('click', returnToStealth);

document.getElementById('continue-lore-btn').addEventListener('click', () => {
    // Al cerrar el lore, iniciamos el siguiente nivel conservando el tiempo y pistas globales
    startGame(false);
});

// Lógica de escalado responsivo
function resizeGame() {
    const container = document.getElementById('game-container');
    const targetWidth = 960;
    const targetHeight = 560; // 480 play area + 80 HUD
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    // Tomar la escala más restrictiva para no recortar, dejando un margen del 2%
    const scale = Math.min(scaleX, scaleY) * 0.98;
    container.style.transform = `scale(${scale})`;
}

// Lógica del Botón de Pistas (Hint)
const hintBtn = document.getElementById('hint-btn');
if (hintBtn) {
    hintBtn.addEventListener('click', () => {
        if (gameState !== 'point') return;

        // Find the single true clue container
        const trueClues = Array.from(document.querySelectorAll('.clue-item-container[data-is-true="1"]'));
        const unrevealed = trueClues.find(el => el.dataset.clicked !== '1');

        if (unrevealed) {
            // Deduct time penalty for using a hint
            timeLeft -= 5;
            if (timeLeft <= 0) {
                timeLeft = 0;
                triggerGameOverOrExecution('¡Se acabó el tiempo al usar pista!');
            }
            timerDisplay.textContent = formatTime(timeLeft);

            // Highlight the correct container briefly
            unrevealed.classList.add('hint-highlight');
            setTimeout(() => {
                if (unrevealed) unrevealed.classList.remove('hint-highlight');
            }, 1500);
        }
    });
}
window.addEventListener('resize', resizeGame);
resizeGame();

// UI Events for Tutorial
document.getElementById('tutorial-btn').addEventListener('click', () => {
    showScreen('tutorial-screen');
});
document.getElementById('close-tutorial-btn').addEventListener('click', () => {
    showScreen('start-screen');
});

// ========================================================
// VIRTUAL JOYSTICK LOGIC
// ========================================================
const joystickZone = document.getElementById('joystick-zone');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let stickMaxRadius = 40; // Rango máximo del joystick visual

// Mostrar el joystick solo en dispositivos táctiles
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    joystickZone.style.display = 'block';
}

joystickZone.addEventListener('touchstart', handleJoystickStart, { passive: false });
joystickZone.addEventListener('touchmove', handleJoystickMove, { passive: false });
joystickZone.addEventListener('touchend', handleJoystickEnd, { passive: false });
joystickZone.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

function handleJoystickStart(e) {
    e.preventDefault();
    joystickActive = true;
    
    // Obtener centro de la base del joystick con respecto a la pantalla
    const rect = joystickBase.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;
    
    handleJoystickMove(e);
}

function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;
    const distance = Math.hypot(dx, dy);
    
    let stickX = dx;
    let stickY = dy;
    
    // Limitar el círculo exterior
    if (distance > stickMaxRadius) {
        const ratio = stickMaxRadius / distance;
        stickX = dx * ratio;
        stickY = dy * ratio;
    }
    
    joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
    
    // Reiniciar teclas (para simular input)
    keys['w'] = false; keys['a'] = false; keys['s'] = false; keys['d'] = false;
    
    const threshold = 15; // Distancia mínima para activar movimiento
    if (distance > threshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal dominante
            if (dx > 0) keys['d'] = true;
            else keys['a'] = true;
            // Diagonal si la vertical es suficiente
            if (dy > threshold) keys['s'] = true;
            else if (dy < -threshold) keys['w'] = true;
        } else {
            // Vertical dominante
            if (dy > 0) keys['s'] = true;
            else keys['w'] = true;
            // Diagonal si la horizontal es suficiente
            if (dx > threshold) keys['d'] = true;
            else if (dx < -threshold) keys['a'] = true;
        }
    }
}

function handleJoystickEnd(e) {
    e.preventDefault();
    joystickActive = false;
    joystickStick.style.transform = `translate(-50%, -50%)`; // Retornar al centro
    
    keys['w'] = false;
    keys['a'] = false;
    keys['s'] = false;
    keys['d'] = false;
}
