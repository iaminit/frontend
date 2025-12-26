import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const FlashCard = () => {
  const [terms, setTerms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await pb.collection('dictionary').getFullList({
          sort: '@random', 
          requestKey: null,
        });
        // Shuffle client side just in case
        setTerms(records.sort(() => 0.5 - Math.random()).slice(0, 50)); // Limit to 50 for a session
      } catch (err) {
        console.error("Error fetching flashcards:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % terms.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + terms.length) % terms.length);
    }, 200);
  };

  if (loading) {
    return (
      <Layout title="Flash Cards">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (terms.length === 0) return <Layout title="Flash Cards"><div className="text-center mt-10">Nessun termine trovato.</div></Layout>;

  const currentTerm = terms[currentIndex];

  return (
    <Layout title="Flash Cards">
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flash Cards</h1>
          <p className="text-gray-500">Clicca sulla carta per girarla</p>
        </div>

        {/* Card Container */}
        <div 
          className="relative w-full h-80 perspective-1000 cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 border-2 border-green-500">
              <span className="text-6xl mb-6">🇯🇵</span>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{currentTerm.term}</h2>
              {currentTerm.kanji && <p className="text-2xl text-gray-400">{currentTerm.kanji}</p>}
            </div>

            {/* Back */}
            <div className="absolute w-full h-full backface-hidden bg-green-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 rotate-y-180">
              <span className="text-6xl mb-6">🇮🇹</span>
              <div 
                className="text-xl font-medium leading-relaxed prose prose-invert"
                dangerouslySetInnerHTML={{ __html: currentTerm.description }}
              />
            </div>

          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-10">
          <button 
            onClick={handlePrev}
            className="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Precedente
          </button>
          <div className="px-6 py-3 font-mono text-gray-500">
            {currentIndex + 1} / {terms.length}
          </div>
          <button 
            onClick={handleNext}
            className="px-6 py-3 rounded-full bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
          >
            Prossima →
          </button>
        </div>

      </div>
      
      {/* CSS for 3D Flip */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </Layout>
  );
};

export default FlashCard;
