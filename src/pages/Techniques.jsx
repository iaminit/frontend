import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import TechniqueCard from '../components/TechniqueCard';
import { pb } from '../lib/pocketbase';

const FilterButton = ({ label, active, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${active
      ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      } ${className}`}
  >
    {label}
  </button>
);

const FilterSection = ({ title, children, isOpen, onToggle }) => (
  <div className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
    <div
      className="flex items-center justify-between cursor-pointer mb-3 group"
      onClick={onToggle}
    >
      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
        {title}
      </h3>
      <span className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </div>

    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
      {children}
    </div>
  </div>
);

const Techniques = () => {
  const location = useLocation();
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTechnique, setModalTechnique] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    group: null,
    category: null,
    dan: null
  });
  const [targetId, setTargetId] = useState(null);

  // Handle URL Search Params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const idParam = params.get('id');

    if (searchParam) {
      setSearchTerm(searchParam);
      setActiveFilters({ group: null, category: null, dan: null });
    }

    if (idParam) {
      setTargetId(idParam);
      // Clear highlight after 3 seconds
      setTimeout(() => setTargetId(null), 3000);
    }
  }, [location.search]);

  // Filter sections open state
  const [openSections, setOpenSections] = useState({
    gokyo: true,
    tachiwaza: true,
    sutemiwaza: false,
    katamewaza: false,
    atemiwaza: false,
    dan: false
  });

  // Fetch techniques from PocketBase
  useEffect(() => {
    const fetchTechniques = async () => {
      try {
        const records = await pb.collection('techniques').getFullList({
          sort: 'order,name',
          requestKey: null,
        });

        // Adapt PocketBase data to component structure (English -> Italian mapping)
        const enhancedResults = records.map(t => {
          const normalizedName = t.name.toLowerCase()
            .replace(/ /g, '')
            .replace(/-/g, '')
            .replace(/ō/g, 'o')
            .replace(/ū/g, 'u')
            .replace(/ā/g, 'a')
            .replace(/ī/g, 'i')
            .replace(/ē/g, 'e');

          const pbAudio = t.audio ? pb.files.getUrl(t, t.audio) : null;
          const fallbackAudio = `${normalizedName}.mp3`;

          return {
            id: t.id,
            nome: t.name,
            gruppo: t.group,
            tipo: t.category,
            descrizione: t.description,
            video_youtube: t.video_youtube,
            audio_file: pbAudio || fallbackAudio,
            has_audio: !!pbAudio || true, // Set to true to show the altoparlante
            dan_level: t.dan_level || 1,
            image: (t.name.toLowerCase().replace(/ /g, '-').replace(/ō/g, 'o').replace(/ū/g, 'u') + '.webp')
          };
        });

        setTechniques(enhancedResults);
      } catch (err) {
        console.error("Error fetching techniques:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechniques();
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter Logic
  const handleFilterClick = (type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: prev[type] === value ? null : value
    }));
  };

  const resetFilters = () => {
    setActiveFilters({ group: null, category: null, dan: null });
    setSearchTerm('');
  };

  // Open/close modal
  const openModal = (technique) => {
    setModalTechnique(technique);
  };

  const closeModal = () => {
    setModalTechnique(null);
  };

  // Get YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Filtered Data
  const filteredTechniques = useMemo(() => {
    return techniques.filter(tech => {
      const matchesSearch = tech.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = !activeFilters.group || tech.gruppo === activeFilters.group;
      const matchesCategory = !activeFilters.category || tech.tipo === activeFilters.category;
      const matchesDan = !activeFilters.dan || tech.dan_level === activeFilters.dan;

      return matchesSearch && matchesGroup && matchesCategory && matchesDan;
    });
  }, [searchTerm, activeFilters, techniques]);

  if (loading) {
    return (
      <Layout title="Tecniche">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tecniche">
      <div className="space-y-6">

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Cerca una tecnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
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

        {/* Filters Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-xl">⚡</span> Filtri
            </h2>
            {(activeFilters.group || activeFilters.category || activeFilters.dan || searchTerm) && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors"
              >
                Resetta tutto
              </button>
            )}
          </div>

          <FilterSection title="Go-Kyo" isOpen={openSections.gokyo} onToggle={() => toggleSection('gokyo')}>
            {['Dai Ikkyo', 'Dai Nikyo', 'Dai Sankyo', 'Dai Yonkyo', 'Dai Gokyo'].map(g => (
              <FilterButton
                key={g}
                label={g.toUpperCase()}
                active={activeFilters.group === g}
                onClick={() => handleFilterClick('group', g)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Tachi-waza" isOpen={openSections.tachiwaza} onToggle={() => toggleSection('tachiwaza')}>
            {['Te-waza', 'Koshi-waza', 'Ashi-waza'].map(c => (
              <FilterButton
                key={c}
                label={c.toUpperCase()}
                active={activeFilters.category === c}
                onClick={() => handleFilterClick('category', c)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Sutemi-waza" isOpen={openSections.sutemiwaza} onToggle={() => toggleSection('sutemiwaza')}>
            {['Ma-sutemi-waza', 'Yoko-sutemi-waza'].map(c => (
              <FilterButton
                key={c}
                label={c.replace('-waza', '').toUpperCase()}
                active={activeFilters.category === c}
                onClick={() => handleFilterClick('category', c)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Livello Dan" isOpen={openSections.dan} onToggle={() => toggleSection('dan')}>
            {[1, 2, 3].map(d => (
              <FilterButton
                key={d}
                label={`${d}° DAN`}
                active={activeFilters.dan === d}
                onClick={() => handleFilterClick('dan', d)}
              />
            ))}
          </FilterSection>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTechniques.map(tech => (
            <TechniqueCard
              key={tech.id}
              technique={tech}
              onOpenModal={openModal}
              isTarget={tech.id === targetId}
            />
          ))}
        </div>

        {filteredTechniques.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🥋</div>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Nessuna tecnica trovata</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Prova a modificare i filtri o la ricerca.</p>
            <button
              onClick={resetFilters}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Resetta filtri
            </button>
          </div>
        )}

      </div>

      {/* Modal */}
      {modalTechnique && (
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modalTechnique.nome}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {modalTechnique.gruppo} • {modalTechnique.tipo}
                </p>
              </div>

              {/* Image */}
              <div className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-8 flex items-center justify-center">
                <img
                  src={`/media/${modalTechnique.image}`}
                  alt={modalTechnique.nome}
                  className="max-w-full h-auto max-h-64 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mb-6">
                {/* Audio button */}
                {modalTechnique.has_audio && modalTechnique.audio_file && (
                  <button
                    onClick={() => {
                      const audio = new Audio(modalTechnique.audio_file.startsWith('http') ? modalTechnique.audio_file : `/media/audio/${modalTechnique.audio_file}`);
                      audio.volume = 1.0;
                      audio.play().catch(err => console.error('Audio error:', err));
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                    Ascolta pronuncia
                  </button>
                )}

                {/* YouTube button */}
                {modalTechnique.video_youtube && (
                  <a
                    href={modalTechnique.video_youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Guarda su YouTube
                  </a>
                )}
              </div>

              {/* YouTube Embed */}
              {modalTechnique.video_youtube && getYouTubeVideoId(modalTechnique.video_youtube) && (
                <div className="mb-6 aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(modalTechnique.video_youtube)}`}
                    title={modalTechnique.nome}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {/* Description */}
              {modalTechnique.descrizione && (
                <div
                  className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: modalTechnique.descrizione }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Techniques;