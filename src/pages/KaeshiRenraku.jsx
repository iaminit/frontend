import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${active
        ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
  >
    {label}
  </button>
);

const TechniqueCard = ({ item, onClick, isTarget }) => {
  return (
    <div
      onClick={() => onClick(item)}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all cursor-pointer group ${isTarget ? 'animate-term-highlight' : ''
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-2xl shrink-0">
          {item.type === 'kaeshi' ? '🔄' : '🔗'}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {item.name}
          </h3>

          {item.category && (
            <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full mb-1">
              {item.category}
            </span>
          )}

          {item.from_technique && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Da: <span className="font-medium">{item.from_technique}</span>
            </p>
          )}

          {item.to_technique && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A: <span className="font-medium">{item.to_technique}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const KaeshiRenraku = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: null, // 'kaeshi' or 'renraku'
    category: null,
    difficulty: null
  });
  const [targetId, setTargetId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    if (idParam) {
      setTargetId(idParam);
      // Clear highlight after 3 seconds
      setTimeout(() => setTargetId(null), 3000);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await pb.collection('kaeshi_renraku').getFullList({
          sort: 'type,name',
          requestKey: null,
        });
        setItems(records);
      } catch (err) {
        console.error("Error fetching kaeshi & renraku:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterClick = (type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: prev[type] === value ? null : value
    }));
  };

  const resetFilters = () => {
    setActiveFilters({ type: null, category: null, difficulty: null });
    setSearchTerm('');
  };

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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.from_technique && item.from_technique.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.to_technique && item.to_technique.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = !activeFilters.type || item.type === activeFilters.type;
      const matchesCategory = !activeFilters.category || item.category === activeFilters.category;
      const matchesDifficulty = !activeFilters.difficulty || item.difficulty === activeFilters.difficulty;

      return matchesSearch && matchesType && matchesCategory && matchesDifficulty;
    });
  }, [searchTerm, activeFilters, items]);

  // Get unique categories from data
  const categories = useMemo(() => {
    const cats = new Set(items.filter(i => i.category).map(i => i.category));
    return Array.from(cats);
  }, [items]);

  if (loading) {
    return (
      <Layout title="Kaeshi & Renraku">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kaeshi & Renraku">
      <div className="space-y-6">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Kaeshi & Renraku</h1>
          <p className="text-gray-600 dark:text-gray-400">Contrattacchi e Combinazioni</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Cerca contrattacco o combinazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-xl">⚡</span> Filtri
            </h2>
            {(activeFilters.type || activeFilters.category || activeFilters.difficulty || searchTerm) && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors"
              >
                Resetta tutto
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Tipo</h3>
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                label="🔄 Kaeshi (Contrattacchi)"
                active={activeFilters.type === 'kaeshi'}
                onClick={() => handleFilterClick('type', 'kaeshi')}
              />
              <FilterButton
                label="🔗 Renraku (Combinazioni)"
                active={activeFilters.type === 'renraku'}
                onClick={() => handleFilterClick('type', 'renraku')}
              />
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Categoria</h3>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <FilterButton
                    key={cat}
                    label={cat}
                    active={activeFilters.category === cat}
                    onClick={() => handleFilterClick('category', cat)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Filter */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Difficoltà</h3>
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                label="Facile"
                active={activeFilters.difficulty === 'easy'}
                onClick={() => handleFilterClick('difficulty', 'easy')}
              />
              <FilterButton
                label="Medio"
                active={activeFilters.difficulty === 'medium'}
                onClick={() => handleFilterClick('difficulty', 'medium')}
              />
              <FilterButton
                label="Difficile"
                active={activeFilters.difficulty === 'hard'}
                onClick={() => handleFilterClick('difficulty', 'hard')}
              />
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <TechniqueCard
              key={item.id}
              item={item}
              onClick={openModal}
              isTarget={item.id === targetId}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🥋</div>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Nessuna tecnica trovata</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Prova a modificare i filtri o la ricerca.</p>
            <button
              onClick={resetFilters}
              className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-colors"
            >
              Resetta filtri
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 md:p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 md:rounded-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-8">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="float-right p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Chiudi"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-3"
                  style={{
                    backgroundColor: selectedItem.type === 'kaeshi' ? 'rgba(234, 88, 12, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: selectedItem.type === 'kaeshi' ? '#ea580c' : '#3b82f6'
                  }}>
                  {selectedItem.type === 'kaeshi' ? '🔄 Kaeshi (Contrattacco)' : '🔗 Renraku (Combinazione)'}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedItem.name}
                </h2>

                {selectedItem.category && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {selectedItem.category}
                  </p>
                )}
              </div>

              {/* Techniques Flow */}
              {(selectedItem.from_technique || selectedItem.to_technique) && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-4">
                    {selectedItem.from_technique && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Da</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {selectedItem.from_technique}
                        </div>
                      </div>
                    )}

                    {selectedItem.from_technique && selectedItem.to_technique && (
                      <div className="text-3xl text-orange-600">→</div>
                    )}

                    {selectedItem.to_technique && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">A</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {selectedItem.to_technique}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Difficulty Badge */}
              {selectedItem.difficulty && (
                <div className="mb-6">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${selectedItem.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      selectedItem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    Difficoltà: {selectedItem.difficulty === 'easy' ? 'Facile' : selectedItem.difficulty === 'medium' ? 'Media' : 'Difficile'}
                  </span>
                </div>
              )}

              {/* YouTube Embed */}
              {selectedItem.video_url && getYouTubeVideoId(selectedItem.video_url) && (
                <div className="mb-6 aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedItem.video_url)}`}
                    title={selectedItem.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {/* YouTube Link */}
              {selectedItem.video_url && (
                <div className="mb-6">
                  <a
                    href={selectedItem.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Guarda su YouTube
                  </a>
                </div>
              )}

              {/* Description */}
              {selectedItem.description && (
                <div
                  className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedItem.description }}
                />
              )}

              {/* Key Points */}
              {selectedItem.key_points && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">Punti Chiave</h3>
                  <div
                    className="text-blue-800 dark:text-blue-200 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedItem.key_points }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default KaeshiRenraku;
