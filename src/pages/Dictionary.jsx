import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import TermCard from '../components/TermCard';
import { pb } from '../lib/pocketbase';

const Dictionary = () => {
  const location = useLocation();
  const [allTerms, setAllTerms] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState(null);
  const [targetTermId, setTargetTermId] = useState(null);

  // Handle URL Search Params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      setActiveLetter(null);
      // Look for the exact term to highlight it
      const exactMatch = allTerms.find(t => t.termine.toLowerCase() === searchParam.toLowerCase());
      if (exactMatch) {
        setTargetTermId(exactMatch.id);
        // Clear highlight after 3 seconds
        setTimeout(() => setTargetTermId(null), 3000);
      }
    }
  }, [location.search, allTerms]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalTerm, setModalTerm] = useState(null);

  // Initialize database and load terms
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch all terms from PocketBase
        const records = await pb.collection('dictionary').getFullList({
          sort: 'term',
          requestKey: null // Disable auto-cancellation
        });

        // Map PocketBase fields to component structure
        const terms = records.map(record => {
          const normalizedName = record.term.toLowerCase()
            .replace(/ /g, '')
            .replace(/-/g, '')
            .replace(/ō/g, 'o')
            .replace(/ū/g, 'u')
            .replace(/ā/g, 'a')
            .replace(/ī/g, 'i')
            .replace(/ē/g, 'e');

          const pbAudio = record.audio ? pb.files.getUrl(record, record.audio) : null;
          const fallbackAudio = `${normalizedName}.mp3`;

          return {
            id: record.id,
            termine: record.term,
            pronuncia: record.pronunciation,
            descrizione: record.description,
            kanji: record.kanji,
            audio_file: pbAudio || fallbackAudio,
            has_audio: !!pbAudio || true // Set to true to show the altoparlante
          };
        });

        // Extract available letters
        const letters = [...new Set(terms.map(t => t.termine.charAt(0).toUpperCase()))].sort();

        setAllTerms(terms);
        setFilteredResults(terms);
        setAvailableLetters(letters);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading dictionary:', err);
        setError('Impossibile caricare il dizionario. Riprova più tardi.');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter terms based on search and letter
  const filterTerms = useCallback(() => {
    let results = allTerms;

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase();
      results = results.filter(term => {
        const originalTerm = term.termine.toLowerCase();
        const normalizedTerm = originalTerm.replace(/-/g, ' ');
        return originalTerm.includes(normalizedSearch) || normalizedTerm.includes(normalizedSearch);
      });
    } else if (activeLetter) {
      results = results.filter(term => {
        return term.termine.charAt(0).toUpperCase() === activeLetter;
      });
    }

    setFilteredResults(results);
  }, [allTerms, searchTerm, activeLetter]);

  useEffect(() => {
    filterTerms();
  }, [filterTerms]);

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setActiveLetter(null); // Clear letter filter when searching
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setActiveLetter(null);
  };

  // Filter by letter
  const handleLetterClick = (letter) => {
    setSearchTerm(''); // Clear search when filtering by letter
    setActiveLetter(letter === activeLetter ? null : letter);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveLetter(null);
  };

  // Open modal
  const openModal = (term) => {
    setModalTerm(term);
  };

  // Close modal
  const closeModal = () => {
    setModalTerm(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }

      // Escape to clear search or close modal
      if (e.key === 'Escape') {
        if (modalTerm) {
          closeModal();
        } else if (searchTerm) {
          clearSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, modalTerm]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Caricamento dizionario...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-xl mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            辞書 Dizionario
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esplora i termini del judo in giapponese
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              className="search-input w-full px-6 py-4 text-lg rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition-all"
              placeholder="Cerca un termine... (Cmd/Ctrl + K)"
              value={searchTerm}
              onChange={handleSearchChange}
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
                title="Cancella ricerca"
              >
                Pulisci
              </button>
            )}
          </div>
        </div>

        {/* Alphabet Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {alphabet.map(letter => {
              const isAvailable = availableLetters.includes(letter);
              const isActive = activeLetter === letter;

              return (
                <button
                  key={letter}
                  onClick={() => isAvailable && handleLetterClick(letter)}
                  disabled={!isAvailable || !!searchTerm}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${isActive
                      ? 'bg-red-600 text-white shadow-lg'
                      : isAvailable && !searchTerm
                        ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  {letter}
                </button>
              );
            })}
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Tutti
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-4">
          {(searchTerm || activeLetter) && (
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm
                ? `Risultati per "${searchTerm}"`
                : `Termini che iniziano con "${activeLetter}"`
              }
            </h2>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            {filteredResults.length} termin{filteredResults.length === 1 ? 'e' : 'i'} trovat{filteredResults.length === 1 ? 'o' : 'i'}
          </p>
        </div>

        {/* Results Grid */}
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((term, index) => (
              <TermCard
                key={term.id || index}
                term={term}
                onOpenModal={openModal}
                isTarget={term.id === targetTermId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Nessun risultato trovato
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Prova a modificare i criteri di ricerca o seleziona una lettera diversa.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalTerm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 md:p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 md:rounded-2xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl"
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
                  {modalTerm.termine}
                </h2>
                {modalTerm.kanji ? (
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    {modalTerm.kanji}
                  </p>
                ) : (
                  <p className="text-xl italic text-gray-500 dark:text-gray-400">
                    {modalTerm.termine.toLowerCase().replace(/ /g, '-')}
                  </p>
                )}
              </div>

              {/* Audio button in modal */}
              {modalTerm.has_audio && modalTerm.audio_file && (
                <button
                  onClick={() => {
                    const audio = new Audio(modalTerm.audio_file.startsWith('http') ? modalTerm.audio_file : `/media/audio/${modalTerm.audio_file}`);
                    audio.volume = 1.0;
                    audio.play().catch(err => console.error('Audio error:', err));
                  }}
                  className="mb-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                  Ascolta pronuncia
                </button>
              )}

              {/* Content */}
              {modalTerm.descrizione && (
                <div
                  className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: modalTerm.descrizione }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dictionary;
