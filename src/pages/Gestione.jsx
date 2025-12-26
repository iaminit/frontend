import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const CollectionCard = ({ name, icon, count, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all cursor-pointer group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <div className="text-3xl font-black text-gray-900 dark:text-white">
        {count}
      </div>
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
      {name}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      Gestisci contenuti
    </p>
  </div>
);

const Gestione = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Check if already authenticated
    const authData = pb.authStore.model;
    if (authData) {
      setIsAuthenticated(true);
      loadStats();
    }
    setLoading(false);
  }, []);

  const loadStats = async () => {
    try {
      const collections = [
        { name: 'dictionary', label: 'Dizionario', icon: '📖' },
        { name: 'techniques', label: 'Tecniche', icon: '🥋' },
        { name: 'quiz_questions', label: 'Quiz', icon: '❓' },
        { name: 'bulletin_board', label: 'Bacheca', icon: '📌' },
        { name: 'gallery', label: 'Galleria', icon: '📸' },
        { name: 'kaeshi_renraku', label: 'Kaeshi & Renraku', icon: '🔄' }
      ];

      const counts = {};
      for (const col of collections) {
        try {
          const records = await pb.collection(col.name).getList(1, 1);
          counts[col.name] = {
            count: records.totalItems || 0,
            label: col.label,
            icon: col.icon
          };
        } catch (err) {
          console.error(`Error loading ${col.name}:`, err);
          counts[col.name] = { count: 0, label: col.label, icon: col.icon };
        }
      }

      setStats(counts);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      await pb.collection('users').authWithPassword(username, password);
      setIsAuthenticated(true);
      await loadStats();
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Credenziali non valide. Riprova.');
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const openPocketBaseAdmin = () => {
    // Open PocketBase admin UI
    const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090';
    window.open(`${pbUrl}/_/`, '_blank');
  };

  if (loading) {
    return (
      <Layout title="Gestione">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout title="Gestione">
        <div className="max-w-md mx-auto mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                🔐
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Area Amministrazione</h1>
              <p className="text-gray-600 dark:text-gray-400">Accedi per gestire i contenuti</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username o Email
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Accedi
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Accesso riservato agli amministratori
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestione">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Pannello di Gestione</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Benvenuto, <span className="font-medium">{pb.authStore.model?.username || 'Admin'}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Azioni Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={openPocketBaseAdmin}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all rounded-xl p-4 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-bold group-hover:underline">Apri PocketBase Admin</h3>
                  <p className="text-sm text-white/80">Gestisci database e collezioni</p>
                </div>
              </div>
            </button>

            <a
              href="/"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all rounded-xl p-4 text-left group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  🏠
                </div>
                <div>
                  <h3 className="font-bold group-hover:underline">Torna alla Home</h3>
                  <p className="text-sm text-white/80">Visualizza il sito pubblico</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Collections Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Statistiche Collezioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats).map(([key, data]) => (
              <CollectionCard
                key={key}
                name={data.label}
                icon={data.icon}
                count={data.count}
                onClick={openPocketBaseAdmin}
              />
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex gap-4">
            <div className="text-4xl">ℹ️</div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Gestione Contenuti</h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                Utilizza il pannello PocketBase Admin per gestire tutti i contenuti del sito.
                Puoi aggiungere, modificare ed eliminare record dalle collezioni, caricare file media,
                e configurare le impostazioni del database.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-bold">Collezioni disponibili:</span> Dizionario, Tecniche, Quiz, Bacheca, Galleria, Kaeshi & Renraku
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-bold">Funzionalità:</span> CRUD completo, upload file, gestione utenti, backup/restore
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-3xl mb-2">🗄️</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Database</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">SQLite via PocketBase</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Backend</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">PocketBase REST API</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-3xl mb-2">⚛️</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Frontend</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">React 18 + Vite</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Gestione;
