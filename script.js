const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

const car = {
    x: canvas.width / 2 - 40,
    y: canvas.height,
    width: 50,
    height: 70,
    speed: 5,
    dx: 0,
    dy: 0,
    lives: 1,
    canEatCars: false
};

let obstacles = [];
const obstacleWidth = 50;
const obstacleHeight = 50;
const obstacleSpeed = 3;
let gameOver = false;
let score = 0;
let powerUps = [];
const powerUpWidth = 30;
const powerUpHeight = 30;
const carSkins = ['red', 'blue', 'yellow'];
let currentSkin = 0;
let isPaused = false;

const powerUpTypes = {
    speed: {
        color: 'green',
        effect: () => {
            car.speed += 2;
            setTimeout(() => car.speed -= 2, 5000);
        },
        temporary: true
    },
    lifeSaver: {
        color: 'yellow',
        effect: () => {
            car.lives += 1;
        },
        temporary: false
    },
    eatCars: {
        color: 'purple',
        effect: () => {
            car.canEatCars = true;
            setTimeout(() => car.canEatCars = false, 5000);
        },
        temporary: true
    },
    reduceLength: {
        color: 'blue',
        effect: () => {
            car.height -= 20;
            setTimeout(() => car.height += 20, 5000);
        },
        temporary: true
    }
};

let activePowerUps = [];

function drawCar() {
    ctx.fillStyle = carSkins[currentSkin];
    ctx.fillRect(car.x, car.y, car.width, car.height);
}

function drawObstacles() {
    ctx.fillStyle = 'blue';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUpTypes[powerUp.type].color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '24px serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function drawActivePowerUps() {
    ctx.fillStyle = 'white';
    ctx.font = '18px serif';
    ctx.fillText('Active Power-Ups:', 10, 60);

    const powerUpCounts = activePowerUps.reduce((counts, powerUp) => {
        counts[powerUp.type] = (counts[powerUp.type] || 0) + 1;
        return counts;
    }, {});

    Object.keys(powerUpCounts).forEach((type, index) => {
        ctx.fillStyle = powerUpTypes[type].color;
        ctx.fillText(`${type} (x${powerUpCounts[type]})`, 10, 80 + index * 20);

        const powerUp = activePowerUps.find(p => p.type === type);
        if (powerUpTypes[type].temporary && Date.now() - powerUp.startTime > 4000) {
            ctx.fillStyle = Date.now() % 500 < 250 ? 'white' : powerUpTypes[type].color;
            ctx.fillText(`${type} (x${powerUpCounts[type]})`, 10, 80 + index * 20);
        }
    });
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    car.x += car.dx;
    car.y += car.dy;

    if (car.x < 0) car.x = 0;
    if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;
    if (car.y < 0) car.y = 0;
    if (car.y + car.height > canvas.height) car.y = canvas.height - car.height;
}

function updateObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.y += obstacleSpeed + Math.floor(score / 100);
    });

    obstacles = obstacles.filter(obstacle => {
        if (obstacle.y >= canvas.height) {
            score += 1;
            return false;
        }
        return true;
    });
}

function updatePowerUps() {
    powerUps.forEach(powerUp => {
        powerUp.y += obstacleSpeed;
    });

    powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);
}

function checkCollision() {
    obstacles.forEach(obstacle => {
        if (
            car.x < obstacle.x + obstacle.width &&
            car.x + car.width > obstacle.x &&
            car.y < obstacle.y + obstacle.height &&
            car.y + car.height > obstacle.y
        ) {
            if (car.canEatCars) {
                obstacles = obstacles.filter(o => o !== obstacle);
                score += 1;
            } else if (car.lives > 1) {
                car.lives -= 1;
                obstacles = obstacles.filter(o => o !== obstacle);
                const lifeSaverIndex = activePowerUps.findIndex(p => p.type === 'lifeSaver');
                if (lifeSaverIndex !== -1) {
                    activePowerUps.splice(lifeSaverIndex, 1);
                }
            } else {
                gameOver = true;
            }
        }
    });
}

function checkPowerUpCollision() {
    powerUps.forEach((powerUp, index) => {
        if (
            car.x < powerUp.x + powerUp.width &&
            car.x + car.width > powerUp.x &&
            car.y < powerUp.y + powerUp.height &&
            car.y + car.height > powerUp.y
        ) {
            powerUps.splice(index, 1);
            const type = powerUp.type;
            powerUpTypes[type].effect();
            activePowerUps.push({ type, startTime: Date.now() });
            if (powerUpTypes[type].temporary) {
                setTimeout(() => {
                    activePowerUps = activePowerUps.filter(p => p.type !== type);
                }, 5000); // honestly, deal with it, increase if you want to add something that lasts for more than 5seconds (don't if you're smart)
            }
        }
    });
}

function generateObstacle() {
    const x = Math.random() * (canvas.width - obstacleWidth);
    const obstacle = {
        x: x,
        y: -obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight
    };
    obstacles.push(obstacle);
}

function generatePowerUp() {
    const x = Math.random() * (canvas.width - powerUpWidth);
    const types = Object.keys(powerUpTypes);
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = {
        x: x,
        y: -powerUpHeight,
        width: powerUpWidth,
        height: powerUpHeight,
        type: type
    };
    powerUps.push(powerUp);
}

function changeCarSkin() {
    currentSkin = (currentSkin + 1) % carSkins.length;
}

function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) {
        update();
    }
}

function showGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
    restartButton.style.display = 'block';
}

function restartGame() {
    car.dx = 0;
    car.dy = 0;
    car.lives = 1;
    car.canEatCars = false;
    obstacles = [];
    powerUps = [];
    score = 0;
    gameOver = false;
    restartButton.style.display = 'none';
    update();
}

restartButton.addEventListener('click', restartGame);

setInterval(generateObstacle, 2000);
setInterval(generatePowerUp, 10000);

function update() {
    if (gameOver) {
        showGameOver();
        return;
    }

    if (isPaused) {
        return;
    }

    clear();
    drawCar();
    drawObstacles();
    drawPowerUps();
    drawScore();
    drawActivePowerUps();
    newPos();
    updateObstacles();
    updatePowerUps();
    checkCollision();
    checkPowerUpCollision();
    requestAnimationFrame(update);
}

function moveUp() {
    car.dy = -car.speed;
}

function moveDown() {
    car.dy = car.speed;
}

function moveRight() {
    car.dx = car.speed;
}

function moveLeft() {
    car.dx = -car.speed;
}

function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        moveRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        moveUp();
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        moveDown();
    } else if (e.key === 'p') {
        togglePause();
    } else if (e.key === 'c') {
        changeCarSkin();
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' || e.key === 'd' ||
        e.key === 'ArrowLeft' || e.key === 'a' ||
        e.key === 'ArrowUp' || e.key === 'w' ||
        e.key === 'ArrowDown' || e.key === 's'
    ) {
        car.dx = 0;
        car.dy = 0;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

update();