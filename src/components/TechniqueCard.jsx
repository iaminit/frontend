import { useState } from 'react';

const TechniqueCard = ({ technique, onOpenModal, isTarget }) => {
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
      onOpenModal(technique);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group ${isTarget ? 'animate-term-highlight' : ''
        }`}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="aspect-square bg-white dark:bg-gray-900/50 relative overflow-hidden border-b border-gray-100 dark:border-gray-700">
        <img
          src={`/media/${technique.image}`}
          alt={technique.nome}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300 mix-blend-multiply dark:mix-blend-screen"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5MGEwIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTUtMTAtNXpNMiAxN2wxMCA1IDEwLTUtMTAtNXpNMiAxMmwxMCA1IDEwLTUtMTAtNXoiLz48L3N2Zz4=';
            e.target.className = "w-full h-full object-contain p-8 opacity-30";
          }}
        />

        {/* Audio Button Overlay */}
        {technique.has_audio && technique.audio_file && (
          <button
            className={`absolute top-2 left-2 p-2.5 rounded-xl transition-all shadow-xl backdrop-blur-md border ${isPlaying
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border-white/20 hover:bg-red-600 hover:text-white'
              }`}
            onClick={(e) => playAudio(e, technique.audio_file)}
            title="Ascolta pronuncia"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>
        )}

        {/* Video Badge */}
        {technique.video_youtube && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            VIDEO
          </div>
        )}

        {/* Active Indicator */}
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 shadow-sm"></div>
      </div>

      {/* Content */}
      <div className="p-3 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base leading-tight">
            {technique.nome}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {technique.gruppo} • {technique.tipo}
        </p>
      </div>
    </div>
  );
};

export default TechniqueCard;
