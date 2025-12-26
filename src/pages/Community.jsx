import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BlogCard from '../components/BlogCard';
import BlogModal from '../components/BlogModal';
import { pb } from '../lib/pocketbase';

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState('all');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const records = await pb.collection('post').getFullList({
          sort: '-date',
          filter: 'expiration_date != "" && expiration_date <= @now'
        });
        setPosts(records);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPost(null), 300); // Delay per animazione
  };

  // Estrai anni unici dai post
  const availableYears = [...new Set(posts.map(post => {
    return new Date(post.date).getFullYear();
  }))].sort((a, b) => b - a);

  // Estrai attività uniche dai post
  const availableActivities = [...new Set(posts.map(post => post.activity).filter(Boolean))].sort();

  // Filtra i post in base all'anno e all'attività selezionati
  const filteredPosts = posts.filter(post => {
    const yearMatch = selectedYear === 'all' || new Date(post.date).getFullYear() === parseInt(selectedYear);
    const activityMatch = selectedActivity === 'all' || post.activity === selectedActivity;
    return yearMatch && activityMatch;
  });

  if (loading) {
    return (
      <Layout title="Archivio">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Archivio">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Archivio News
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Storico delle notizie passate
          </p>
        </div>

        {/* Filters and View Mode in One Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center">
          {/* Filters Container */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            {/* Year Filter */}
            {availableYears.length > 0 && (
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Filtra per Anno
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedYear === 'all'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Tutti
                  </button>
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year.toString())}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedYear === year.toString()
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Filter */}
            {availableActivities.length > 0 && (
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Filtra per Attività
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedActivity('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedActivity === 'all'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Tutte
                  </button>
                  {availableActivities.map(activity => (
                    <button
                      key={activity}
                      onClick={() => setSelectedActivity(activity)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedActivity === activity
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 lg:ml-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Visualizzazione griglia"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Visualizzazione lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Posts Grid/List */}
        {filteredPosts.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'grid grid-cols-1 gap-4'
            }
          >
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} onClick={handlePostClick} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">
              Nessun post disponibile
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Torna presto per nuovi contenuti!
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <BlogModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Layout>
  );
};

export default Community;
