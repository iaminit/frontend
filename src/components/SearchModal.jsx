import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' or collection name

  // Definizione delle collezioni da cercare
  const collections = [
    { name: 'dictionary', label: 'Dizionario', icon: '📖', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', fields: ['term', 'kanji', 'description'] },
    { name: 'techniques', label: 'Tecniche', icon: '🥋', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', fields: ['name', 'description', 'group', 'category'] },
    { name: 'quiz_questions', label: 'Quiz', icon: '❓', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', fields: ['question', 'correct_answer'] },
    { name: 'kata', label: 'Kata', icon: '形', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', fields: ['name', 'japanese_name', 'description'] },
    { name: 'history', label: 'Storia', icon: '📜', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', fields: ['title', 'subtitle', 'content'] },
    { name: 'fijlkam', label: 'FIJLKAM', icon: '🇮🇹', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', fields: ['title', 'content'] },
    { name: 'regulations', label: 'Arbitraggio', icon: '⚖️', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', fields: ['title', 'subtitle', 'content'] },
    { name: 'bulletin_board', label: 'Bacheca', icon: '📌', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', fields: ['title', 'description'] },
    { name: 'gallery', label: 'Galleria', icon: '📸', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', fields: ['title', 'description'] },
    { name: 'kaeshi_renraku', label: 'Kaeshi & Renraku', icon: '🔄', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', fields: ['name', 'description', 'from_technique', 'to_technique'] },
  ];

  const generateVariations = (term) => {
    const t = term.toLowerCase().trim();
    const variations = new Set([t]);

    // 1. Aggiungi versione senza spazi/trattini (es. "ju-no" -> "juno")
    const stripped = t.replace(/[\s-]/g, '');
    if (stripped !== t && stripped.length > 1) {
      variations.add(stripped);
    }

    // 2. Aggiungi versioni con spazi/trattini per prefissi comuni del Judo (es. "ogoshi" -> "o goshi")
    // Prefissi: O (Grande), Ko (Piccolo), Ju (Gentilezza/Dieci), Uki (Fluttuante)
    const prefixes = ['o', 'ko', 'ju', 'uki'];
    
    prefixes.forEach(prefix => {
      if (stripped.startsWith(prefix) && stripped.length > prefix.length) {
        const suffix = stripped.slice(prefix.length);
        // Evita split troppo corti (es. "obi" non diventa "o bi")
        if (suffix.length > 2) {
          variations.add(`${prefix} ${suffix}`);
          variations.add(`${prefix}-${suffix}`);
        }
      }
    });

    // 3. Gestione specifica per suffissi comuni o parole composte (es. "kataguruma" -> "kata guruma")
    const suffixes = ['guruma', 'goshi', 'gari', 'nage', 'otoshi', 'gatame', 'waza', 'no'];
    suffixes.forEach(suffix => {
      if (stripped.endsWith(suffix) && stripped !== suffix) {
        const prefix = stripped.slice(0, -suffix.length);
        if (prefix.length > 1) {
          variations.add(`${prefix} ${suffix}`);
          variations.add(`${prefix}-${suffix}`);
        }
      }
    });

    return Array.from(variations);
  };

  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const allResults = [];
    
    // Genera variazioni intelligenti (es. "juno" -> "juno", "ju no", "ju-no")
    const searchTerms = generateVariations(query);
    console.log("Searching for variations:", searchTerms);

    try {
      // Cerca in tutte le collezioni in parallelo
      const searchPromises = collections.map(async (collection) => {
        try {
          // Costruisci il filtro: (campo1 ~ var1 OR campo1 ~ var2) OR (campo2 ~ var1 OR ...)
          // Esempio: (name ~ "ogoshi" || name ~ "o goshi")
          const fieldFilters = collection.fields.map(field => {
            const termFilters = searchTerms.map(term => `${field} ~ "${term}"`).join(' || ');
            return `(${termFilters})`;
          }).join(' || ');

          const records = await pb.collection(collection.name).getList(1, 10, {
            filter: fieldFilters,
            requestKey: `search-${collection.name}`,
          });

          return records.items.map(record => ({
            ...record,
            _collection: collection.name,
            _collectionLabel: collection.label,
            _collectionIcon: collection.icon,
            _collectionColor: collection.color,
          }));
        } catch (err) {
          // Ignora errori di cancellazione richiesta
          if (err.isAbort) return [];
          console.error(`Error searching in ${collection.name}:`, err);
          return [];
        }
      });

      const resultsArrays = await Promise.all(searchPromises);
      resultsArrays.forEach(arr => allResults.push(...arr));

      setResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce della ricerca
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Reset quando si chiude
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      setExpandedId(null);
      setSelectedFilter('all');
    }
  }, [isOpen]);

  // Chiudi con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderResultContent = (result) => {
    const collection = result._collection;

    switch (collection) {
      case 'dictionary':
        return (
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{result.term}</h4>
              {result.kanji && <span className="text-xl text-gray-500">{result.kanji}</span>}
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: result.description }}
            />
          </div>
        );

      case 'kata':
        return (
          <div className="space-y-3">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{result.name}</h4>
            <p className="text-lg text-gray-500 dark:text-gray-400 italic mb-2">{result.japanese_name}</p>
            {result.description && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: result.description }}
              />
            )}
            {result.video_url && (
              <a
                href={result.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🎥 Guarda Video
              </a>
            )}
          </div>
        );

      case 'techniques':
        return (
          <div className="space-y-3">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{result.name}</h4>
              <div className="flex gap-2">
                <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{result.group}</span>
                <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{result.category}</span>
              </div>
            </div>
            {result.description && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: result.description }}
              />
            )}
            {result.video_youtube && (
              <a
                href={result.video_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🎥 Guarda su YouTube
              </a>
            )}
            {result.image && (
              <img
                src={`/media/${result.image}`}
                alt={result.name}
                className="w-full max-w-sm rounded-lg"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
          </div>
        );

      case 'quiz_questions':
        return (
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{result.question}</h4>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">✓ Risposta: {result.correct_answer}</span>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-3">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{result.title}</h4>
            {result.description && <p className="text-gray-600 dark:text-gray-300">{result.description}</p>}
            {result.type === 'photo' && result.image && (
              <img
                src={pb.files.getUrl(result, result.image)}
                alt={result.title}
                className="w-full rounded-lg"
                onError={(e) => {
                  // Fallback to /media/ if PB file fails
                  if (!e.target.src.includes('/media/')) {
                    e.target.src = `/media/${result.image}`;
                  } else {
                    e.target.style.display = 'none';
                  }
                }}
              />
            )}
            {result.type === 'video' && result.video_url && (
              <a
                href={result.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🎥 Guarda Video
              </a>
            )}
          </div>
        );

      case 'kaeshi_renraku':
        return (
          <div className="space-y-3">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{result.name}</h4>
            {(result.from_technique || result.to_technique) && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center gap-3">
                {result.from_technique && <span className="font-medium">{result.from_technique}</span>}
                {result.from_technique && result.to_technique && <span className="text-orange-600">→</span>}
                {result.to_technique && <span className="font-medium">{result.to_technique}</span>}
              </div>
            )}
            {result.description && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: result.description }}
              />
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{result.title}</h4>
            {result.subtitle && <p className="text-gray-600 dark:text-gray-400">{result.subtitle}</p>}
            {result.content && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none line-clamp-3"
                dangerouslySetInnerHTML={{ __html: result.content }}
              />
            )}
          </div>
        );
    }
  };

  const getResultTitle = (result) => {
    if (result.term) return result.term;
    if (result.name) return result.name;
    if (result.title) return result.title;
    if (result.question) return result.question.substring(0, 60) + '...';
    return 'Risultato';
  };

  // Filtra i risultati in base al filtro selezionato
  const filteredResults = selectedFilter === 'all'
    ? results
    : results.filter(result => result._collection === selectedFilter);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full h-full md:h-auto md:max-w-4xl md:mx-4 md:my-8 md:max-h-[90vh] bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 md:rounded-t-2xl z-10 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ricerca Globale</h2>
            <button
              onClick={onClose}
              className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cerca in tutto il sito..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all text-lg text-gray-900 dark:text-white"
              autoFocus
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Results Count */}
          {searchQuery.length >= 2 && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {filteredResults.length} {filteredResults.length === 1 ? 'risultato trovato' : 'risultati trovati'}
              {selectedFilter !== 'all' && ` in ${collections.find(c => c.name === selectedFilter)?.label}`}
            </p>
          )}

          {/* Filter Buttons */}
          {searchQuery.length >= 2 && results.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedFilter === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                🌐 Tutte ({results.length})
              </button>
              {collections
                .filter(col => results.some(r => r._collection === col.name))
                .map(collection => {
                  const count = results.filter(r => r._collection === collection.name).length;
                  return (
                    <button
                      key={collection.name}
                      onClick={() => setSelectedFilter(collection.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedFilter === collection.name
                        ? `${collection.color} shadow-md ring-2 ring-offset-1 ring-current`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {collection.icon} {collection.label} ({count})
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="p-4 md:p-6 space-y-3 flex-1 overflow-y-auto">
          {searchQuery.length < 2 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400">
                Digita almeno 2 caratteri per iniziare la ricerca
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Cerca in dizionario, tecniche, quiz, storia, e molto altro...
              </p>
            </div>
          )}

          {searchQuery.length >= 2 && filteredResults.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤷</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                {results.length === 0
                  ? `Nessun risultato trovato per "${searchQuery}"`
                  : `Nessun risultato in ${collections.find(c => c.name === selectedFilter)?.label}`
                }
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {results.length === 0
                  ? 'Prova con termini diversi o controlla l\'ortografia'
                  : 'Prova a selezionare "Tutte" o un\'altra sezione'
                }
              </p>
            </div>
          )}

          {filteredResults.map((result) => (
            <div
              key={`${result._collection}-${result.id}`}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
            >
              {/* Result Header - Clickable */}
              <div
                onClick={() => toggleExpand(result.id)}
                className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${result._collectionColor}`}>
                        {result._collectionIcon} {result._collectionLabel}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                      {getResultTitle(result)}
                    </h3>
                  </div>
                  <button className="shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedId === result.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === result.id && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 bg-white dark:bg-gray-900">
                  {renderResultContent(result)}

                  {/* Jump to Section Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        const routes = {
                          dictionary: `/dizionario?search=${encodeURIComponent(result.term || '')}&id=${result.id}`,
                          techniques: `/tecniche?search=${encodeURIComponent(result.name || '')}&id=${result.id}`,
                          quiz_questions: '/quiz',
                          history: `/storia?search=${encodeURIComponent(result.title || '')}&id=${result.id}`,
                          kata: `/kata?search=${encodeURIComponent(result.name || '')}&id=${result.id}`,
                          fijlkam: `/fijlkam?id=${result.id}`,
                          regulations: `/fijlkam?id=${result.id}`,
                          bulletin_board: `/bacheca?search=${encodeURIComponent(result.title || '')}&id=${result.id}`,
                          gallery: `/gallery?search=${encodeURIComponent(result.title || '')}&id=${result.id}`,
                          exam_program: `/fijlkam?id=${result.id}`,
                          kaeshi_renraku: `/kaeshi-renraku?id=${result.id}`,
                        };
                        const route = routes[result._collection] || '/';
                        onClose();
                        navigate(route);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 text-sm font-bold active:scale-95"
                    >
                      <span>Apri Sezione</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:p-4 md:rounded-b-2xl shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="hidden md:inline">Premi ESC per chiudere</span>
            <span className="md:hidden">ESC per chiudere</span>
            <span className="hidden md:inline">Clicca su un risultato per espanderlo</span>
            <span className="md:hidden">Clicca per espandere</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
