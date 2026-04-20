window.tronGameStart = function() {
    // Clean up previous game if it exists
    if (window.tronGameStop) {
        window.tronGameStop();
    }

    // Get DOM elements
    const gameArea = document.getElementById('gameArea');
    
    // Clear any existing game elements
    if (gameArea) gameArea.innerHTML = '';

    // TRON Light Cycle Game Setup
    const gridSize = 10;
    
    // Get dimensions with fallback values if not yet rendered
    let gameWidth = Math.floor(gameArea.offsetWidth / gridSize);
    let gameHeight = Math.floor(gameArea.offsetHeight / gridSize);
    
    // Fallback to reasonable defaults if dimensions are 0
    if (gameWidth === 0) gameWidth = 80;
    if (gameHeight === 0) gameHeight = 50;

    // Create game grid
    const grid = [];
    for (let y = 0; y < gameHeight; y++) {
        grid[y] = [];
        for (let x = 0; x < gameWidth; x++) {
            grid[y][x] = 0; // 0 = empty, 1 = wall, 2 = player trail, 3 = AI trail
        }
    }

    // Player light cycle properties
    let cycleX = Math.floor(gameWidth / 4);
    let cycleY = Math.floor(gameHeight / 2);
    let direction = 'right'; // current direction
    let score = 0;
    let gameRunning = true;
    let gameSpeed = 30; // Starting speed (ms between moves) - fast and exciting!
    let gameStartTime = Date.now(); // Track game start time for speed increases
    let aiDefeatedCount = 0; // Track how many AI opponents have been defeated

    // AI opponent properties
    let aiCycleX = Math.floor((gameWidth * 3) / 4); // Start on opposite side
    let aiCycleY = Math.floor(gameHeight / 2);
    let aiDirection = 'left'; // Start moving toward player
    let aiAlive = true;
    let aiLastTurnTime = Date.now();
    let aiTrailElements = []; // Keep track of AI trail elements for removal
    let aiRespawnTimer = null; // Timer for AI respawn

    // Create player light cycle element
    const lightCycle = document.createElement('div');
    lightCycle.className = 'light-cycle';
    lightCycle.style.width = gridSize + 'px';
    lightCycle.style.height = gridSize + 'px';
    gameArea.appendChild(lightCycle);

    // Create AI light cycle element
    const aiLightCycle = document.createElement('div');
    aiLightCycle.className = 'ai-light-cycle';
    aiLightCycle.style.width = gridSize + 'px';
    aiLightCycle.style.height = gridSize + 'px';
    gameArea.appendChild(aiLightCycle);

    // Score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'score-display game-ui';
    scoreDisplay.textContent = 'SCORE: 0';
    gameArea.appendChild(scoreDisplay);

    // Update cycle positions
    function updateCyclePosition() {
        lightCycle.style.left = (cycleX * gridSize) + 'px';
        lightCycle.style.top = (cycleY * gridSize) + 'px';
    }

    function updateAICyclePosition() {
        if (aiAlive) {
            aiLightCycle.style.left = (aiCycleX * gridSize) + 'px';
            aiLightCycle.style.top = (aiCycleY * gridSize) + 'px';
        }
    }

    // Draw AI trail segment
    function drawAITrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'ai-light-trail';
        trail.style.left = (x * gridSize) + 'px';
        trail.style.top = (y * gridSize) + 'px';
        trail.style.width = gridSize + 'px';
        trail.style.height = gridSize + 'px';
        gameArea.appendChild(trail);
        aiTrailElements.push(trail); // Track for removal
    }

    // Remove all AI trail elements
    function removeAITrail() {
        aiTrailElements.forEach(trail => {
            if (trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }
        });
        aiTrailElements = [];

        // Clear AI trail from grid
        for (let y = 0; y < gameHeight; y++) {
            for (let x = 0; x < gameWidth; x++) {
                if (grid[y][x] === 3) {
                    grid[y][x] = 0;
                }
            }
        }
    }

    // Remove all player trail elements
    function removePlayerTrail() {
        // Remove all player trail elements from DOM
        const playerTrails = document.querySelectorAll('.light-trail');
        playerTrails.forEach(trail => {
            if (trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }
        });

        // Clear player trail from grid
        for (let y = 0; y < gameHeight; y++) {
            for (let x = 0; x < gameWidth; x++) {
                if (grid[y][x] === 2) {
                    grid[y][x] = 0;
                }
            }
        }
    }

    // Check if a position is safe for AI to move to
    function isSafePosition(x, y) {
        if (x < 0 || x >= gameWidth || y < 0 || y >= gameHeight) {
            return false;
        }
        return grid[y][x] === 0;
    }

    // Get possible directions for AI
    function getPossibleDirections(x, y, currentDirection) {
        const directions = [];
        const oppositeDirection = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // Check all directions except backwards
        if (currentDirection !== 'down' && isSafePosition(x, y - 1)) {
            directions.push('up');
        }
        if (currentDirection !== 'up' && isSafePosition(x, y + 1)) {
            directions.push('down');
        }
        if (currentDirection !== 'right' && isSafePosition(x - 1, y)) {
            directions.push('left');
        }
        if (currentDirection !== 'left' && isSafePosition(x + 1, y)) {
            directions.push('right');
        }

        return directions;
    }

    // Calculate distance to nearest obstacle in a direction
    function getDistanceToObstacle(x, y, direction) {
        let distance = 0;
        let checkX = x;
        let checkY = y;

        while (true) {
            switch (direction) {
                case 'up': checkY--; break;
                case 'down': checkY++; break;
                case 'left': checkX--; break;
                case 'right': checkX++; break;
            }

            if (!isSafePosition(checkX, checkY)) {
                break;
            }
            distance++;
        }

        return distance;
    }

    // AI decision making
    function makeAIDecision() {
        const currentTime = Date.now();
        const timeSinceLastTurn = currentTime - aiLastTurnTime;

        // Don't turn too frequently (minimum 0.5-2 seconds between turns - reduced for more chaos)
        const minTurnInterval = 500 + Math.random() * 1500;

        const possibleDirections = getPossibleDirections(aiCycleX, aiCycleY, aiDirection);

        // Add occasional random impulse turns even when not needed (5% chance each game step)
        if (possibleDirections.length > 1 && Math.random() < 0.05) {
            aiDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            aiLastTurnTime = currentTime;
            return; // Exit early after impulse turn
        }

        // If AI is about to crash, turn immediately
        let nextX = aiCycleX;
        let nextY = aiCycleY;
        switch (aiDirection) {
            case 'up': nextY--; break;
            case 'down': nextY++; break;
            case 'left': nextX--; break;
            case 'right': nextX++; break;
        }

        if (!isSafePosition(nextX, nextY)) {
            // Emergency turn! But make AI less perfect
            if (possibleDirections.length > 0) {
                // 35% chance AI makes a suboptimal emergency turn (increased from 20%)
                if (Math.random() < 0.35) {
                    // Choose a random direction instead of the best one
                    aiDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                } else {
                    // Choose direction with most space (but not always perfectly)
                    let bestDirection = possibleDirections[0];
                    let bestDistance = getDistanceToObstacle(aiCycleX, aiCycleY, bestDirection);

                    for (let dir of possibleDirections) {
                        const distance = getDistanceToObstacle(aiCycleX, aiCycleY, dir);
                        if (distance > bestDistance) {
                            bestDirection = dir;
                            bestDistance = distance;
                        }
                    }

                    aiDirection = bestDirection;
                }
                aiLastTurnTime = currentTime;
            }
        } else if (timeSinceLastTurn > minTurnInterval && possibleDirections.length > 1) {
            // Increased turn decision chance to 55% (make AI more active and less predictable)
            if (Math.random() < 0.55) {
                // 50% chance to make a completely random turn (increased from 30%)
                if (Math.random() < 0.5) {
                    aiDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                } else {
                    // Sometimes turn toward player for more aggressive gameplay
                    const playerDirection = getDirectionToPlayer();
                    if (possibleDirections.includes(playerDirection) && Math.random() < 0.4) {
                        aiDirection = playerDirection;
                    } else {
                        // Choose direction with heavy randomness, less optimal
                        const weightedDirections = [];
                        for (let dir of possibleDirections) {
                            const distance = getDistanceToObstacle(aiCycleX, aiCycleY, dir);
                            // Even more reduced weighting to make AI less perfect
                            for (let i = 0; i < Math.min(distance, 2); i++) {
                                weightedDirections.push(dir);
                            }
                        }
                        if (weightedDirections.length > 0) {
                            aiDirection = weightedDirections[Math.floor(Math.random() * weightedDirections.length)];
                        }
                    }
                }
                aiLastTurnTime = currentTime;
            }
        }
    }

    // Get direction from AI to player
    function getDirectionToPlayer() {
        const dx = cycleX - aiCycleX;
        const dy = cycleY - aiCycleY;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    // Find a safe spawn position for AI
    function findSafeSpawnPosition() {
        const possiblePositions = [];

        // Try edges first (more dramatic entrances)
        const edgePositions = [
            // Top edge
            ...Array.from({ length: gameWidth - 4 }, (_, i) => ({ x: i + 2, y: 1 })),
            // Bottom edge
            ...Array.from({ length: gameWidth - 4 }, (_, i) => ({ x: i + 2, y: gameHeight - 2 })),
            // Left edge
            ...Array.from({ length: gameHeight - 4 }, (_, i) => ({ x: 1, y: i + 2 })),
            // Right edge
            ...Array.from({ length: gameHeight - 4 }, (_, i) => ({ x: gameWidth - 2, y: i + 2 }))
        ];

        // Filter for safe positions (away from player and trails)
        for (let pos of edgePositions) {
            if (grid[pos.y][pos.x] === 0) {
                const distanceToPlayer = Math.abs(pos.x - cycleX) + Math.abs(pos.y - cycleY);
                if (distanceToPlayer > 5) { // Spawn away from player
                    possiblePositions.push(pos);
                }
            }
        }

        // If no edge positions available, try center area
        if (possiblePositions.length === 0) {
            for (let x = 2; x < gameWidth - 2; x++) {
                for (let y = 2; y < gameHeight - 2; y++) {
                    if (grid[y][x] === 0) {
                        const distanceToPlayer = Math.abs(x - cycleX) + Math.abs(y - cycleY);
                        if (distanceToPlayer > 5) {
                            possiblePositions.push({ x, y });
                        }
                    }
                }
            }
        }

        if (possiblePositions.length > 0) {
            return possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
        }

        // Fallback to original position if no safe spot found
        return { x: Math.floor((gameWidth * 3) / 4), y: Math.floor(gameHeight / 2) };
    }

    // Respawn AI opponent
    function respawnAI() {
        if (aiRespawnTimer) {
            clearTimeout(aiRespawnTimer);
        }

        aiRespawnTimer = setTimeout(() => {
            if (gameRunning && !aiAlive) {
                // Find safe spawn position
                const spawnPos = findSafeSpawnPosition();

                // Reset AI properties
                aiCycleX = spawnPos.x;
                aiCycleY = spawnPos.y;
                aiDirection = getDirectionToPlayer(); // Start moving toward player
                aiAlive = true;
                aiLastTurnTime = Date.now();
                aiTrailElements = [];

                // Show AI cycle
                aiLightCycle.style.display = 'block';
                updateAICyclePosition();
            }
        }, 1000); // 1 second delay
    }

    // Draw trail segment
    function drawTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'light-trail';
        trail.style.left = (x * gridSize) + 'px';
        trail.style.top = (y * gridSize) + 'px';
        trail.style.width = gridSize + 'px';
        trail.style.height = gridSize + 'px';
        gameArea.appendChild(trail);
    }

    // Draw wall segment (sleeker border design)
    function drawWall(x, y, isBorder = false) {
        const wall = document.createElement('div');
        wall.className = isBorder ? 'wall border' : 'wall barrier';
        wall.style.left = (x * gridSize) + 'px';
        wall.style.top = (y * gridSize) + 'px';
        wall.style.width = gridSize + 'px';
        wall.style.height = gridSize + 'px';
        gameArea.appendChild(wall);
    }

    // Generate random barriers
    function generateBarriers() {
        const numBarriers = Math.floor(Math.random() * 6) + 4; // 4-9 barriers (double the previous average)

        for (let i = 0; i < numBarriers; i++) {
            let attempts = 0;
            let placed = false;

            while (!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (gameWidth - 6)) + 3; // More space for larger shapes
                const y = Math.floor(Math.random() * (gameHeight - 6)) + 3;

                // Check if area is clear and not too close to starting positions
                let canPlace = true;
                const playerStartX = Math.floor(gameWidth / 4);
                const playerStartY = Math.floor(gameHeight / 2);
                const aiStartX = Math.floor((gameWidth * 3) / 4);
                const aiStartY = Math.floor(gameHeight / 2);

                // Avoid both player and AI starting areas
                if ((Math.abs(x - playerStartX) < 4 && Math.abs(y - playerStartY) < 4) ||
                    (Math.abs(x - aiStartX) < 4 && Math.abs(y - aiStartY) < 4)) {
                    canPlace = false;
                }

                if (canPlace && grid[y][x] === 0) {
                    // Create interesting barrier shapes
                    const barrierType = Math.floor(Math.random() * 8);

                    if (barrierType === 0) {
                        // Single block
                        if (grid[y][x] === 0) {
                            grid[y][x] = 1;
                            drawWall(x, y);
                            placed = true;
                        }
                    } else if (barrierType === 1) {
                        // Horizontal line (3-4 blocks)
                        const lineLength = Math.floor(Math.random() * 2) + 3; // 3-4 blocks
                        let canPlaceLine = true;

                        for (let j = 0; j < lineLength; j++) {
                            if (x + j >= gameWidth - 1 || grid[y][x + j] !== 0) {
                                canPlaceLine = false;
                                break;
                            }
                        }

                        if (canPlaceLine) {
                            for (let j = 0; j < lineLength; j++) {
                                grid[y][x + j] = 1;
                                drawWall(x + j, y);
                            }
                            placed = true;
                        }
                    } else if (barrierType === 2) {
                        // Vertical line (3-4 blocks)
                        const lineLength = Math.floor(Math.random() * 2) + 3; // 3-4 blocks
                        let canPlaceLine = true;

                        for (let j = 0; j < lineLength; j++) {
                            if (y + j >= gameHeight - 1 || grid[y + j][x] !== 0) {
                                canPlaceLine = false;
                                break;
                            }
                        }

                        if (canPlaceLine) {
                            for (let j = 0; j < lineLength; j++) {
                                grid[y + j][x] = 1;
                                drawWall(x, y + j);
                            }
                            placed = true;
                        }
                    } else if (barrierType === 3) {
                        // L-shape (corner down-right)
                        const positions = [{ x: x, y: y }, { x: x + 1, y: y }, { x: x + 2, y: y }, { x: x, y: y + 1 }, { x: x, y: y + 2 }];
                        let canPlaceL = true;

                        for (let pos of positions) {
                            if (pos.x >= gameWidth - 1 || pos.y >= gameHeight - 1 || grid[pos.y][pos.x] !== 0) {
                                canPlaceL = false;
                                break;
                            }
                        }

                        if (canPlaceL) {
                            for (let pos of positions) {
                                grid[pos.y][pos.x] = 1;
                                drawWall(pos.x, pos.y);
                            }
                            placed = true;
                        }
                    } else if (barrierType === 4) {
                        // L-shape (corner down-left)
                        const positions = [{ x: x, y: y }, { x: x - 1, y: y }, { x: x - 2, y: y }, { x: x, y: y + 1 }, { x: x, y: y + 2 }];
                        let canPlaceL = true;

                        for (let pos of positions) {
                            if (pos.x < 1 || pos.y >= gameHeight - 1 || grid[pos.y][pos.x] !== 0) {
                                canPlaceL = false;
                                break;
                            }
                        }

                        if (canPlaceL) {
                            for (let pos of positions) {
                                grid[pos.y][pos.x] = 1;
                                drawWall(pos.x, pos.y);
                            }
                            placed = true;
                        }
                    } else if (barrierType === 5) {
                        // L-shape (corner up-right)
                        const positions = [{ x: x, y: y }, { x: x + 1, y: y }, { x: x + 2, y: y }, { x: x, y: y - 1 }, { x: x, y: y - 2 }];
                        let canPlaceL = true;

                        for (let pos of positions) {
                            if (pos.x >= gameWidth - 1 || pos.y < 1 || grid[pos.y][pos.x] !== 0) {
                                canPlaceL = false;
                                break;
                            }
                        }

                        if (canPlaceL) {
                            for (let pos of positions) {
                                grid[pos.y][pos.x] = 1;
                                drawWall(pos.x, pos.y);
                            }
                            placed = true;
                        }
                    } else if (barrierType === 6) {
                        // L-shape (corner up-left)
                        const positions = [{ x: x, y: y }, { x: x - 1, y: y }, { x: x - 2, y: y }, { x: x, y: y - 1 }, { x: x, y: y - 2 }];
                        let canPlaceL = true;

                        for (let pos of positions) {
                            if (pos.x < 1 || pos.y < 1 || grid[pos.y][pos.x] !== 0) {
                                canPlaceL = false;
                                break;
                            }
                        }

                        if (canPlaceL) {
                            for (let pos of positions) {
                                grid[pos.y][pos.x] = 1;
                                drawWall(pos.x, pos.y);
                            }
                            placed = true;
                        }
                    } else if (barrierType === 7) {
                        // Small square (2x2)
                        const positions = [{ x: x, y: y }, { x: x + 1, y: y }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }];
                        let canPlaceSquare = true;

                        for (let pos of positions) {
                            if (pos.x >= gameWidth - 1 || pos.y >= gameHeight - 1 || grid[pos.y][pos.x] !== 0) {
                                canPlaceSquare = false;
                                break;
                            }
                        }

                        if (canPlaceSquare) {
                            for (let pos of positions) {
                                grid[pos.y][pos.x] = 1;
                                drawWall(pos.x, pos.y);
                            }
                            placed = true;
                        }
                    }
                }
                attempts++;
            }
        }
    }

    // Generate initial barriers
    generateBarriers();

    // Create dramatic cycle-destroyed shattering effect
    function createCycleShatterEffect(cycleElement, x, y, isPlayerCycle = true) {
        // Get the cycle's current styling
        const cycleStyle = window.getComputedStyle(cycleElement);
        const cycleColor = isPlayerCycle ? '#00f0ff' : '#ff0066';
        const cycleGlow = isPlayerCycle ? '0 0 10px #00f0ff' : '0 0 10px #ff0066';

        // Create shatter explosion container
        const shatterContainer = document.createElement('div');
        shatterContainer.style.position = 'absolute';
        shatterContainer.style.left = (x * gridSize) + 'px';
        shatterContainer.style.top = (y * gridSize) + 'px';
        shatterContainer.style.width = gridSize + 'px';
        shatterContainer.style.height = gridSize + 'px';
        shatterContainer.style.zIndex = '1000';
        gameArea.appendChild(shatterContainer);

        // Create fragments (simulating glass shards)
        const numFragments = 12;
        const fragmentSizes = [3, 4, 5, 6, 7, 8]; // Different fragment sizes

        for (let i = 0; i < numFragments; i++) {
            const fragment = document.createElement('div');
            fragment.className = 'shatter-fragment';

            // Random fragment size
            const fragmentSize = fragmentSizes[Math.floor(Math.random() * fragmentSizes.length)];
            fragment.style.width = fragmentSize + 'px';
            fragment.style.height = fragmentSize + 'px';

            // Inherit cycle styling
            fragment.style.backgroundColor = cycleColor;
            fragment.style.boxShadow = cycleGlow;
            fragment.style.border = '1px solid ' + cycleColor;

            // Random starting position within the cycle
            const startX = Math.random() * (gridSize - fragmentSize);
            const startY = Math.random() * (gridSize - fragmentSize);
            fragment.style.left = startX + 'px';
            fragment.style.top = startY + 'px';

            // Calculate trajectory (explosive outward motion)
            const angle = (Math.PI * 2 * i) / numFragments + (Math.random() - 0.5) * 0.8;
            const distance = 40 + Math.random() * 60; // Random distance
            const finalX = Math.cos(angle) * distance;
            const finalY = Math.sin(angle) * distance;

            // Mid-point for more realistic arc
            const midX = finalX * 0.4 + (Math.random() - 0.5) * 20;
            const midY = finalY * 0.4 + (Math.random() - 0.5) * 20;

            // Random rotation for chaotic effect
            const rotationMid = (Math.random() - 0.5) * 180;
            const rotationFinal = (Math.random() - 0.5) * 720; // Multiple spins

            // Set CSS custom properties for animation
            fragment.style.setProperty('--x-mid', midX + 'px');
            fragment.style.setProperty('--y-mid', midY + 'px');
            fragment.style.setProperty('--x-final', finalX + 'px');
            fragment.style.setProperty('--y-final', finalY + 'px');
            fragment.style.setProperty('--rotation-mid', rotationMid + 'deg');
            fragment.style.setProperty('--rotation-final', rotationFinal + 'deg');

            // Add slight delay for staggered effect
            fragment.style.animationDelay = (i * 30) + 'ms';

            shatterContainer.appendChild(fragment);
        }

        // Create electric sparks (like in TRON Legacy)
        const numSparks = 8;
        for (let i = 0; i < numSparks; i++) {
            const spark = document.createElement('div');
            spark.className = 'shatter-spark';

            // Small bright sparks
            spark.style.width = '2px';
            spark.style.height = '2px';
            spark.style.backgroundColor = '#ffffff';
            spark.style.boxShadow = '0 0 4px #ffffff, 0 0 8px ' + cycleColor;

            // Random position within cycle
            const sparkStartX = Math.random() * gridSize;
            const sparkStartY = Math.random() * gridSize;
            spark.style.left = sparkStartX + 'px';
            spark.style.top = sparkStartY + 'px';

            // Spark trajectory (shorter than fragments)
            const sparkAngle = Math.random() * Math.PI * 2;
            const sparkDistance = 15 + Math.random() * 25;
            const sparkFinalX = Math.cos(sparkAngle) * sparkDistance;
            const sparkFinalY = Math.sin(sparkAngle) * sparkDistance;

            // Mid-point for spark
            const sparkMidX = sparkFinalX * 0.6;
            const sparkMidY = sparkFinalY * 0.6;

            spark.style.setProperty('--spark-x', sparkMidX + 'px');
            spark.style.setProperty('--spark-y', sparkMidY + 'px');
            spark.style.setProperty('--spark-x-final', sparkFinalX + 'px');
            spark.style.setProperty('--spark-y-final', sparkFinalY + 'px');

            spark.style.animationDelay = (i * 50) + 'ms';

            shatterContainer.appendChild(spark);
        }

        // Create shockwave effect
        const shockwave = document.createElement('div');
        shockwave.style.position = 'absolute';
        shockwave.style.left = (gridSize / 2 - 5) + 'px';
        shockwave.style.top = (gridSize / 2 - 5) + 'px';
        shockwave.style.width = '10px';
        shockwave.style.height = '10px';
        shockwave.style.border = '2px solid ' + cycleColor;
        shockwave.style.borderRadius = '50%';
        shockwave.style.opacity = '0.8';
        shockwave.style.zIndex = '999';
        shatterContainer.appendChild(shockwave);

        // Animate shockwave
        shockwave.animate([
            {
                transform: 'scale(1)',
                opacity: '0.8'
            },
            {
                transform: 'scale(6)',
                opacity: '0'
            }
        ], {
            duration: 500,
            easing: 'ease-out'
        });

        // Screen flash effect for dramatic impact
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = cycleColor;
        flash.style.opacity = '0.15';
        flash.style.zIndex = '998';
        flash.style.pointerEvents = 'none';
        gameArea.appendChild(flash);

        // Animate flash
        flash.animate([
            { opacity: '0.15' },
            { opacity: '0' }
        ], {
            duration: 200,
            easing: 'ease-out'
        }).onfinish = () => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        };

        // Clean up shatter container after animation
        setTimeout(() => {
            if (shatterContainer.parentNode) {
                shatterContainer.parentNode.removeChild(shatterContainer);
            }
        }, 1500);

        // Hide the original cycle element
        cycleElement.style.display = 'none';
    }

    // Create afterburner effect when speed increases
    function createAfterburnerEffect() {
        // Create multiple layers of effects for maximum impact

        // 1. Create a massive shockwave ring
        const shockwave = document.createElement('div');
        shockwave.style.position = 'absolute';
        shockwave.style.width = '20px';
        shockwave.style.height = '20px';
        shockwave.style.border = '3px solid #00f0ff';
        shockwave.style.borderRadius = '50%';
        shockwave.style.left = (cycleX * gridSize + gridSize / 2 - 10) + 'px';
        shockwave.style.top = (cycleY * gridSize + gridSize / 2 - 10) + 'px';
        shockwave.style.boxShadow = '0 0 20px #00f0ff, 0 0 40px #00f0ff, inset 0 0 10px #00f0ff';
        shockwave.style.opacity = '1';
        shockwave.style.zIndex = '999';
        gameArea.appendChild(shockwave);

        // Animate shockwave expansion
        shockwave.animate([
            {
                transform: 'scale(1)',
                opacity: '1'
            },
            {
                transform: 'scale(8)',
                opacity: '0'
            }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => {
            if (shockwave.parentNode) {
                shockwave.parentNode.removeChild(shockwave);
            }
        };

        // 2. Create dramatic particle burst with larger, more visible particles
        const numBursts = 12; // More particles
        const burstRadius = 60; // Larger radius

        for (let i = 0; i < numBursts; i++) {
            const burst = document.createElement('div');
            burst.style.position = 'absolute';
            burst.style.width = '8px'; // Larger particles
            burst.style.height = '8px';
            burst.style.backgroundColor = '#00f0ff';
            burst.style.borderRadius = '50%';
            burst.style.boxShadow = '0 0 15px #00f0ff, 0 0 30px #00f0ff, 0 0 45px #00f0ff';
            burst.style.opacity = '1';
            burst.style.zIndex = '1000';

            // Position burst at cycle location
            burst.style.left = (cycleX * gridSize + gridSize / 2 - 4) + 'px';
            burst.style.top = (cycleY * gridSize + gridSize / 2 - 4) + 'px';

            gameArea.appendChild(burst);

            // Animate burst outward with random variation
            const angle = (i / numBursts) * Math.PI * 2;
            const randomRadius = burstRadius + (Math.random() - 0.5) * 20;
            const finalX = Math.cos(angle) * randomRadius;
            const finalY = Math.sin(angle) * randomRadius;

            burst.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: '1'
                },
                {
                    transform: `translate(${finalX}px, ${finalY}px) scale(0.1)`,
                    opacity: '0'
                }
            ], {
                duration: 600,
                easing: 'ease-out',
                delay: i * 20 // Stagger the particles slightly
            }).onfinish = () => {
                if (burst.parentNode) {
                    burst.parentNode.removeChild(burst);
                }
            };
        }

        // 3. Create screen flash effect
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = '#00f0ff';
        flash.style.opacity = '0.3';
        flash.style.zIndex = '998';
        flash.style.pointerEvents = 'none';
        gameArea.appendChild(flash);

        // Animate flash
        flash.animate([
            { opacity: '0.3' },
            { opacity: '0' }
        ], {
            duration: 150,
            easing: 'ease-out'
        }).onfinish = () => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        };

        // 4. Create dramatic cycle glow effect
        const originalBoxShadow = lightCycle.style.boxShadow;
        const originalBg = lightCycle.style.backgroundColor;

        lightCycle.style.boxShadow = '0 0 30px #00f0ff, 0 0 60px #00f0ff, 0 0 90px #00f0ff, inset 0 0 20px #00cc99';
        lightCycle.style.backgroundColor = '#ffffff';
        lightCycle.style.transform = 'scale(1.5)';

        // Add pulsing effect
        const pulseAnimation = lightCycle.animate([
            { transform: 'scale(1.5)' },
            { transform: 'scale(1.2)' },
            { transform: 'scale(1.5)' }
        ], {
            duration: 200,
            iterations: 2
        });

        setTimeout(() => {
            lightCycle.style.boxShadow = originalBoxShadow;
            lightCycle.style.backgroundColor = originalBg;
            lightCycle.style.transform = 'scale(1)';
        }, 400);

        // 5. Add sound-like visual effect (expanding circles)
        for (let j = 0; j < 3; j++) {
            setTimeout(() => {
                const soundWave = document.createElement('div');
                soundWave.style.position = 'absolute';
                soundWave.style.width = '10px';
                soundWave.style.height = '10px';
                soundWave.style.border = '2px solid #00cc99';
                soundWave.style.borderRadius = '50%';
                soundWave.style.left = (cycleX * gridSize + gridSize / 2 - 5) + 'px';
                soundWave.style.top = (cycleY * gridSize + gridSize / 2 - 5) + 'px';
                soundWave.style.opacity = '0.8';
                soundWave.style.zIndex = '997';
                gameArea.appendChild(soundWave);

                soundWave.animate([
                    {
                        transform: 'scale(1)',
                        opacity: '0.8'
                    },
                    {
                        transform: 'scale(6)',
                        opacity: '0'
                    }
                ], {
                    duration: 400,
                    easing: 'ease-out'
                }).onfinish = () => {
                    if (soundWave.parentNode) {
                        soundWave.parentNode.removeChild(soundWave);
                    }
                };
            }, j * 100);
        }
    }

    // Handle input
    const keydownHandler = function (event) {
        // Check if Enter is pressed to restart the game
        if (!gameRunning && event.key === 'Enter') {
            window.tronGameStart(); // Restart the game
            return;
        }

        if (!gameRunning) return;

        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') direction = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') direction = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') direction = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') direction = 'right';
                break;
        }
    };

    document.addEventListener('keydown', keydownHandler);

    // Game loop
    function gameLoop() {
        if (!gameRunning) return;

        // ===== CALCULATE NEXT POSITIONS FIRST =====
        // Calculate player next position
        let playerNewX = cycleX;
        let playerNewY = cycleY;

        switch (direction) {
            case 'up':
                playerNewY--;
                break;
            case 'down':
                playerNewY++;
                break;
            case 'left':
                playerNewX--;
                break;
            case 'right':
                playerNewX++;
                break;
        }

        // Calculate AI next position (if AI is alive)
        let aiNewX = aiCycleX;
        let aiNewY = aiCycleY;

        if (aiAlive) {
            // AI decision making
            makeAIDecision();

            switch (aiDirection) {
                case 'up':
                    aiNewY--;
                    break;
                case 'down':
                    aiNewY++;
                    break;
                case 'left':
                    aiNewX--;
                    break;
                case 'right':
                    aiNewX++;
                    break;
            }
        }

        // ===== ADVANCED COLLISION DETECTION =====
        // Check for player cutting off AI (player advantage - signature TRON move!)
        if (aiAlive && playerNewX === aiNewX && playerNewY === aiNewY) {
            // Both moving to same position - determine who gets there "first" based on strategic advantage
            // In TRON, the player who makes the cutting move (crossing opponent's path) wins

            // Calculate if player is making a strategic cut-off move
            const playerIsParallel = (
                (direction === 'up' || direction === 'down') && (aiDirection === 'left' || aiDirection === 'right') ||
                (direction === 'left' || direction === 'right') && (aiDirection === 'up' || aiDirection === 'down')
            );

            // If player is moving perpendicular to AI and intersecting their path, player wins!
            // Player successfully cuts off AI! This is the classic TRON victory move
            if (playerIsParallel) {

                // Create dramatic shatter effect for the defeated AI
                createCycleShatterEffect(aiLightCycle, aiCycleX, aiCycleY, false);

                aiAlive = false;
                removeAITrail();
                removePlayerTrail();

                // Bonus points for strategic victory
                score += 10000; // Extra bonus for skillful play!
                scoreDisplay.textContent = 'SCORE: ' + score;

                // Increment AI defeated counter and increase speed
                aiDefeatedCount++;
                let newSpeed = Math.max(10, gameSpeed - 10);
                let speedIncreased = false;

                if (newSpeed < gameSpeed) {
                    gameSpeed = newSpeed;
                    clearInterval(gameInterval);
                    gameInterval = setInterval(gameLoop, gameSpeed);
                    speedIncreased = true;
                }

                // Show strategic victory message
                const victoryMsg = document.createElement('div');
                victoryMsg.className = 'game-over';
                victoryMsg.style.zIndex = '2000';

                let speedMessage = speedIncreased ? '<p>SPEED INCREASED!</p>' : '';
                victoryMsg.innerHTML = `
                    <h1>LEVEL ${aiDefeatedCount}</h1>
                    <h2>STRATEGIC CUT-OFF!</h2>
                    <p>AI DEFEATED!</p>
                    <p>+10000 POINTS</p>
                    ${speedMessage}
                `;
                gameArea.appendChild(victoryMsg);

                // Create afterburner effect when speed increases
                if (speedIncreased) {
                    createAfterburnerEffect();
                }

                setTimeout(() => {
                    if (victoryMsg.parentNode) {
                        victoryMsg.parentNode.removeChild(victoryMsg);
                    }
                }, 2500);

                // Start AI respawn timer
                respawnAI();

                // Continue with player movement
            } else {
                // Not a strategic move - both crash

                // Create shatter effects for both cycles
                createCycleShatterEffect(lightCycle, cycleX, cycleY, true);
                createCycleShatterEffect(aiLightCycle, aiCycleX, aiCycleY, false);

                gameRunning = false;
                clearInterval(gameInterval);
                lightCycle.classList.add('flash');
                lightCycle.style.backgroundColor = '#ff0000';
                aiLightCycle.style.backgroundColor = '#ff0000';

                setTimeout(() => {
                    const gameOverDiv = document.createElement('div');
                    gameOverDiv.className = 'game-over';
                    gameOverDiv.innerHTML = `
                        <h1>GAME OVER!</h1>
                        <h2>Final Score: ${score}</h2>
                        <p>Press Enter to play again</p>
                        <p style="margin-top:40px;font-size:14px;">Collision at same position!</p>
                    `;
                    gameArea.appendChild(gameOverDiv);
                }, 1000);
                return;
            }
        }

        // Check if player and AI are moving into each other's positions (head-to-head)
        if (aiAlive && playerNewX === aiCycleX && playerNewY === aiCycleY &&
            aiNewX === cycleX && aiNewY === cycleY) {
            // True head-to-head collision - both crash

            // Create shatter effects for both cycles
            createCycleShatterEffect(lightCycle, cycleX, cycleY, true);
            createCycleShatterEffect(aiLightCycle, aiCycleX, aiCycleY, false);

            gameRunning = false;
            clearInterval(gameInterval);
            lightCycle.classList.add('flash');
            lightCycle.style.backgroundColor = '#ff0000';
            aiLightCycle.style.backgroundColor = '#ff0000';

            setTimeout(() => {
                const gameOverDiv = document.createElement('div');
                gameOverDiv.className = 'game-over';
                gameOverDiv.innerHTML = `
                    <h1>GAME OVER!</h1>
                    <h2>Final Score: ${score}</h2>
                    <p>Press Enter to play again</p>
                    <p style="margin-top:40px;font-size:14px;">Head-to-head collision!</p>
                `;
                gameArea.appendChild(gameOverDiv);
            }, 1000);
            return;
        }

        // ===== PLAYER LOGIC =====
        // Leave trail at current position
        if (grid[cycleY][cycleX] === 0) {
            grid[cycleY][cycleX] = 2;
            drawTrail(cycleX, cycleY);
            score += 10;
            scoreDisplay.textContent = 'SCORE: ' + score;
        }

        // Check player collision (walls, boundaries, trails)
        if (playerNewX < 0 || playerNewX >= gameWidth || playerNewY < 0 || playerNewY >= gameHeight || grid[playerNewY][playerNewX] !== 0) {
            // Game over - create shatter effect for player
            createCycleShatterEffect(lightCycle, cycleX, cycleY, true);

            gameRunning = false;
            clearInterval(gameInterval);
            lightCycle.classList.add('flash');
            lightCycle.style.backgroundColor = '#ff0000';

            let gameOverMessage = 'You crashed!';
            if (grid[playerNewY] && grid[playerNewY][playerNewX] === 3) {
                gameOverMessage = 'You hit the AI opponent!';
            } else if (grid[playerNewY] && grid[playerNewY][playerNewX] === 2) {
                gameOverMessage = 'You hit your own trail!';
            } else if (grid[playerNewY] && grid[playerNewY][playerNewX] === 1) {
                gameOverMessage = 'You hit a wall!';
            }

            setTimeout(() => {
                const gameOverDiv = document.createElement('div');
                gameOverDiv.className = 'game-over';
                gameOverDiv.innerHTML = `
                    <h1>GAME OVER!</h1>
                    <h2>Final Score: ${score}</h2>
                    <p>Press Enter to play again</p>
                    <p style="margin-top:40px;font-size:14px;">${gameOverMessage}</p>
                `;
                gameArea.appendChild(gameOverDiv);
            }, 1000);
            return;
        }

        // Update player position
        cycleX = playerNewX;
        cycleY = playerNewY;
        updateCyclePosition();

        // ===== AI LOGIC =====
        if (aiAlive) {
            // Leave AI trail at current position
            if (grid[aiCycleY][aiCycleX] === 0) {
                grid[aiCycleY][aiCycleX] = 3;
                drawAITrail(aiCycleX, aiCycleY);
                score += 5; // Bonus points for surviving AI
                scoreDisplay.textContent = 'SCORE: ' + score;
            }

            // Check AI collision (walls, boundaries, trails)
            if (aiNewX < 0 || aiNewX >= gameWidth || aiNewY < 0 || aiNewY >= gameHeight || grid[aiNewY][aiNewX] !== 0) {
                // AI crashed! Create shatter effect for AI
                createCycleShatterEffect(aiLightCycle, aiCycleX, aiCycleY, false);

                aiAlive = false;
                removeAITrail();
                removePlayerTrail();

                // Bonus points for outlasting AI
                score += 5000;
                scoreDisplay.textContent = 'SCORE: ' + score;

                // Increment AI defeated counter and increase speed
                aiDefeatedCount++;
                let newSpeed = Math.max(10, gameSpeed - 10); // Reduce by 10ms each victory, minimum 10ms
                let speedIncreased = false;

                if (newSpeed < gameSpeed) {
                    gameSpeed = newSpeed;
                    clearInterval(gameInterval);
                    gameInterval = setInterval(gameLoop, gameSpeed);
                    speedIncreased = true;
                }

                // Show victory message briefly
                const victoryMsg = document.createElement('div');
                victoryMsg.className = 'game-over';
                victoryMsg.style.zIndex = '2000';

                let speedMessage = speedIncreased ? '<p>SPEED INCREASED!</p>' : '';
                victoryMsg.innerHTML = `
                    <h1>LEVEL ${aiDefeatedCount}</h1>
                    <h2>AI DEFEATED!</h2>
                    <p>+5000 POINTS</p>
                    ${speedMessage}
                `;
                gameArea.appendChild(victoryMsg);

                // Create afterburner effect when speed increases
                if (speedIncreased) {
                    createAfterburnerEffect();
                }

                setTimeout(() => {
                    if (victoryMsg.parentNode) {
                        victoryMsg.parentNode.removeChild(victoryMsg);
                    }
                }, 2000);

                // Start AI respawn timer
                respawnAI();
            } else {
                // Update AI position
                aiCycleX = aiNewX;
                aiCycleY = aiNewY;
                updateAICyclePosition();
            }
        }
    }

    // Start game
    updateCyclePosition();
    updateAICyclePosition();
    let gameInterval = setInterval(gameLoop, gameSpeed); // Start with initial speed

    // Store game state on window for cleanup when game stops
    window.tronGameState = {
        gameInterval: gameInterval,
        keydownHandler: keydownHandler,
        gameRunning: function() { return gameRunning; }
    };

    // Add game instructions
    const instructions = document.createElement('div');
    instructions.className = 'instructions game-ui';
    instructions.innerHTML = 'TRON Light Cycle - Defeat the AI opponent!';
    gameArea.appendChild(instructions);
};

// Stop/cleanup the TRON game
window.tronGameStop = function() {
    if (window.tronGameState) {
        clearInterval(window.tronGameState.gameInterval);
        document.removeEventListener('keydown', window.tronGameState.keydownHandler);
        window.tronGameState = null;
    }
};