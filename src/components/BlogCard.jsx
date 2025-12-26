import React from 'react';

const BlogCard = ({ post, onClick, viewMode = 'grid' }) => {
  // Tronca il contenuto a 30 parole
  const truncateContent = (text, wordLimit = 30) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Formatta la data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Genera URL per l'immagine di copertina
  const getImageUrl = (post) => {
    if (!post.cover_image) return '/media/blog/default.webp';
    return `${import.meta.env.VITE_PB_URL}/api/files/${post.collectionId}/${post.id}/${post.cover_image}`;
  };

  // Colore di sfondo in base all'attività
  const getActivityBackgroundColor = (activity) => {
    const colors = {
      'JUDO': '#fff',
      'BJJ': '#ddd',
      'JJ': '#eee',
      'Krav Maga': '#ccc'
    };
    return colors[activity] || '#fff';
  };

  // Modalità lista: solo data e titolo
  if (viewMode === 'list') {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={() => onClick(post)}
      >
        {/* Data */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2" style={{ fontWeight: 200 }}>
          {formatDate(post.date)}
        </div>

        {/* Titolo */}
        <h3 className="text-xl text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" style={{ fontWeight: 400 }}>
          {post.title}
        </h3>
      </div>
    );
  }

  // Modalità griglia: visualizzazione completa
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(post)}
    >
      {/* Immagine di copertina */}
      <div className="relative h-48 overflow-hidden" style={{ backgroundColor: getActivityBackgroundColor(post.activity) }}>
        <img
          src={getImageUrl(post)}
          alt={post.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {post.video_link && (
          <div className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Contenuto */}
      <div className="p-5">
        {/* Data */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(post.date)}</span>
        </div>

        {/* Titolo */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {post.title}
        </h3>

        {/* Contenuto troncato */}
        <div
          className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: truncateContent(post.content, 30) }}
        />

        {/* Pulsante "Leggi di più" */}
        <div className="flex items-center justify-between">
          <button className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold hover:gap-3 transition-all">
            <span>Leggi di più</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {post.external_link && (
            <div className="text-blue-600 dark:text-blue-400" title="Link esterno disponibile">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
