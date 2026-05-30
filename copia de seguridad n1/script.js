// Game Elements
const screens = document.querySelectorAll('.screen');
const stealthScreen = document.getElementById('stealth-screen');
const playerEl = document.getElementById('player');
const enemyEl = document.getElementById('enemy');
const poiEls = document.querySelectorAll('.poi');
const timerDisplay = document.getElementById('timer-display');
const cluesDisplay = document.getElementById('clues-display');
const cluesEls = document.querySelectorAll('.clue');
const gameOverReason = document.getElementById('game-over-reason');

// Buttons
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('victory-restart-btn').addEventListener('click', startGame);

// Game State
let gameState = 'start'; 
let animationFrameId;

// Entities
const player = { x: 400, y: 500, speed: 4, radius: 12 };
const enemy = { x: 400, y: 100, speed: 1.8, radius: 16 };
let activePOI = null;

// Controls
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Phase 2 State
const MAX_TIME = 15;
let timeLeft = MAX_TIME;
let timerInterval;
let cluesFound = 0;

function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function startGame() {
    gameState = 'stealth';
    player.x = 400; player.y = 500;
    enemy.x = 400; enemy.y = 100;
    
    poiEls.forEach(poi => {
        poi.dataset.cleared = "false";
        poi.style.display = 'block';
    });
    
    showScreen('stealth-screen');
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function updatePlayer() {
    let dx = 0; let dy = 0;
    if (keys.w || keys.ArrowUp) dy -= 1;
    if (keys.s || keys.ArrowDown) dy += 1;
    if (keys.a || keys.ArrowLeft) dx -= 1;
    if (keys.d || keys.ArrowRight) dx += 1;

    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length; dy /= length;
    }

    player.x += dx * player.speed;
    player.y += dy * player.speed;

    player.x = Math.max(player.radius, Math.min(800 - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(600 - player.radius, player.y));

    playerEl.style.left = `${player.x}px`;
    playerEl.style.top = `${player.y}px`;
    
    // Add minor tilt for dynamic feel
    if (dx !== 0) {
        playerEl.style.transform = `translate(-50%, -50%) rotate(${dx * 15}deg)`;
    } else {
        playerEl.style.transform = `translate(-50%, -50%) rotate(0deg)`;
    }
}

function updateEnemy() {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
    }

    enemyEl.style.left = `${enemy.x}px`;
    enemyEl.style.top = `${enemy.y}px`;

    // Increased hitbox slightly for fairness to the AI
    if (distance < player.radius + enemy.radius) {
        gameOver("¡El guardia te detectó en la sombra!");
    }
}

function checkPOIs() {
    poiEls.forEach(poi => {
        if (poi.dataset.cleared === "true") return;
        
        const rect = poi.getBoundingClientRect();
        const containerRect = stealthScreen.getBoundingClientRect();
        
        const poiX = rect.left - containerRect.left + rect.width / 2;
        const poiY = rect.top - containerRect.top + rect.height / 2;

        const distance = Math.hypot(player.x - poiX, player.y - poiY);

        // Interaction radius
        if (distance < player.radius + 20) {
            startPointAndClickPhase(poi);
        }
    });
}

function gameLoop() {
    if (gameState !== 'stealth') return;

    updatePlayer();
    updateEnemy();
    checkPOIs();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startPointAndClickPhase(poiElement) {
    gameState = 'point';
    activePOI = poiElement;
    
    showScreen('point-screen');
    
    timeLeft = MAX_TIME;
    cluesFound = 0;
    updateTimerDisplay();
    updateCluesDisplay();
    
    cluesEls.forEach(clue => {
        clue.classList.remove('found');
        clue.style.top = `${15 + Math.random() * 70}%`;
        clue.style.left = `${15 + Math.random() * 70}%`;
    });

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver("¡Se acabó el tiempo y el enemigo te atrapó buscando!");
        }
    }, 1000);
}

cluesEls.forEach(clue => {
    clue.addEventListener('click', function() {
        if (gameState !== 'point' || this.classList.contains('found')) return;
        
        this.classList.add('found');
        cluesFound++;
        updateCluesDisplay();
        
        if (cluesFound >= cluesEls.length) {
            clearInterval(timerInterval);
            setTimeout(() => {
                activePOI.dataset.cleared = "true";
                activePOI.style.display = 'none';
                returnToStealth();
            }, 600);
        }
    });
});

function updateTimerDisplay() {
    timerDisplay.textContent = `${timeLeft}s`;
}

function updateCluesDisplay() {
    cluesDisplay.textContent = `${cluesFound}/${cluesEls.length}`;
}

function returnToStealth() {
    let allCleared = true;
    poiEls.forEach(poi => {
        if (poi.dataset.cleared !== "true" && poi.style.display !== 'none') {
            allCleared = false;
        }
    });

    if (allCleared) {
        victory();
    } else {
        gameState = 'stealth';
        showScreen('stealth-screen');
        
        // Push enemy away slightly so player has time to run
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        enemy.x = player.x + Math.cos(angle) * 150;
        enemy.y = player.y + Math.sin(angle) * 150;
        
        // Keep in bounds
        enemy.x = Math.max(enemy.radius, Math.min(800 - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(600 - enemy.radius, enemy.y));

        gameLoop();
    }
}

function gameOver(reason) {
    gameState = 'gameover';
    gameOverReason.textContent = reason;
    showScreen('game-over-screen');
    clearInterval(timerInterval);
}

function victory() {
    gameState = 'victory';
    showScreen('victory-screen');
    clearInterval(timerInterval);
}
