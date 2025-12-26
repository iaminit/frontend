import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchModal from './SearchModal';

const Layout = ({ children, title = "JudoOK" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync theme with document class and localStorage
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleTheme = () => setIsDark(!isDark);
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (title) => {
    setExpandedMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const navLinks = [
    { title: 'Home', href: '/' },
    { title: 'Tecniche', href: '/tecniche' },
    { title: 'Kata', href: '/kata' },
    { title: 'Dizionario', href: '/dizionario' },
    {
      title: 'Giochi',
      isSubmenu: true,
      items: [
        { title: 'Quiz Esame', href: '/quiz' },
        { title: 'Gokyo Quiz', href: '/gokyo-game' },
        { title: 'Gokyo-Tris', href: '/gokyo-tris' },
        { title: 'Flash Card', href: '/flash' },
        { title: 'Kaeshi & Renraku', href: '/kaeshi-renraku' },
      ]
    },
    { title: 'Storia', href: '/storia' },
    { title: 'FIJLKAM', href: '/fijlkam' },
    { title: 'Galleria', href: '/gallery' },
    { title: 'Bacheca', href: '/bacheca' },
    { title: 'Archivio', href: '/community' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Left: Logo/Title */}
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 no-underline hover:opacity-80 transition-opacity">
            <img src="/icons/apple-touch-icon.png" alt="Judo Logo" className="h-10 w-auto rounded-lg shadow-sm" />
            <span className="tracking-tight">{title}</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm group"
              aria-label="Toggle Theme"
            >
              <div className="relative w-5 h-5">
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 transform transition-transform duration-500 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-5 h-5 transform transition-transform duration-500 group-hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </div>
            </button>

            {/* Search Icon (Desktop) */}
            <button
              onClick={openSearch}
              className="hidden md:flex p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Cerca"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
              aria-label="Menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-current transform transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-current transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-current transform transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={toggleMenu}
        ></div>

        {/* Drawer Content */}
        <div className={`absolute top-0 right-0 w-72 h-full bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
              <span className="font-bold text-lg text-gray-800 dark:text-white">Menu</span>
              <button onClick={toggleMenu} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.title}>
                    {link.isSubmenu ? (
                      <div>
                        <button
                          onClick={() => toggleSubmenu(link.title)}
                          className="w-full flex justify-between items-center px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium border-l-4 border-transparent"
                        >
                          <span>{link.title}</span>
                          <span className={`text-xs transition-transform duration-200 ${expandedMenus[link.title] ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        <div className={`bg-gray-50 dark:bg-gray-850 overflow-hidden transition-all duration-300 ${expandedMenus[link.title] ? 'max-h-64' : 'max-h-0'}`}>
                          {link.items.map(subItem => (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              onClick={toggleMenu}
                              className="block px-10 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              • {subItem.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={link.href}
                        onClick={toggleMenu}
                        className="block px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium border-l-4 border-transparent hover:border-red-500"
                      >
                        {link.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
              JudoOK App v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 flex-grow">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 pb-safe z-30 md:hidden">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-red-600 dark:text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium mt-1">Home</span>
          </Link>

          <button
            onClick={openSearch}
            className="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <div className="bg-red-600 text-white rounded-full p-3 -mt-6 shadow-lg border-4 border-white dark:border-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium mt-1">Cerca</span>
          </button>

          <Link to="/tecniche" className="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs font-medium mt-1">Tecniche</span>
          </Link>
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </div>
  );
};

export default Layout;
