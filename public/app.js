/**
 * Tile-Swap Puzzle Game
 *
 * A browser-based puzzle game where users swap tiles to reconstruct an image.
 * Audio is revealed only after puzzle completion as a reward.
 */

(function () {
    'use strict';

    // ========================================
    // Game State
    // ========================================
    const state = {
        levels: [],           // Array of level names
        currentLevelIndex: 0, // Current level index
        currentLevel: null,   // Current level data { level, image, audio }
        gridSize: 3,          // Current grid size (N x N)
        tiles: [],            // Array of tile data
        selectedTile: null,   // Index of currently selected tile
        isSolved: false,      // Puzzle solved state
        originalImage: null,  // Original loaded image
        audioElement: null    // Audio element (created only on solve)
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        loadingScreen: document.getElementById('loading-screen'),
        errorScreen: document.getElementById('error-screen'),
        welcomeScreen: document.getElementById('welcome-screen'),
        gameScreen: document.getElementById('game-screen'),
        completionScreen: document.getElementById('completion-screen'),
        finalScreen: document.getElementById('final-screen'),
        errorMessage: document.getElementById('error-message'),
        retryBtn: document.getElementById('retry-btn'),
        startBtn: document.getElementById('start-btn'),
        progressText: document.getElementById('progress-text'),
        puzzleContainer: document.getElementById('puzzle-container'),
        hintText: document.getElementById('hint-text'),
        completedImageContainer: document.getElementById('completed-image-container'),
        replayBtn: document.getElementById('replay-btn'),
        nextBtn: document.getElementById('next-btn'),
        restartBtn: document.getElementById('restart-btn')
    };

    // ========================================
    // Utility Functions
    // ========================================

    /**
     * Show a specific screen and hide all others
     */
    function showScreen(screenElement) {
        const screens = [
            elements.loadingScreen,
            elements.errorScreen,
            elements.welcomeScreen,
            elements.gameScreen,
            elements.completionScreen,
            elements.finalScreen
        ];

        screens.forEach(screen => {
            if (screen === screenElement) {
                screen.classList.remove('hidden');
            } else {
                screen.classList.add('hidden');
            }
        });
    }

    /**
     * Show error screen with message
     */
    function showError(message) {
        elements.errorMessage.textContent = message;
        showScreen(elements.errorScreen);
    }

    /**
     * Calculate grid size based on level index
     * level_1 = 3x3, level_2 = 4x4, level_3+ increases gradually
     */
    function calculateGridSize(levelIndex) {
        const baseSize = 3;
        const maxSize = 6;
        return Math.min(baseSize + levelIndex, maxSize);
    }

    /**
     * Fisher-Yates shuffle algorithm with solvability check
     * Ensures the puzzle is always solvable
     */
    function shuffleTiles(tiles) {
        const n = tiles.length;
        const shuffled = [...tiles];

        // Perform Fisher-Yates shuffle
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Count inversions to check solvability
        let inversions = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (shuffled[i].originalIndex > shuffled[j].originalIndex) {
                    inversions++;
                }
            }
        }

        // For odd grid size, inversions must be even
        // For even grid size, (inversions + blank row from bottom) must be even
        // Since we don't have a blank tile, just ensure even inversions
        if (inversions % 2 !== 0) {
            // Swap first two elements to make solvable
            [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        }

        return shuffled;
    }

    /**
     * Check if puzzle is solved
     */
    function checkSolved() {
        return state.tiles.every((tile, index) => tile.originalIndex === index);
    }

    // ========================================
    // API Functions
    // ========================================

    /**
     * Fetch list of available levels from server
     */
    async function fetchLevels() {
        const response = await fetch('/api/levels');
        if (!response.ok) {
            throw new Error('Failed to load levels');
        }
        const data = await response.json();
        if (!data.levels || data.levels.length === 0) {
            throw new Error('No levels found. Please add levels to the /levels folder.');
        }
        return data.levels;
    }

    /**
     * Fetch level data (image and audio file names)
     */
    async function fetchLevelData(levelName) {
        const response = await fetch(`/api/levels/${levelName}`);
        if (!response.ok) {
            throw new Error(`Failed to load level: ${levelName}`);
        }
        return response.json();
    }

    /**
     * Load image from URL and return as Image element
     */
    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    // ========================================
    // Puzzle Functions
    // ========================================

    /**
     * Create tile canvases from the original image
     */
    function createTiles(image, gridSize) {
        const tiles = [];
        const tileWidth = image.width / gridSize;
        const tileHeight = image.height / gridSize;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const canvas = document.createElement('canvas');
                canvas.width = tileWidth;
                canvas.height = tileHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(
                    image,
                    col * tileWidth,
                    row * tileHeight,
                    tileWidth,
                    tileHeight,
                    0,
                    0,
                    tileWidth,
                    tileHeight
                );

                const index = row * gridSize + col;
                tiles.push({
                    originalIndex: index,
                    canvas: canvas
                });
            }
        }

        return tiles;
    }

    /**
     * Render puzzle tiles to the container
     */
    function renderPuzzle() {
        const container = elements.puzzleContainer;
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${state.gridSize}, 1fr)`;
        container.classList.remove('locked');

        state.tiles.forEach((tile, currentIndex) => {
            const tileElement = document.createElement('div');
            tileElement.className = 'puzzle-tile';
            tileElement.dataset.index = currentIndex;
            tileElement.appendChild(tile.canvas.cloneNode(true));

            // Draw the canvas content
            const canvas = tileElement.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tile.canvas, 0, 0);

            // Check if tile is in correct position
            if (tile.originalIndex === currentIndex) {
                tileElement.classList.add('correct');
            }

            // Add click handler
            tileElement.addEventListener('click', () => handleTileClick(currentIndex));

            // Add keyboard support
            tileElement.tabIndex = 0;
            tileElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTileClick(currentIndex);
                }
            });

            container.appendChild(tileElement);
        });
    }

    /**
     * Handle tile click/selection
     */
    function handleTileClick(index) {
        if (state.isSolved) return;

        const tiles = elements.puzzleContainer.querySelectorAll('.puzzle-tile');

        if (state.selectedTile === null) {
            // First tile selected
            state.selectedTile = index;
            tiles[index].classList.add('selected');
            elements.hintText.textContent = 'Now tap another tile to swap';
        } else if (state.selectedTile === index) {
            // Same tile clicked, deselect
            state.selectedTile = null;
            tiles[index].classList.remove('selected');
            elements.hintText.textContent = 'Tap two tiles to swap them';
        } else {
            // Second tile selected, perform swap
            swapTiles(state.selectedTile, index);
            tiles[state.selectedTile].classList.remove('selected');
            state.selectedTile = null;
            elements.hintText.textContent = 'Tap two tiles to swap them';

            // Check if puzzle is solved
            if (checkSolved()) {
                handlePuzzleSolved();
            }
        }
    }

    /**
     * Swap two tiles
     */
    function swapTiles(indexA, indexB) {
        // Swap in state
        [state.tiles[indexA], state.tiles[indexB]] = [state.tiles[indexB], state.tiles[indexA]];

        // Add swap animation
        const tiles = elements.puzzleContainer.querySelectorAll('.puzzle-tile');
        tiles[indexA].classList.add('swapping');
        tiles[indexB].classList.add('swapping');

        // Re-render after animation
        setTimeout(() => {
            renderPuzzle();
        }, 150);
    }

    /**
     * Handle puzzle completion
     */
    function handlePuzzleSolved() {
        state.isSolved = true;

        // Lock the puzzle
        elements.puzzleContainer.classList.add('locked');
        elements.hintText.textContent = 'Puzzle complete!';

        // Short delay before showing completion screen
        setTimeout(() => {
            showCompletionScreen();
        }, 500);
    }

    /**
     * Show completion screen with audio reveal
     */
    function showCompletionScreen() {
        // Display the completed image
        elements.completedImageContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = state.originalImage.src;
        img.alt = 'Completed puzzle';
        elements.completedImageContainer.appendChild(img);

        // Update next button text based on remaining levels
        if (state.currentLevelIndex >= state.levels.length - 1) {
            elements.nextBtn.textContent = 'Finish';
        } else {
            elements.nextBtn.textContent = 'Next Memory';
        }

        // Show completion screen
        showScreen(elements.completionScreen);

        // Create and play audio ONLY now (after puzzle is solved)
        createAndPlayAudio();
    }

    /**
     * Create audio element dynamically and auto-play
     * Audio is NEVER loaded until puzzle is solved
     */
    function createAndPlayAudio() {
        // Clean up any existing audio
        if (state.audioElement) {
            state.audioElement.pause();
            state.audioElement.src = '';
            state.audioElement = null;
        }

        // Create new audio element
        const audio = document.createElement('audio');
        const audioUrl = `/levels/${state.currentLevel.level}/${state.currentLevel.audio}`;
        audio.src = audioUrl;
        audio.preload = 'auto';

        // Store reference
        state.audioElement = audio;

        // Auto-play when loaded
        audio.addEventListener('canplaythrough', () => {
            audio.play().catch(err => {
                console.log('Auto-play prevented, user can click replay:', err);
            });
        }, { once: true });

        // Load the audio
        audio.load();
    }

    // ========================================
    // Level Management
    // ========================================

    /**
     * Load and start a level
     */
    async function loadLevel(levelIndex) {
        try {
            showScreen(elements.loadingScreen);

            // Fetch level data
            const levelName = state.levels[levelIndex];
            const levelData = await fetchLevelData(levelName);
            state.currentLevel = levelData;
            state.currentLevelIndex = levelIndex;

            // Update progress text
            elements.progressText.textContent = `Memory ${levelIndex + 1} of ${state.levels.length}`;

            // Calculate grid size for this level
            state.gridSize = calculateGridSize(levelIndex);

            // Load the image
            const imageUrl = `/levels/${levelData.level}/${levelData.image}`;
            state.originalImage = await loadImage(imageUrl);

            // Create and shuffle tiles
            const tiles = createTiles(state.originalImage, state.gridSize);
            state.tiles = shuffleTiles(tiles);

            // Reset game state
            state.selectedTile = null;
            state.isSolved = false;

            // Clean up any audio from previous level
            if (state.audioElement) {
                state.audioElement.pause();
                state.audioElement.src = '';
                state.audioElement = null;
            }

            // Render puzzle and show game screen
            renderPuzzle();
            showScreen(elements.gameScreen);
            elements.hintText.textContent = 'Tap two tiles to swap them';

        } catch (error) {
            console.error('Error loading level:', error);
            showError(`Failed to load level: ${error.message}`);
        }
    }

    /**
     * Proceed to next level or show final screen
     */
    function nextLevel() {
        if (state.currentLevelIndex >= state.levels.length - 1) {
            // All levels complete
            showScreen(elements.finalScreen);
        } else {
            // Load next level
            loadLevel(state.currentLevelIndex + 1);
        }
    }

    /**
     * Restart from first level
     */
    function restart() {
        state.currentLevelIndex = 0;
        loadLevel(0);
    }

    // ========================================
    // Initialization
    // ========================================

    /**
     * Initialize the game
     */
    async function init() {
        try {
            showScreen(elements.loadingScreen);

            // Fetch available levels
            state.levels = await fetchLevels();

            // Show welcome screen
            showScreen(elements.welcomeScreen);

        } catch (error) {
            console.error('Initialization error:', error);
            showError(error.message || 'Failed to initialize game');
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Start button
        elements.startBtn.addEventListener('click', () => {
            loadLevel(0);
        });

        // Retry button
        elements.retryBtn.addEventListener('click', () => {
            init();
        });

        // Replay audio button
        elements.replayBtn.addEventListener('click', () => {
            if (state.audioElement) {
                state.audioElement.currentTime = 0;
                state.audioElement.play().catch(err => {
                    console.log('Replay failed:', err);
                });
            }
        });

        // Next button
        elements.nextBtn.addEventListener('click', () => {
            // Stop audio before moving to next level
            if (state.audioElement) {
                state.audioElement.pause();
            }
            nextLevel();
        });

        // Restart button
        elements.restartBtn.addEventListener('click', () => {
            restart();
        });
    }

    // ========================================
    // Start Application
    // ========================================
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        init();
    });

})();
