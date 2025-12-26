import React from 'react';

const BlogModal = ({ post, isOpen, onClose }) => {
  if (!isOpen || !post) return null;

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

  // Estrai ID video YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

  const youtubeId = getYouTubeId(post.video_link);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white dark:bg-gray-900 w-full h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-1">
            {post.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Chiudi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="relative h-64 md:h-80 overflow-hidden" style={{ backgroundColor: getActivityBackgroundColor(post.activity) }}>
          <img
            src={getImageUrl(post)}
            alt={post.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(post.date)}</span>
            {post.expiration_date && (
              <>
                <span>•</span>
                <span>Scade il: {formatDate(post.expiration_date)}</span>
              </>
            )}
          </div>

          {/* Full Content */}
          <div
            className="prose dark:prose-invert max-w-none mb-6 text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Video YouTube */}
          {youtubeId && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Video
              </h3>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={post.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Video MP4 */}
          {post.video_link && !youtubeId && post.video_link.endsWith('.mp4') && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Video
              </h3>
              <video
                className="w-full"
                controls
                src={post.video_link}
              >
                Il tuo browser non supporta il tag video.
              </video>
            </div>
          )}

          {/* External Link */}
          {post.external_link && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visita Link Esterno
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogModal;
