import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

// Timeline component with expand/collapse
const TimelineSection = ({ items, targetId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Show timeline only when expanded */}
      {isExpanded && (
        <div className="relative border-l-4 border-red-200 dark:border-red-900/50 ml-6 md:ml-12 space-y-10 pb-8 animate-in fade-in slide-in-from-top duration-500">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative pl-8 md:pl-12 group animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Dot */}
              <div className="absolute -left-[11px] top-2 w-6 h-6 rounded-full bg-red-600 border-4 border-white dark:border-gray-900 group-hover:scale-125 transition-transform"></div>

              <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all ${item.id === targetId ? 'animate-term-highlight' : ''}`}>
                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold mb-3 shadow-md">
                  {item.year}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expand/Collapse Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span>{isExpanded ? 'Nascondi cronologia' : `Mostra cronologia (${items.length} eventi)`}</span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </>
  );
};

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [timelineItems, setTimelineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('storia'); // 'storia' or 'valori'
  const [searchTerm, setSearchTerm] = useState('');
  const [targetId, setTargetId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    const searchParam = params.get('search');

    if (idParam) {
      setTargetId(idParam);
      if (idParam === 'h4') setSelectedTab('valori');
      setTimeout(() => setTargetId(null), 3000);
    }

    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, timelineData] = await Promise.all([
          pb.collection('history').getFullList({ requestKey: null }),
          pb.collection('timeline_history').getFullList({ sort: 'year', requestKey: null })
        ]);

        setHistoryItems(historyData);
        setTimelineItems(timelineData);
      } catch (err) {
        console.error("Error fetching history:", err);
        setHistoryItems([]);
        setTimelineItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Storia del Judo">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  // Filter items based on search term
  const filteredHistory = historyItems.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const valuesItem = filteredHistory.find(item => item.id === 'h4');
  const otherHistoryItems = filteredHistory.filter(item => item.id !== 'h4');

  return (
    <Layout title="Storia del Judo">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-4xl mx-auto">
              🥋
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Storia del Judo</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">La Via della Cedevolezza - Dalle origini ad oggi</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto px-4">
          <input
            type="text"
            placeholder="Cerca nella storia, date o valori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-red-500 outline-none transition-all text-lg shadow-sm"
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

        {/* Tabs */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSelectedTab('storia')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedTab === 'storia'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            📖 Storia
          </button>
          <button
            onClick={() => setSelectedTab('valori')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedTab === 'valori'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            🎯 Valori
          </button>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'storia' ? (
          <>
            {/* History Articles */}
            <section className="space-y-8">
              <div className="grid gap-8">
                {otherHistoryItems.map((item, index) => (
                  <article
                    key={item.id}
                    className={`bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all ${item.id === targetId ? 'animate-term-highlight' : ''
                      }`}
                  >
                    {item.image && (
                      <div className="relative h-80 flex items-center justify-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <img
                          src={`/media/${item.image}`}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain p-6 mix-blend-multiply dark:mix-blend-screen"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md">
                          Capitolo {index + 1}
                        </div>
                      </div>
                    )}

                    <div className="p-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h2>
                      {item.subtitle && (
                        <h3 className="text-lg text-red-600 dark:text-red-400 font-medium mb-6">{item.subtitle}</h3>
                      )}

                      <div
                        className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Timeline */}
            {timelineItems.length > 0 && (
              <section className="mt-16">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cronologia Storica</h2>
                  <p className="text-gray-600 dark:text-gray-400">Le tappe fondamentali del Judo nel mondo</p>
                </div>

                <TimelineSection items={timelineItems} targetId={targetId} />
              </section>
            )}
          </>
        ) : (
          /* Values Section */
          valuesItem && (
            <article className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{valuesItem.title}</h2>
              {valuesItem.subtitle && (
                <h3 className="text-lg text-red-600 dark:text-red-400 font-medium mb-6">{valuesItem.subtitle}</h3>
              )}

              <div
                className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: valuesItem.content }}
              />
            </article>
          )
        )}

      </div>
    </Layout>
  );
};

export default History;
