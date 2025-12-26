import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const Kata = () => {
  const [katas, setKatas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await pb.collection('kata').getFullList({
          sort: 'name',
        });
        setKatas(records);
      } catch (err) {
        console.error("Error fetching kata:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Kata">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  // Filter katas based on search term
  const filteredKatas = katas.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.japanese_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Kata">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">形 Kata</h1>
          <p className="text-gray-600 dark:text-gray-400">Le forme tradizionali del Judo</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10 px-4">
          <input
            type="text"
            placeholder="Cerca un Kata (es. Nage No Kata)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-orange-500 outline-none transition-all text-lg shadow-sm"
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

        <div className="grid gap-6 md:grid-cols-2">
          {filteredKatas.length > 0 ? (
            filteredKatas.map((item) => {
              // Generate slug from name if not available
              const slug = item.slug || item.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

              return (
                <Link
                  key={item.id}
                  to={`/kata/${slug}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all group block"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{item.name}</h2>
                      {item.level && (
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold uppercase">
                          {item.level}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg text-gray-500 dark:text-gray-400 mb-4 italic">{item.japanese_name}</h3>

                    {item.description && (
                      <div
                        className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      {item.video_url && (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(item.video_url, '_blank');
                          }}
                          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                          </svg>
                          Video
                        </span>
                      )}
                      <span className="text-orange-600 dark:text-orange-400 font-medium group-hover:translate-x-1 transition-transform">
                        Scopri di più →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Nessun risultato</h3>
              <p className="text-gray-500 dark:text-gray-400">Non abbiamo trovato Kata che corrispondano a "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Kata;
