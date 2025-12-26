import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const Regulations = () => {
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await pb.collection('regulations').getFullList({
          sort: 'title',
        });
        setRegulations(records);
      } catch (err) {
        console.error("Error fetching regulations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Arbitraggio">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Arbitraggio">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Arbitraggio</h1>
          <p className="text-gray-600 dark:text-gray-400">Regolamenti e norme di gara</p>
        </div>

        {regulations.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h2>
              {item.link_external && (
                <a 
                  href={item.link_external} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors text-yellow-600"
                  title="Link Esterno"
                >
                  🔗
                </a>
              )}
            </div>
            
            {item.subtitle && <h3 className="text-lg text-yellow-600 font-medium mb-4">{item.subtitle}</h3>}

            <div 
              className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Regulations;
