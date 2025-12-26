import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

// Timeline component with expand/collapse for FIJLKAM
const FijlkamTimeline = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Show timeline only when expanded */}
      {isExpanded && (
        <div className="relative border-l-4 border-blue-200 dark:border-blue-900/50 ml-6 md:ml-12 space-y-10 pb-8 animate-in fade-in slide-in-from-top duration-500">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative pl-8 md:pl-12 group animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Dot */}
              <div className="absolute -left-[11px] top-2 w-6 h-6 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 group-hover:scale-125 transition-transform"></div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all">
                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold mb-3 shadow-md">
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
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
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

const Fijlkam = () => {
  const [items, setItems] = useState([]);
  const [timelineItems, setTimelineItems] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'champions', 'belts', 'arbitraggio', 'history'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fijlkamResult, tlResult, regResult] = await Promise.allSettled([
          pb.collection('fijlkam').getFullList({ requestKey: null }),
          pb.collection('timeline_fijlkam').getFullList({ sort: 'year', requestKey: null }),
          pb.collection('regulations').getFullList({ sort: 'title', requestKey: null })
        ]);

        if (fijlkamResult.status === 'fulfilled') {
          setItems(fijlkamResult.value);
        }

        if (tlResult.status === 'fulfilled') {
          setTimelineItems(tlResult.value);
        }

        if (regResult.status === 'fulfilled') {
          setRegulations(regResult.value);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setItems([]);
        setTimelineItems([]);
        setRegulations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="FIJLKAM">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Separate items by section field (from DB) or fallback to ID matching
  const infoItems = items.filter(item => item.section === 'info');
  const infoItem = infoItems[0] || items.find(item => item.id === 'f1') || items[0];
  const structureItem = infoItems[1] || items.find(item => item.id === 'f2') || items[1];
  const championsItem = items.find(item => item.section === 'campioni') || items.find(item => item.id === 'f3') || items[2];
  const beltsItem = items.find(item => item.section === 'cinture') || items.find(item => item.id === 'f4') || items[3];
  const comitatoItem = items.find(item => item.section === 'comitati') || items.find(item => item.id === 'f5') || items[4];

  return (
    <Layout title="FIJLKAM">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg">
              🇮🇹
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">FIJLKAM</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Federazione Italiana Judo Lotta Karate Arti Marziali</p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              Dal 2002
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              100.000+ Tesserati
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              2.000+ Società
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'info'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            ℹ️ Info
          </button>
          <button
            onClick={() => setActiveTab('champions')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'champions'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            🏆 Campioni
          </button>
          <button
            onClick={() => setActiveTab('belts')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'belts'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            🥋 Cinture
          </button>
          <button
            onClick={() => setActiveTab('comitato')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'comitato'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            🗺️ Comitati
          </button>
          <button
            onClick={() => setActiveTab('arbitraggio')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'arbitraggio'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            ⚖️ Arbitraggio
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            📅 Storia
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'info' && (
          <div className="space-y-8">
            {infoItem && (
              <article className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{infoItem.title}</h2>
                <div
                  className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: infoItem.content }}
                />
              </article>
            )}

            {structureItem && (
              <article className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{structureItem.title}</h2>
                <div
                  className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: structureItem.content }}
                />
              </article>
            )}
          </div>
        )}

        {activeTab === 'champions' && championsItem && (
          <article className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{championsItem.title}</h2>
            <div
              className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: championsItem.content }}
            />
          </article>
        )}

        {activeTab === 'belts' && beltsItem && (
          <article className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{beltsItem.title}</h2>
            <div
              className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: beltsItem.content }}
            />
          </article>
        )}

        {activeTab === 'comitato' && comitatoItem && (
          <article className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{comitatoItem.title}</h2>
            <div
              className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: comitatoItem.content }}
            />
          </article>
        )}

        {activeTab === 'arbitraggio' && regulations.length > 0 && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Regolamento e Arbitraggio</h2>
              <p className="text-gray-600 dark:text-gray-400">Norme ufficiali di gara e categorie</p>
            </div>

            {regulations.map((item) => (
              <article key={item.id} className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                    {item.subtitle && (
                      <h4 className="text-lg text-yellow-600 dark:text-yellow-400 font-medium">{item.subtitle}</h4>
                    )}
                  </div>
                  {item.link_external && (
                    <a
                      href={item.link_external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors text-sm font-medium"
                      title="Link al regolamento ufficiale"
                    >
                      🔗 Regolamento IJF
                    </a>
                  )}
                </div>

                <div
                  className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </article>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cronologia Storica</h2>
              <p className="text-gray-600 dark:text-gray-400">Le tappe fondamentali della FIJLKAM</p>
            </div>

            {timelineItems.length > 0 ? (
              <FijlkamTimeline items={timelineItems} />
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Nessun evento storico disponibile.</p>
              </div>
            )}
          </section>
        )}

        {/* External Link */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Sito Ufficiale FIJLKAM</h3>
          <p className="mb-4 text-blue-100">Per informazioni ufficiali, regolamenti e calendario gare</p>
          <a
            href="https://www.fijlkam.it"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            Visita fijlkam.it ↗
          </a>
        </div>

      </div>
    </Layout>
  );
};

export default Fijlkam;
