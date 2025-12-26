import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const Program = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDan, setActiveDan] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await pb.collection('exam_program').getFullList({
          sort: 'order',
        });
        setPrograms(records);
      } catch (err) {
        console.error("Error fetching exam program:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPrograms = programs.filter(p => p.dan_level === activeDan);

  if (loading) {
    return (
      <Layout title="Programma Esami">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Programma Esami">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Programma Esami</h1>
          <p className="text-gray-600 dark:text-gray-400">Requisiti per il passaggio di grado</p>
        </div>

        {/* Dan Selector */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[1, 2, 3, 4, 5].map((dan) => (
            <button
              key={dan}
              onClick={() => setActiveDan(dan)}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                activeDan === dan
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {dan}° DAN
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase">
                    {item.section_type}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                </div>
                
                <div 
                  className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Nessun programma trovato per questo livello.</p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Program;
