import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const GOKYO_GROUPS = ['Dai Ikkyo', 'Dai Nikyo', 'Dai Sankyo', 'Dai Yonkyo', 'Dai Gokyo'];

const GokyoGame = () => {
  const [techniques, setTechniques] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, feedback, finished
  const [currentTech, setCurrentTech] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all techniques that belong to a Gokyo group
        const records = await pb.collection('techniques').getFullList({
          filter: 'group != "" && group != "Altre"', // Assuming standard Gokyo groups
          requestKey: null,
        });

        // Filter to ensure only valid Gokyo groups are included just in case
        const gokyoTechs = records.filter(t => GOKYO_GROUPS.includes(t.group));

        // Shuffle and take 10
        const shuffled = gokyoTechs.sort(() => 0.5 - Math.random()).slice(0, 10);

        setTechniques(shuffled);
        setGameState('playing');
        setCurrentTech(shuffled[0]);
      } catch (err) {
        console.error("Error fetching techniques for game:", err);
      }
    };
    fetchData();
  }, []);

  const handleGuess = (group) => {
    if (gameState !== 'playing') return;

    setSelectedGroup(group);
    const correct = group === currentTech.group;
    setIsCorrect(correct);

    if (correct) setScore(s => s + 1);

    setGameState('feedback');

    setTimeout(() => {
      if (currentRound < techniques.length - 1) {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setCurrentTech(techniques[nextRound]);
        setGameState('playing');
        setSelectedGroup(null);
        setIsCorrect(null);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  const restartGame = () => {
    window.location.reload();
  };

  if (gameState === 'loading') {
    return (
      <Layout title="Gokyo Quiz">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (gameState === 'finished') {
    return (
      <Layout title="Gokyo Quiz">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Gioco Completato!</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Punteggio: <span className="text-red-600 font-bold">{score}</span> / {techniques.length}
          </p>
          <button
            onClick={restartGame}
            className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            Gioca di nuovo
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gokyo Quiz">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
            Round {currentRound + 1} / {techniques.length}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {currentTech?.name}
          </h1>
          <p className="text-gray-500">A quale gruppo del Gokyo appartiene?</p>
        </div>

        <div className="grid gap-3">
          {GOKYO_GROUPS.map((group) => {
            let btnClass = "bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500";

            if (gameState === 'feedback') {
              if (group === currentTech.group) {
                btnClass = "bg-green-500 border-green-500 text-white"; // Correct answer always green
              } else if (group === selectedGroup && !isCorrect) {
                btnClass = "bg-red-500 border-red-500 text-white"; // Wrong selection red
              } else {
                btnClass = "opacity-50 bg-gray-100 dark:bg-gray-800 border-transparent";
              }
            }

            return (
              <button
                key={group}
                onClick={() => handleGuess(group)}
                disabled={gameState === 'feedback'}
                className={`p-6 rounded-2xl text-xl font-bold transition-all duration-200 ${btnClass}`}
              >
                {group}
              </button>
            );
          })}
        </div>

        {gameState === 'feedback' && (
          <div className={`mt-8 text-center text-xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'} animate-bounce`}>
            {isCorrect ? "CORRETTO! 🥋" : `SBAGLIATO! Era ${currentTech.group}`}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default GokyoGame;
