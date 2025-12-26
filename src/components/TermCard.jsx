import { useState } from 'react';

const TermCard = ({ term, onOpenModal, isTarget }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = (e, audioFile) => {
    e.stopPropagation();
    if (!audioFile) return;

    const audio = new Audio(audioFile.startsWith('http') ? audioFile : `/media/audio/${audioFile}`);
    audio.volume = 1.0;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      console.error('Audio playback failed');
      setIsPlaying(false);
    };

    audio.play().catch(error => {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    });
  };

  const handleCardClick = () => {
    if (onOpenModal) {
      onOpenModal(term);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative ${isTarget ? 'animate-term-highlight' : ''
        }`}
      onClick={handleCardClick}
    >
      {/* Modal trigger button */}
      <button
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleCardClick();
        }}
        title="Apri in modal"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white m-0">
            {term.termine}
          </h3>

          {/* Audio button */}
          {term.has_audio && term.audio_file && (
            <button
              className={`p-2 rounded-xl transition-all shadow-sm border ${isPlaying
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                }`}
              onClick={(e) => playAudio(e, term.audio_file)}
              title="Ascolta pronuncia"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
          )}
        </div>

        {/* Kanji badge */}
        {term.kanji && (
          <span className="text-2xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
            {term.kanji}
          </span>
        )}
      </div>

      {/* Pronunciation subtitle */}
      {term.termine && (
        <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-3">
          {term.termine.toLowerCase().replace(/ /g, '-')}
        </p>
      )}

      {/* Description */}
      {term.descrizione && (
        <div
          className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3"
          dangerouslySetInnerHTML={{ __html: term.descrizione }}
        />
      )}
    </div>
  );
};

export default TermCard;
