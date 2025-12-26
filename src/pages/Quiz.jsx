import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const Quiz = () => {
    const [gameState, setGameState] = useState('setup'); // setup, playing, results
    const [settings, setSettings] = useState({
        danLevel: '1',
        questionCount: '10',
        category: 'mista'
    });
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { 0: 2, 1: 4 }
    const [score, setScore] = useState(0);
    const [consecutiveErrors, setConsecutiveErrors] = useState(0);
    const [isHansokuMake, setIsHansokuMake] = useState(false);

    const handleStart = async () => {
        try {
            // Build filter string
            const filters = [];

            // Dan Level Filter
            if (settings.danLevel !== 'musashi' && settings.danLevel !== 'mifune' && settings.danLevel !== 'kano') {
                filters.push(`dan_level="${settings.danLevel}"`);
            }

            // Category Filter
            if (settings.category !== 'mista' && settings.category !== 'generale') {
                filters.push(`category="${settings.category}"`);
            }

            const filterString = filters.join(' && ');

            // Fetch questions from PB
            const records = await pb.collection('quiz_questions').getFullList({
                filter: filterString,
                sort: '@random', // PocketBase supports random sort
            });

            if (records.length === 0) {
                alert("Nessuna domanda trovata per i criteri selezionati.");
                return;
            }

            // Shuffle and slice to count
            const shuffled = records.sort(() => 0.5 - Math.random());
            const count = Math.min(parseInt(settings.questionCount), shuffled.length);
            const selectedQuestions = shuffled.slice(0, count).map(q => ({
                id: q.id,
                question: q.question,
                options: [q.option_a, q.option_b, q.option_c, q.option_d],
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                image_path: q.image_path,
                category: q.category,
                dan_level: q.dan_level
            }));

            setQuestions(selectedQuestions);
            setGameState('playing');
            setCurrentIndex(0);
            setAnswers({});
            setScore(0);
            setConsecutiveErrors(0);
            setIsHansokuMake(false);
        } catch (e) {
            console.error(e);
            alert("Errore nel caricamento del quiz. Verifica la connessione.");
        }
    };

    const handleAnswer = (optionIndex) => {
        // 1-based index to match DB
        const selectedAnswer = optionIndex + 1;

        // Prevent changing answer? PHP version allows selection then 'Next'. 
        // Here we can select and then confirm or instant feedback.
        // Let's implement select-then-confirm style like standard quizzes.

        // But typically in these games, you select and it locks or you click next.
        // Let's store the selection.
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: selectedAnswer
        }));
    };

    const nextQuestion = () => {
        const currentQ = questions[currentIndex];
        const userAns = answers[currentIndex];

        if (!userAns) return; // Must select

        const isCorrect = userAns === currentQ.correctAnswer;

        if (isCorrect) {
            setScore(s => s + 1);
            setConsecutiveErrors(0);
        } else {
            setConsecutiveErrors(c => c + 1);
        }

        // Check Hansoku-make (3 errors in a row)
        // Note: React state update is async, so check valid logic carefully or use a ref/effect.
        // Actually, let's check current 'isCorrect' and 'consecutiveErrors' state (which is previous).
        // Better: calculate next errors
        const nextErrors = isCorrect ? 0 : consecutiveErrors + 1;

        if (nextErrors >= 3) {
            setIsHansokuMake(true);
            setGameState('results');
            return;
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            setGameState('results');
        }
    };

    const calculateGrade = () => {
        if (isHansokuMake) return { text: 'HANSOKU-MAKE', score: 'Squalifica', color: 'text-red-600', msg: 'Preparazione insufficiente!' };

        const percentage = Math.round((score / questions.length) * 100);
        if (percentage === 100) return { text: 'IPPON', color: 'text-yellow-500', msg: 'Prestazione perfetta!' };
        if (percentage >= 70) return { text: 'WAZA-ARI', color: 'text-blue-600', msg: 'Buona prestazione!' };
        if (percentage >= 50) return { text: 'YUKO', color: 'text-green-600', msg: 'Prestazione sufficiente' };
        if (percentage >= 30) return { text: 'SHIDO', color: 'text-orange-500', msg: 'Devi studiare di più' };
        return { text: 'HANSOKU-MAKE', color: 'text-red-600', msg: 'Preparazione insufficiente!' };
    };

    return (
        <Layout title="Quiz">
            <div className="max-w-3xl mx-auto">

                {/* SETUP SCREEN */}
                {gameState === 'setup' && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-10">
                            <img src="/media/mifune_sorride.webp" alt="Kyuzo Mifune" className="w-40 h-auto object-contain mx-auto mb-4 drop-shadow-lg" />
                            <h1 className="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                                Preparazione Esame
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Seleziona il tuo livello e mettiti alla prova
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                    Livello Dan
                                </label>
                                <select
                                    value={settings.danLevel}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        let count = '10';
                                        if (val === '2') count = '20';
                                        if (val === '3') count = '30';
                                        if (val === '4') count = '40';
                                        if (val === '5') count = '50';
                                        if (val === 'mifune') count = '99';
                                        if (val === 'kano') count = '100';
                                        if (val === 'musashi') count = '50'; // Default for slider
                                        setSettings({ ...settings, danLevel: val, questionCount: count });
                                    }}
                                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-black transition-all font-bold text-lg outline-none"
                                >
                                    <option value="1">1° Dan (Shodan)</option>
                                    <option value="2">2° Dan (Nidan)</option>
                                    <option value="3">3° Dan (Sandan)</option>
                                    <option value="4">4° Dan (Yodan)</option>
                                    <option value="5">5° Dan (Godan)</option>
                                    <option value="musashi">Miyamoto Musashi (Custom)</option>
                                    <option value="mifune">Kyuzo Mifune (Master)</option>
                                    <option value="kano">Jigoro Kano (Legend)</option>
                                </select>
                            </div>

                            {settings.danLevel === 'musashi' ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                        Numero Domande: <span className="text-red-500 text-lg">{settings.questionCount}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1" max="100"
                                        value={settings.questionCount}
                                        onChange={(e) => setSettings({ ...settings, questionCount: e.target.value })}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                        Numero Domande
                                    </label>
                                    <div className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed">
                                        {settings.questionCount} Domande
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleStart}
                                className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-xl shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200 mt-4 flex items-center justify-center gap-3"
                            >
                                <span>🚀 INIZIA QUIZ</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* GAME SCREEN */}
                {gameState === 'playing' && questions[currentIndex] && (
                    <div className="animate-in slide-in-from-right duration-300">
                        {/* Header / Progress */}
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Domanda</span>
                                <div className="text-3xl font-black text-gray-800 dark:text-white leading-none">
                                    <span className="text-red-600">{currentIndex + 1}</span>
                                    <span className="text-lg text-gray-300 mx-1">/</span>
                                    <span className="text-gray-400">{questions.length}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {consecutiveErrors > 0 && (
                                    <div className="text-xs font-bold text-red-500 animate-pulse">
                                        {consecutiveErrors} errori consecutivi!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
                            <div
                                className="h-full bg-red-500 transition-all duration-500 ease-out"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                            {/* Question Text */}
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-8 leading-relaxed">
                                {questions[currentIndex].question}
                            </h2>

                            {/* Image if exists */}
                            {questions[currentIndex].image_path && typeof questions[currentIndex].image_path === 'string' && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex justify-center">
                                    <img
                                        src={`/media/${questions[currentIndex].image_path.split('/').pop()}`}
                                        alt="Domanda"
                                        className="max-h-64 object-contain"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                            )}

                            {/* Options */}
                            <div className="space-y-3">
                                {questions[currentIndex].options.map((opt, idx) => {
                                    const isSelected = answers[currentIndex] === idx + 1;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            className={`w-full p-4 md:p-5 text-left rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group
                        ${isSelected
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-md transform scale-[1.01]'
                                                    : 'border-transparent bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                                                }
                      `}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                        ${isSelected ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 group-hover:bg-gray-300'}
                      `}>
                                                {['A', 'B', 'C', 'D'][idx]}
                                            </div>
                                            <span className="font-medium text-lg pt-0.5">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={nextQuestion}
                                disabled={!answers[currentIndex]}
                                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 transition-all duration-300
                  ${answers[currentIndex]
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 hover:shadow-xl'
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }
                `}
                            >
                                {currentIndex === questions.length - 1 ? 'Termina' : 'Prossima'}
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* RESULTS SCREEN */}
                {gameState === 'results' && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center animate-in zoom-in-95 duration-500">

                        <div className="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-900 mb-6 relative">
                            <span className="text-6xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                {calculateGrade().text === 'IPPON' ? '🏆' : calculateGrade().text === 'HANSOKU-MAKE' ? '🛑' : '🥋'}
                            </span>
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-200 dark:text-gray-700"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={377}
                                    strokeDashoffset={377 - (377 * (isHansokuMake ? 0 : score) / questions.length)}
                                    className={calculateGrade().color}
                                />
                            </svg>
                        </div>

                        <h2 className={`text-4xl md:text-5xl font-black mb-2 ${calculateGrade().color}`}>
                            {calculateGrade().text}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 font-medium mb-8">
                            {calculateGrade().msg}
                        </p>

                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
                                <div className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-1">Punteggio</div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white">
                                    {score}<span className="text-gray-400 text-base">/{questions.length}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
                                <div className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-1">Precisione</div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white">
                                    {Math.round((score / questions.length) * 100)}%
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setGameState('setup')}
                                className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-lg hover:transform hover:scale-105 transition-all"
                            >
                                🔄 Nuova Partita
                            </button>
                            <Link
                                to="/"
                                className="w-full py-4 rounded-xl bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                            >
                                Torna alla Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Quiz;
