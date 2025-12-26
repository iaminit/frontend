import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';

// --- Sound Engine ---
const SoundFX = {
    ctx: null,
    init: function () {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playTone: function (freq, type, duration, vol = 0.1) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    move: function () { this.playTone(400, 'square', 0.05, 0.05); },
    rotate: function () { this.playTone(500, 'triangle', 0.05, 0.05); },
    drop: function () { this.playTone(200, 'sawtooth', 0.1, 0.08); },
    cascade: function () { this.playTone(150, 'square', 0.1, 0.05); },
    lineClear: function () {
        if (!this.ctx) this.init();
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.2, 0.1), i * 80);
        });
    }
};

// --- Game Constants & Logic ---
const COLS = 8;
const ROWS = 16;

const TETROMINOES = {
    'I': [[1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], // Sankyo Line
    'J': [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    'L': [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // Nikyo L
    'O': [[1, 1], [1, 1]],
    'S': [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    'Z': [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    'T': [[0, 1, 0], [1, 1, 1], [0, 0, 0]]
};

const GOKYO_GROUPS = {
    1: { color: '#fbbf24', name: 'Dai Ikkyo' }, // Yellow
    2: { color: '#fb923c', name: 'Dai Nikyo' }, // Orange
    3: { color: '#4ade80', name: 'Dai Sankyo' }, // Green
    4: { color: '#60a5fa', name: 'Dai Yonkyo' }, // Blue
    5: { color: '#8b4513', name: 'Dai Gokyo' }  // Brown
};

const GokyoTris = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const nextCanvasRef = useRef(null);
    const requestRef = useRef();

    // Game State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState({ ippon: 0, waza: 0, yuko: 0 });
    const [level, setLevel] = useState(1);
    const [techData, setTechData] = useState([]);
    const [currentTechInfo, setCurrentTechInfo] = useState({ name: '', kanji: '', image: '' });
    const [imageError, setImageError] = useState(false);

    // Game Logic State (Refs for performance)
    const gameState = useRef({
        playfield: [],
        tetrominoSequence: [],
        currentTetromino: null,
        nextTetromino: null,
        count: 0,
        gameSpeed: 35,
        lastTime: 0,
        score: 0, // internal score
    });

    // Load Technique Data
    useEffect(() => {
        const fetchTechniques = async () => {
            try {
                // In PocketBase, images might be stored differently. 
                // We'll try to get all techniques that have an image.
                const records = await pb.collection('techniques').getFullList({
                    filter: 'group != "" && group != "Altre"',
                    sort: '@random',
                });
                setTechData(records);
            } catch (err) {
                console.error("Failed to fetch techniques:", err);
            }
        };
        fetchTechniques();
    }, []);

    // --- Core Game Functions ---
    const generateSequence = () => {
        const sequence = ['I', 'J', 'L', 'O', 'S', 'Z', 'T'];
        while (sequence.length) {
            const rand = Math.floor(Math.random() * sequence.length);
            const name = sequence.splice(rand, 1)[0];
            gameState.current.tetrominoSequence.push(name);
        }
    };

    const getNextTetromino = useCallback(() => {
        if (gameState.current.tetrominoSequence.length === 0) {
            generateSequence();
        }
        const name = gameState.current.tetrominoSequence.pop();
        const matrix = TETROMINOES[name];
        const col = Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2);
        const row = name === 'I' ? -1 : 0;

        // Map to Gokyo
        let gokyoIndex = 1;
        switch (name) {
            case 'L': gokyoIndex = 2; break;
            case 'I': gokyoIndex = 3; break;
            case 'O': gokyoIndex = 1; break;
            case 'J': gokyoIndex = 4; break;
            case 'T': gokyoIndex = 5; break;
            case 'S': gokyoIndex = 2; break;
            case 'Z': gokyoIndex = 1; break;
            default: gokyoIndex = 1;
        }

        const groupInfo = GOKYO_GROUPS[gokyoIndex];

        // Pick a random technique from this group if available
        let tech = null;
        if (techData.length > 0) {
            const groupTechs = techData.filter(t => t.group === groupInfo.name);
            if (groupTechs.length > 0) {
                tech = groupTechs[Math.floor(Math.random() * groupTechs.length)];
            }
        }

        return {
            name,
            matrix,
            row,
            col,
            color: groupInfo.color,
            gokyoGroup: gokyoIndex,
            techData: tech
        };
    }, [techData]);

    // Rotate Matrix
    const rotate = (matrix) => {
        const N = matrix.length - 1;
        return matrix.map((row, i) =>
            row.map((val, j) => matrix[N - j][i])
        );
    };

    // Collision Detection
    const isValidMove = (matrix, cellRow, cellCol) => {
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col] && (
                    cellCol + col < 0 ||
                    cellCol + col >= COLS ||
                    cellRow + row >= ROWS ||
                    (gameState.current.playfield[cellRow + row] && gameState.current.playfield[cellRow + row][cellCol + col])
                )) {
                    return false;
                }
            }
        }
        return true;
    };

    // Place Tetromino
    const placeTetromino = () => {
        const { currentTetromino } = gameState.current;
        if (!currentTetromino) return;

        // Update playfield
        for (let row = 0; row < currentTetromino.matrix.length; row++) {
            for (let col = 0; col < currentTetromino.matrix[row].length; col++) {
                if (currentTetromino.matrix[row][col]) {
                    if (currentTetromino.row + row < 0) {
                        return showGameOver();
                    }
                    gameState.current.playfield[currentTetromino.row + row][currentTetromino.col + col] = currentTetromino.color;
                }
            }
        }

        // Check for lines
        let linesCleared = 0;
        for (let row = ROWS - 1; row >= 0;) {
            if (gameState.current.playfield[row].every(cell => !!cell)) {
                linesCleared++;
                // Remove row
                gameState.current.playfield.splice(row, 1);
                gameState.current.playfield.unshift(new Array(COLS).fill(0));
            } else {
                row--;
            }
        }

        if (linesCleared > 0) {
            SoundFX.lineClear();
            updateScore(linesCleared);
        } else {
            SoundFX.drop();
        }

        gameState.current.currentTetromino = gameState.current.nextTetromino;
        gameState.current.nextTetromino = getNextTetromino();

        // Update displayed technique
        if (gameState.current.currentTetromino.techData) {
            const t = gameState.current.currentTetromino.techData;
            // Generate image filename from name, same as Techniques.jsx
            const generatedImage = t.name.toLowerCase()
                .replace(/ /g, '-')
                .replace(/ō/g, 'o')
                .replace(/ū/g, 'u') + '.webp';

            const imgPath = t.image
                ? (t.image.startsWith('http') ? t.image : `/media/${t.image}`)
                : `/media/${generatedImage}`;

            setCurrentTechInfo({
                name: t.name,
                kanji: t.kanji || '',
                image: imgPath
            });
            setImageError(false);
        }

        drawNextPiece();
    };

    const updateScore = (lines) => {
        let newScore = { ...score };
        if (lines >= 4) newScore.ippon++;
        else if (lines >= 2) newScore.waza++;
        else newScore.yuko++;

        setScore(prev => {
            const updated = { ...prev };
            if (lines >= 4) updated.ippon++;
            else if (lines >= 2) updated.waza++;
            else updated.yuko++;
            return updated;
        });

        setLevel(prev => Math.min(prev + 1, 10));
        gameState.current.gameSpeed = Math.max(5, 35 - (level * 2));
    };

    const showGameOver = () => {
        cancelAnimationFrame(requestRef.current);
        setIsGameOver(true);
        setIsPlaying(false);
    };

    // Game Loop
    const loop = useCallback((time) => {
        if (!isPlaying) return;

        requestRef.current = requestAnimationFrame(loop);

        if (!gameState.current.lastTime) gameState.current.lastTime = time;
        gameState.current.lastTime = time;

        gameState.current.count++;

        if (gameState.current.count >= gameState.current.gameSpeed) {
            gameState.current.count = 0;

            const row = gameState.current.currentTetromino.row + 1;
            if (isValidMove(gameState.current.currentTetromino.matrix, row, gameState.current.currentTetromino.col)) {
                gameState.current.currentTetromino.row = row;
            } else {
                placeTetromino();
            }
        }

        draw();
    }, [isPlaying, getNextTetromino]);

    // Draw Function
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Scaling
        const scaleX = canvas.width / COLS;
        const scaleY = canvas.height / ROWS;

        // Draw grid background
        context.fillStyle = 'rgba(0,0,0,0.4)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        context.strokeStyle = '#ddd';
        context.lineWidth = 0.5;
        context.beginPath();
        for (let col = 0; col <= COLS; col++) {
            context.moveTo(col * scaleX, 0);
            context.lineTo(col * scaleX, canvas.height);
        }
        for (let row = 0; row <= ROWS; row++) {
            context.moveTo(0, row * scaleY);
            context.lineTo(canvas.width, row * scaleY);
        }
        context.stroke();

        // Draw playfield
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (gameState.current.playfield[row][col]) {
                    context.fillStyle = gameState.current.playfield[row][col];
                    context.fillRect(col * scaleX + 1, row * scaleY + 1, scaleX - 2, scaleY - 2);
                }
            }
        }

        // Draw active tetromino
        if (gameState.current.currentTetromino) {
            context.fillStyle = gameState.current.currentTetromino.color;
            gameState.current.currentTetromino.matrix.forEach((row, r) => {
                row.forEach((value, c) => {
                    if (value) {
                        context.fillRect(
                            (gameState.current.currentTetromino.col + c) * scaleX + 1,
                            (gameState.current.currentTetromino.row + r) * scaleY + 1,
                            scaleX - 2,
                            scaleY - 2
                        );
                    }
                });
            });
        }
    };

    const drawNextPiece = useCallback(() => {
        const canvas = nextCanvasRef.current;
        if (!canvas || !gameState.current.nextTetromino) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { matrix, color } = gameState.current.nextTetromino;
        const cellSize = 12;
        const offsetX = (canvas.width - matrix[0].length * cellSize) / 2;
        const offsetY = (canvas.height - matrix.length * cellSize) / 2;

        ctx.fillStyle = color;
        matrix.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value) {
                    ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize - 1, cellSize - 1);
                }
            });
        });
    }, []);

    // Controls
    const handleLeft = () => {
        const col = gameState.current.currentTetromino.col - 1;
        if (isValidMove(gameState.current.currentTetromino.matrix, gameState.current.currentTetromino.row, col)) {
            gameState.current.currentTetromino.col = col;
            SoundFX.move();
        }
    };

    const handleRight = () => {
        const col = gameState.current.currentTetromino.col + 1;
        if (isValidMove(gameState.current.currentTetromino.matrix, gameState.current.currentTetromino.row, col)) {
            gameState.current.currentTetromino.col = col;
            SoundFX.move();
        }
    };

    const handleRotate = () => {
        const matrix = rotate(gameState.current.currentTetromino.matrix);
        if (isValidMove(matrix, gameState.current.currentTetromino.row, gameState.current.currentTetromino.col)) {
            gameState.current.currentTetromino.matrix = matrix;
            SoundFX.rotate();
        }
    };

    const handleDrop = () => {
        const row = gameState.current.currentTetromino.row + 1;
        if (isValidMove(gameState.current.currentTetromino.matrix, row, gameState.current.currentTetromino.col)) {
            gameState.current.currentTetromino.row = row;
        }
    };

    // Start Game
    const startGame = () => {
        SoundFX.init();
        gameState.current.playfield = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        gameState.current.tetrominoSequence = [];
        gameState.current.score = 0;
        gameState.current.count = 0;

        gameState.current.nextTetromino = getNextTetromino();
        gameState.current.currentTetromino = getNextTetromino();
        drawNextPiece();

        if (gameState.current.currentTetromino.techData) {
            const t = gameState.current.currentTetromino.techData;
            const generatedImage = t.name.toLowerCase()
                .replace(/ /g, '-')
                .replace(/ō/g, 'o')
                .replace(/ū/g, 'u') + '.webp';

            const imgPath = t.image
                ? (t.image.startsWith('http') ? t.image : `/media/${t.image}`)
                : `/media/${generatedImage}`;

            setCurrentTechInfo({
                name: t.name,
                kanji: t.kanji || '',
                image: imgPath
            });
            setImageError(false);
        }

        setScore({ ippon: 0, waza: 0, yuko: 0 });
        setLevel(1);
        setIsGameOver(false);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, loop]);

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isPlaying || isGameOver) return;
            if (e.key === 'ArrowLeft') handleLeft();
            else if (e.key === 'ArrowRight') handleRight();
            else if (e.key === 'ArrowUp') handleRotate();
            else if (e.key === 'ArrowDown') handleDrop();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, isGameOver]);

    // Joystick (Touch) Logic Components
    const Joystick = ({ onLeft, onRight, onUp, onDown, label }) => {
        return (
            <div className="flex gap-2 select-none touch-none scale-90 sm:scale-100">
                <div className="bg-gray-800/60 rounded-full w-28 h-28 relative backdrop-blur border border-white/20">
                    <button
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
                        onTouchStart={(e) => { e.preventDefault(); onUp && onUp() }}
                        onClick={onUp}
                    >▲</button>
                    <button
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
                        onTouchStart={(e) => { e.preventDefault(); onDown && onDown() }}
                        onClick={onDown}
                    >▼</button>
                    <button
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
                        onTouchStart={(e) => { e.preventDefault(); onLeft && onLeft() }}
                        onClick={onLeft}
                    >◀</button>
                    <button
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
                        onTouchStart={(e) => { e.preventDefault(); onRight && onRight() }}
                        onClick={onRight}
                    >▶</button>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white/40 text-[10px] font-bold tracking-tighter">{label}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden font-sans">

            {/* Fullscreen Background Image */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                {currentTechInfo.image && !imageError ? (
                    <img
                        src={currentTechInfo.image}
                        alt="Background"
                        className="w-full h-full object-cover opacity-60 transition-opacity duration-1000"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 opacity-60 flex items-center justify-center p-10">
                        {imageError && (
                            <div className="bg-red-600/20 text-red-500 p-6 rounded-3xl border border-red-500/30 text-center max-w-sm backdrop-blur-md">
                                <div className="text-4xl mb-2">⚠️</div>
                                <div className="font-bold text-sm uppercase tracking-tighter">Debug: Tecnica non caricata</div>
                                <div className="text-[10px] opacity-70 mt-1 font-mono break-all line-clamp-2">
                                    {currentTechInfo.name} <br />
                                    {currentTechInfo.image}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </div>

            {/* Close Button Header */}
            <div className="absolute top-0 left-0 right-0 z-[100] p-4 flex justify-between items-start pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 pointer-events-auto">
                    <h2 className="text-xl font-black italic tracking-tighter text-blue-500">Gokyo<span className="text-white">-Tris</span></h2>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="w-12 h-12 flex items-center justify-center bg-red-600/90 hover:bg-red-500 rounded-full border-2 border-white/20 shadow-lg transition-all active:scale-90 pointer-events-auto"
                    aria-label="Close"
                >
                    <span className="text-2xl font-bold">✕</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-20 px-4">

                {/* HUD */}
                <div className="w-full max-w-sm grid grid-cols-3 gap-2 bg-black/50 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
                    <div className="flex flex-col justify-center gap-1 font-mono text-[10px]">
                        <div className="flex justify-between border-b border-red-500/30">
                            <span className="text-gray-400">IPPON</span>
                            <span className="text-red-500 font-bold">{score.ippon}</span>
                        </div>
                        <div className="flex justify-between border-b border-yellow-500/30">
                            <span className="text-gray-400">WAZA</span>
                            <span className="text-yellow-500 font-bold">{score.waza}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">YUKO</span>
                            <span className="text-blue-500 font-bold">{score.yuko}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tecnica</div>
                        <div className="mt-1 font-bold text-xs line-clamp-2 leading-tight h-8 flex items-center">{currentTechInfo.name || '---'}</div>
                        <div className="text-lg text-red-500 font-serif leading-none mt-1">{currentTechInfo.kanji}</div>
                    </div>

                    <div className="flex flex-col items-center justify-center border-l border-white/10 pl-2">
                        <div className="text-[10px] text-gray-400 mb-1 font-bold">NEXT</div>
                        <canvas ref={nextCanvasRef} width={45} height={45} className="bg-black/20 rounded" />
                    </div>
                </div>

                {/* Game Canvas Container */}
                <div className="flex-grow flex items-center justify-center w-full my-4 overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={320}
                        height={640}
                        className="h-full rounded-lg border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] aspect-[1/2]"
                    />
                </div>

                {/* Bottom Controls */}
                <div className="w-full max-w-md flex justify-around items-center px-4">
                    <Joystick
                        label="MUOVI"
                        onLeft={handleLeft}
                        onRight={handleRight}
                        onDown={handleDrop}
                    />

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleRotate}
                            className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)] border-4 border-white/20 active:scale-95 transition-transform flex items-center justify-center"
                        >
                            <span className="text-4xl font-bold select-none">↻</span>
                        </button>
                        <span className="text-[10px] text-center font-bold text-gray-500 uppercase tracking-widest">Ruota</span>
                    </div>
                </div>
            </div>

            {/* Welcome / Game Over Overlays */}
            {(!isPlaying || isGameOver) && (
                <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-10">
                        <h1 className="text-6xl font-black italic tracking-tighter leading-none mb-2">
                            GOKYO<br /><span className="text-red-600">-TRIS</span>
                        </h1>
                        <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Judo Mastery Game</p>
                    </div>

                    {isGameOver && (
                        <div className="mb-12 animate-in fade-in zoom-in duration-500">
                            <div className="text-red-600 font-black text-4xl mb-4 italic">IPPON!</div>
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 max-w-xs mx-auto">
                                <p className="text-gray-400 text-sm mb-3 font-bold uppercase tracking-widest">Risultato Finale</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-red-500">{score.ippon}</span>
                                        <span className="text-[10px] text-gray-500 font-bold">IPPON</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-yellow-500">{score.waza}</span>
                                        <span className="text-[10px] text-gray-500 font-bold">WAZA</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-blue-500">{score.yuko}</span>
                                        <span className="text-[10px] text-gray-500 font-bold">YUKO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={startGame}
                        className="group relative px-12 py-5 overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-red-600 transition-colors group-hover:bg-red-500" />
                        <span className="relative text-2xl font-black tracking-tight text-white uppercase italic">
                            {isGameOver ? 'Riprova' : 'Inizia Ora'}
                        </span>
                    </button>

                    <div className="mt-12 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                        Tastiera: FRECCE | Touch: JOYSTICK
                    </div>
                </div>
            )}

            {/* Fullscreen Style Injection */}
            <style dangerouslySetInnerHTML={{
                __html: `
                body { overflow: hidden; overscroll-behavior: none; }
                * { -webkit-tap-highlight-color: transparent; }
            `}} />
        </div>
    );
};

export default GokyoTris;
