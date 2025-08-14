        // Game variables
        let bird, pipes = [];
        let score = 0, bestScore = localStorage.getItem('flappySkyHighScore') || 38;
        let gameSpeed = 1.4;
        let gravity = 0.18;
        let jumpForce = -4.5;
        let birdVelocity = 1;
        let gameRunning = false, gameStarted = false, gamePaused = false;
        let pipeGap = 200;
        let pipeFrequency = 1800;
        let lastPipeTime = 0;
        let lastJumpTime = 0;
        const jumpCooldown = 100;
        
        // Sound settings
        let soundEnabled = true;
        let musicEnabled = true;
        
        // Theme settings
        let isDayMode = true;
        
        // Player name
        let playerName = localStorage.getItem('flappySkyPlayerName') || 'Ahzam';
        
        // DOM elements
        const appContainer = document.getElementById('app-container');
        const homeScreen = document.getElementById('home-screen');
        const settingsScreen = document.getElementById('settings-screen');
        const gameContainer = document.getElementById('game-container');
        const scoreScreen = document.getElementById('score-screen');
        const modeSwitch = document.getElementById('mode-switch');
        
        const highScoreValue = document.getElementById('high-score-value');
        const playBtn = document.getElementById('play-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        const returnBtn = document.getElementById('return-btn');
        const soundToggle = document.getElementById('sound-toggle');
        const musicToggle = document.getElementById('music-toggle');
        const usernameInput = document.getElementById('username-input');
        const updateUsernameBtn = document.getElementById('update-username-btn');
        const playerNameDisplay = document.getElementById('player-name-display');
        
        const birdElement = document.getElementById('bird');
        const scoreDisplay = document.getElementById('score-display');
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreDisplay = document.getElementById('final-score');
        const restartBtn = document.getElementById('restart-btn');
        const homeBtn = document.getElementById('home-btn');
        const finalHighScore = document.getElementById('final-high-score');
        const okBtn = document.getElementById('ok-btn');
        
        // Pause elements - NEW
        const pauseBtn = document.getElementById('pause-btn');
        const pauseScreen = document.getElementById('pause-screen');
        const resumeBtn = document.getElementById('resume-btn');
        const restartFromPauseBtn = document.getElementById('restart-from-pause-btn');
        const homeFromPauseBtn = document.getElementById('home-from-pause-btn');
        
        // Sound elements
        const sounds = {
            flap: document.getElementById('flapSound'),
            hit: document.getElementById('hitSound'),
            die: document.getElementById('dieSound'),
            score: document.getElementById('scoreSound'),
            music: document.getElementById('bgMusic')
        };
        
        // Initialize the game
        function init() {
            // Check for saved theme preference
            if (localStorage.getItem('flappySkyTheme') === 'night') {
                isDayMode = false;
                if (!isDayMode) {
                    toggleDayNightMode(); // Apply night mode
                }
            }
            
            // Create stars for night mode
            initializeStars();
            
            // Load settings from localStorage
            if (localStorage.getItem('soundEnabled') !== null) {
                soundEnabled = localStorage.getItem('soundEnabled') === 'true';
                soundToggle.checked = soundEnabled;
            }
            
            if (localStorage.getItem('musicEnabled') !== null) {
                musicEnabled = localStorage.getItem('musicEnabled') === 'true';
                musicToggle.checked = musicEnabled;
                if (musicEnabled) sounds.music.play().catch(e => {});
            }
            
            // Load player name
            if (localStorage.getItem('flappySkyPlayerName')) {
                playerName = localStorage.getItem('flappySkyPlayerName');
            }
            usernameInput.value = playerName;
            playerNameDisplay.textContent = playerName;
            
            highScoreValue.textContent = bestScore;
            finalHighScore.textContent = bestScore;
            
            // Set bird initial position
            bird = {
                x: 100,
                y: gameContainer.offsetHeight / 2,
                width: 40,
                height: 30
            };
            
            updateBirdPosition();
            setupEventListeners();
        }
        
        // Setup all event listeners
        function setupEventListeners() {
            // Home screen buttons
            playBtn.addEventListener('click', startGame);
            settingsBtn.addEventListener('click', showSettings);
            
            // Settings screen buttons
            backToMenuBtn.addEventListener('click', hideSettings);
            returnBtn.addEventListener('click', hideSettings); // NEW
            soundToggle.addEventListener('change', toggleSound);
            musicToggle.addEventListener('change', toggleMusic);
            updateUsernameBtn.addEventListener('click', updateUsername);
            
            // Game controls
            restartBtn.addEventListener('click', restartGame);
            homeBtn.addEventListener('click', returnToHome);
            okBtn.addEventListener('click', hideScoreScreen);
            
            // Pause controls - NEW
            pauseBtn.addEventListener('click', pauseGame);
            resumeBtn.addEventListener('click', resumeGame);
            restartFromPauseBtn.addEventListener('click', restartFromPause);
            homeFromPauseBtn.addEventListener('click', returnToHomeFromPause);
            
            // Mode switch
            modeSwitch.addEventListener('click', toggleDayNightMode);
            
            // Keyboard controls
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (gameRunning && !gamePaused) {
                        handleJump();
                    } else if (gameContainer.style.display === 'block' && !gamePaused) {
                        // Start game if not running but game container is visible
                        startGame();
                    }
                }
                
                // Pause/resume with 'P' key - NEW
                if (e.code === 'KeyP' && gameStarted) {
                    if (gamePaused) {
                        resumeGame();
                    } else {
                        pauseGame();
                    }
                }
                
                // Return to home with 'Escape' key from settings - NEW
                if (e.code === 'Escape' && settingsScreen.style.display === 'flex') {
                    hideSettings();
                }
            });
            
            // Touch support for mobile
            gameContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameRunning && !gamePaused) {
                    handleJump();
                } else if (gameContainer.style.display === 'block' && !gamePaused) {
                    // Start game if not running but game container is visible
                    startGame();
                }
            });
            
            // Share button functionality
            document.getElementById('share-btn')?.addEventListener('click', () => {
                const shareText = `I scored ${score} points in Flappy Sky! Can you beat my score?`;
                const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                window.open(shareUrl, '_blank');
            });
        }
        
        // Update player username
        function updateUsername() {
            const newName = usernameInput.value.trim();
            if (newName && newName !== playerName) {
                playerName = newName;
                localStorage.setItem('flappySkyPlayerName', playerName);
                playerNameDisplay.textContent = playerName;
                
                // Show success feedback
                alert(`Player name updated to: ${playerName}`);
            }
        }
        
        // Show settings screen
        function showSettings() {
            homeScreen.style.display = 'none';
            settingsScreen.style.display = 'flex';
        }
        
        // Hide settings screen
        function hideSettings() {
            settingsScreen.style.display = 'none';
            homeScreen.style.display = 'flex';
        }
        
        // Toggle sound effects
        function toggleSound() {
            soundEnabled = soundToggle.checked;
            localStorage.setItem('soundEnabled', soundEnabled);
        }
        
        // Toggle background music
        function toggleMusic() {
            musicEnabled = musicToggle.checked;
            localStorage.setItem('musicEnabled', musicEnabled);
            
            if (musicEnabled) {
                sounds.music.play().catch(e => {});
            } else {
                sounds.music.pause();
            }
        }
        
        // Start game
        function startGame() {
            homeScreen.style.display = 'none';
            settingsScreen.style.display = 'none';
            scoreScreen.style.display = 'none';
            gameContainer.style.display = 'block';
            gameOverScreen.style.display = 'none';
            pauseScreen.style.display = 'none'; // NEW
            
            gameStarted = true;
            gameRunning = true;
            gamePaused = false; // NEW
            
            score = 0;
            scoreDisplay.textContent = score;
            pipes = [];
            birdVelocity = 0;
            bird.y = gameContainer.offsetHeight / 2;
            updateBirdPosition();
            
            // Clear existing pipes
            document.querySelectorAll('.pipe').forEach(pipe => pipe.remove());
            
            lastPipeTime = Date.now();
            requestAnimationFrame(gameLoop);
            
            // Play music if enabled
            if (musicEnabled) {
                sounds.music.currentTime = 0;
                sounds.music.play().catch(e => {});
            }
        }
        
        // Pause game - NEW
        function pauseGame() {
            if (!gameStarted || !gameRunning) return;
            
            gamePaused = true;
            gameRunning = false;
            pauseScreen.style.display = 'flex';
            
            // Pause music
            if (musicEnabled) {
                sounds.music.pause();
            }
        }
        
        // Resume game - NEW
        function resumeGame() {
            if (!gameStarted || !gamePaused) return;
            
            pauseScreen.style.display = 'none';
            gamePaused = false;
            gameRunning = true;
            
            // Resume music
            if (musicEnabled) {
                sounds.music.play().catch(e => {});
            }
            
            // Continue game loop
            lastPipeTime = Date.now();
            requestAnimationFrame(gameLoop);
        }
        
        // Restart from pause - NEW
        function restartFromPause() {
            pauseScreen.style.display = 'none';
            startGame();
        }
        
        // Return to home from pause - NEW
        function returnToHomeFromPause() {
            pauseScreen.style.display = 'none';
            gameContainer.style.display = 'none';
            homeScreen.style.display = 'flex';
            
            gameStarted = false;
            gameRunning = false;
            gamePaused = false;
            
            // Pause music
            sounds.music.pause();
        }
        
        // Main game loop
        function gameLoop() {
            if (!gameRunning) return;
            
            // Update bird physics
            birdVelocity += gravity;
            bird.y += birdVelocity;
            
            // Check collisions with ground/ceiling
            if (bird.y + bird.height > gameContainer.offsetHeight - 60) {
                bird.y = gameContainer.offsetHeight - 60 - bird.height;
                playSound(sounds.hit);
                playSound(sounds.die);
                gameOver();
            }
            
            if (bird.y < 0) {
                bird.y = 0;
                playSound(sounds.hit);
                gameOver();
            }
            
            updateBirdPosition();
            
            // Generate new pipes
            const currentTime = Date.now();
            if (currentTime - lastPipeTime > pipeFrequency) {
                createPipe();
                lastPipeTime = currentTime;
            }
            
            movePipes();
            requestAnimationFrame(gameLoop);
        }
        
        // Update bird position with smooth rotation
        function updateBirdPosition() {
            birdElement.style.top = `${bird.y}px`;
            birdElement.style.left = `${bird.x}px`;
            
            // Natural rotation based on velocity
            let rotation = birdVelocity * 2.5;
            rotation = Math.max(-25, Math.min(90, rotation));
            birdElement.style.transform = `rotate(${rotation}deg)`;
        }
        
        // Handle jump with perfect response
        function handleJump() {
            const now = Date.now();
            if (gameRunning && now - lastJumpTime > jumpCooldown) {
                birdVelocity = jumpForce;
                lastJumpTime = now;
                playSound(sounds.flap);
                
                // Small visual feedback
                birdElement.style.transition = 'transform 0.1s ease-out';
                setTimeout(() => {
                    birdElement.style.transition = '';
                }, 100);
            }
        }
        
        // Create pipes with better distribution
        function createPipe() {
            const minHeight = 80;
            const maxHeight = gameContainer.offsetHeight - pipeGap - minHeight - 20;
            const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            
            // Top pipe
            const topPipe = document.createElement('div');
            topPipe.className = 'pipe';
            topPipe.style.height = `${height}px`;
            topPipe.style.top = '0';
            topPipe.style.left = `${gameContainer.offsetWidth}px`;
            gameContainer.appendChild(topPipe);
            
            // Bottom pipe
            const bottomPipe = document.createElement('div');
            bottomPipe.className = 'pipe';
            bottomPipe.style.height = `${gameContainer.offsetHeight - height - pipeGap - 20}px`;
            bottomPipe.style.bottom = '20px';
            bottomPipe.style.left = `${gameContainer.offsetWidth}px`;
            gameContainer.appendChild(bottomPipe);
            
            pipes.push({
                top: topPipe,
                bottom: bottomPipe,
                x: gameContainer.offsetWidth,
                width: 65,
                topHeight: height,
                bottomHeight: gameContainer.offsetHeight - height - pipeGap - 20,
                passed: false
            });
        }
        
        // Move pipes with collision detection
        function movePipes() {
            for (let i = 0; i < pipes.length; i++) {
                const pipe = pipes[i];
                pipe.x -= gameSpeed;
                
                pipe.top.style.left = `${pipe.x}px`;
                pipe.bottom.style.left = `${pipe.x}px`;
                
                // Check if bird passed the pipe
                if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                    pipe.passed = true;
                    score++;
                    scoreDisplay.textContent = score;
                    playSound(sounds.score);
                    
                    // Gradual difficulty increase
                    if (score % 5 === 0) {
                        gameSpeed += 0.1;
                        pipeFrequency = Math.max(1400, pipeFrequency - 20);
                    }
                }
                
                // Precise collision detection
                if (
                    bird.x + bird.width - 2 > pipe.x &&
                    bird.x + 2 < pipe.x + pipe.width &&
                    (bird.y + 2 < pipe.topHeight || bird.y + bird.height - 2 > gameContainer.offsetHeight - pipe.bottomHeight - 60)
                ) {
                    playSound(sounds.hit);
                    gameOver();
                }
                
                // Remove off-screen pipes
                if (pipe.x + pipe.width < 0) {
                    pipe.top.remove();
                    pipe.bottom.remove();
                    pipes.splice(i, 1);
                    i--;
                }
            }
        }
        
        // Play sound with error handling
        function playSound(sound) {
            if (!soundEnabled) return;
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Sound play prevented:", e));
        }
        
        // Game over with effects
        function gameOver() {
            gameRunning = false;
            gameStarted = false;
            gamePaused = false;
            
            // Pause music
            sounds.music.pause();
            
            // Update best score
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('flappySkyHighScore', bestScore);
                highScoreValue.textContent = bestScore;
                finalHighScore.textContent = bestScore;
                
                // Show high score screen
                showScoreScreen();
            } else {
                // Show regular game over
                finalScoreDisplay.textContent = `Score: ${score}`;
                gameOverScreen.style.display = 'flex';
            }
        }
        
        // Show high score screen
        function showScoreScreen() {
            gameContainer.style.display = 'none';
            scoreScreen.style.display = 'flex';
        }
        
        // Hide high score screen
        function hideScoreScreen() {
            scoreScreen.style.display = 'none';
            homeScreen.style.display = 'flex';
        }
        
        // Restart game
        function restartGame() {
            gameOverScreen.style.display = 'none';
            startGame();
        }
        
        // Return to home screen
        function returnToHome() {
            gameContainer.style.display = 'none';
            gameOverScreen.style.display = 'none';
            homeScreen.style.display = 'flex';
            
            // Pause music
            sounds.music.pause();
        }
        
        // Toggle day/night mode
        function toggleDayNightMode() {
            isDayMode = !isDayMode;
            
            // Update body class
            document.body.classList.toggle('day-mode', isDayMode);
            document.body.classList.toggle('night-mode', !isDayMode);
            
            // Update screens
            homeScreen.classList.toggle('day-mode', isDayMode);
            homeScreen.classList.toggle('night-mode', !isDayMode);
            
            settingsScreen.classList.toggle('day-mode', isDayMode);
            settingsScreen.classList.toggle('night-mode', !isDayMode);
            
            gameOverScreen.classList.toggle('day-mode', isDayMode);
            gameOverScreen.classList.toggle('night-mode', !isDayMode);
            
            scoreScreen.classList.toggle('day-mode', isDayMode);
            scoreScreen.classList.toggle('night-mode', !isDayMode);
            
            pauseScreen.classList.toggle('day-mode', isDayMode);
            pauseScreen.classList.toggle('night-mode', !isDayMode);
            
            // Update game elements
            document.getElementById('background').classList.toggle('day-mode', isDayMode);
            document.getElementById('background').classList.toggle('night-mode', !isDayMode);
            
            document.getElementById('foreground').classList.toggle('day-mode', isDayMode);
            document.getElementById('foreground').classList.toggle('night-mode', !isDayMode);
            
            // Update icon
            modeSwitch.innerHTML = isDayMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            
            // Save preference
            localStorage.setItem('flappySkyTheme', isDayMode ? 'day' : 'night');
            
            // Show/hide stars
            const starsContainer = document.querySelector('.stars');
            if (starsContainer) {
                starsContainer.style.display = isDayMode ? 'none' : 'block';
            }
        }
        
        // Create stars for night mode
        function initializeStars() {
            const starsContainer = document.createElement('div');
            starsContainer.className = 'stars';
            starsContainer.style.display = isDayMode ? 'none' : 'block';
            
            // Add stars
            for (let i = 0; i < 50; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                
                // Random size
                const size = Math.random() * 3 + 1;
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
                
                // Random position
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                
                // Random animation
                star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
                star.style.setProperty('--delay', `${Math.random() * 5}s`);
                
                starsContainer.appendChild(star);
            }
            
            gameContainer.appendChild(starsContainer);
        }
        
        // Initialize the game
        window.onload = () => {
            init();
            scoreScreen.style.display = 'none';
            homeScreen.style.display = 'flex';
        };