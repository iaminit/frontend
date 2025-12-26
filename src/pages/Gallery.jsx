import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetId, setTargetId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    const searchParam = params.get('search');

    if (idParam) {
      setTargetId(idParam);
      // Clear highlight after 3 seconds
      setTimeout(() => setTargetId(null), 3000);
    }

    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from 'gallery' collection
        const records = await pb.collection('gallery').getFullList({
          sort: '-date,-created',
          requestKey: null,
        });

        console.log("Gallery records fetched from PB:", records);
        console.log("Gallery records count:", records.length);
        setItems(records);
      } catch (err) {
        console.error("Error fetching gallery:", err);
        console.error("Error status:", err.status);
        console.error("Error data:", err.data);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (item) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const getImageUrl = (item) => {
    if (!item || !item.image) return null;

    // If it's a full URL, return it
    if (item.image.startsWith('http')) return item.image;

    // If it's an item from PocketBase (has collectionId and id)
    if (item.collectionId && item.id) {
      return pb.files.getUrl(item, item.image);
    }

    // Fallback for any legacy path logic (shouldn't be needed for pure PB)
    return item.image.startsWith('/') ? item.image : `/media/${item.image}`;
  };

  if (loading) {
    return (
      <Layout title="Galleria">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </Layout>
    );
  }

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Galleria">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Galleria</h1>
          <p className="text-gray-600 dark:text-gray-400">Momenti e ricordi dal tatami</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10 px-4">
          <input
            type="text"
            placeholder="Cerca foto o video..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
          />
          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Gallery Grid: 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full ${item.id === targetId ? 'animate-term-highlight' : ''
                }`}
            >
              {/* Media Preview */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {item.type === 'photo' && getImageUrl(item) && (
                  <img
                    src={getImageUrl(item)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to /media/ if PB file fails
                      if (!e.target.src.includes('/media/')) {
                        console.log(`Image load failed: ${item.image}`);
                        e.target.src = `/media/${item.image}`;
                      }
                    }}
                  />
                )}
                {item.type === 'video' && getYouTubeVideoId(item.video_url) && (
                  <img
                    src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.video_url)}/hqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
                {/* Fallback Icon */}
                {((item.type === 'photo' && !item.image) || (item.type === 'video' && !item.video_url)) && (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300 dark:text-gray-600">
                    {item.type === 'photo' ? '📷' : '🎥'}
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-bold uppercase">
                  {item.type === 'video' ? 'Video' : 'Foto'}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 flex-1 flex flex-col relative">
                <div className="mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1" title={item.title}>
                    {item.title}
                  </h3>
                  {item.date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(item.date).toLocaleDateString('it-IT')}
                    </p>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 flex-1">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  {/* External Link (if present) */}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Link esterno"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗
                    </a>
                  )}

                  {/* Expand Icon (Bottom Right) */}
                  <button
                    onClick={() => openModal(item)}
                    className="ml-auto p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    title="Espandi"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <polyline points="9 21 3 21 3 15"></polyline>
                      <line x1="21" y1="3" x2="14" y2="10"></line>
                      <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🖼️</div>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Galleria vuota</h3>
            <p className="text-gray-500 dark:text-gray-400">Non ci sono contenuti da mostrare.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.title}</h2>
                {selectedItem.date && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(selectedItem.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Media Content */}
            <div className="bg-black flex items-center justify-center min-h-[300px]">
              {selectedItem.type === 'photo' && getImageUrl(selectedItem) && (
                <img
                  src={getImageUrl(selectedItem)}
                  alt={selectedItem.title}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={(e) => {
                    if (!e.target.src.includes('/media/')) {
                      // Just log error, no fallback to avoid confusion
                      console.log(`Image load failed: ${selectedItem.image}`);
                    }
                  }}
                />
              )}
              {selectedItem.type === 'video' && selectedItem.video_url && getYouTubeVideoId(selectedItem.video_url) && (
                <div className="w-full aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedItem.video_url)}?autoplay=1`}
                    title={selectedItem.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>

            {/* Details */}
            {(selectedItem.description || selectedItem.link) && (
              <div className="p-6">
                {selectedItem.description && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {selectedItem.description}
                  </p>
                )}
                {selectedItem.link && (
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    🔗 Visita Link Esterno
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Gallery;
