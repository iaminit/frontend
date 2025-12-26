import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const sections = [
  {
    id: 'judo',
    title: 'Il Judo',
    items: [
      { id: 'storia', title: 'Storia del Judo', desc: 'Origini, filosofia e fondatore', icon: '/icons/home_v2/storia.webp', color: 'red', link: '/storia' },
      { id: 'kata', title: 'Kata', desc: 'Le forme tradizionali', icon: '/icons/home_v2/kata.webp', color: 'orange', link: '/kata' },
      { id: 'tecniche', title: 'Tecniche', desc: 'Tutte le tecniche (Gokyo)', icon: '/icons/home_v2/tecniche.webp', color: 'green', link: '/tecniche' },
      { id: 'fijlkam', title: 'FIJLKAM', desc: 'Federazione Italiana', icon: '/icons/home_v2/fijlkam.webp', color: 'blue', link: '/fijlkam' },
    ]
  },
  {
    id: 'strumenti',
    title: 'Strumenti di Studio',
    items: [
      { id: 'dizionario', title: 'Dizionario', desc: 'Terminologia giapponese', icon: '/icons/home_v2/dizionario.webp', color: 'orange', link: '/dizionario' },
      {
        id: 'giochi-group',
        title: 'Giochi',
        desc: 'Quiz, Gokyo, Tris, Flash Cards e Kaeshi',
        icon: '🎮',
        type: 'emoji',
        color: 'blue',
        isAccordion: true,
        items: [
          { id: 'quiz', title: 'Quiz Esame', desc: 'Mettiti alla prova', icon: '/icons/home_v2/quiz.webp', color: 'purple', link: '/quiz' },
          { id: 'gokyo-game', title: 'Gokyo Quiz', desc: 'Indovina il gruppo', icon: '❓', type: 'emoji', color: 'red', link: '/gokyo-game' },
          { id: 'gokyo-tris', title: 'Gokyo-Tris', desc: 'Impara giocando', icon: '🕹️', type: 'emoji', color: 'blue', link: '/gokyo-tris' },
          { id: 'flash', title: 'Flash Card', desc: 'Ripasso veloce', icon: '🎴', type: 'emoji', color: 'green', link: '/flash' },
          { id: 'kaeshi', title: 'Kaeshi & Renraku', desc: 'Contrattacchi e combinazioni', icon: '/icons/home_v2/kaeshi.webp', color: 'purple', link: '/kaeshi-renraku' },
        ]
      },
      { id: 'gallery', title: 'Galleria', desc: 'Foto e video', icon: '/icons/home_v2/galleria.webp', color: 'indigo', link: '/gallery' },
    ]
  },
  {
    id: 'community',
    title: 'Community',
    items: [
      { id: 'bacheca', title: 'Bacheca', desc: 'Annunci e news', icon: '/icons/home_v2/bacheca.webp', color: 'red', link: '/bacheca' },
      { id: 'archivio', title: 'Archivio', desc: 'News passate', icon: '📚', type: 'emoji', color: 'blue', link: '/community' },
    ]
  }
];

const colorMap = {
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  green: 'bg-green-100 text-green-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  blue: 'bg-blue-100 text-blue-600',
};

const ListItem = ({ item }) => (
  <Link
    to={item.link}
    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform duration-100 mb-3"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 ${colorMap[item.color] || 'bg-gray-100 text-gray-600'}`}>
      {item.type === 'emoji' ? (
        <span className="text-2xl">{item.icon}</span>
      ) : (
        <img src={item.icon} alt={item.title} className="w-8 h-8 object-contain" loading="lazy" />
      )}
    </div>
    <div className="flex-1">
      <div className="font-bold text-gray-900 dark:text-white text-base leading-tight">{item.title}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</div>
    </div>
    <div className="text-gray-300 text-2xl font-light pl-2">›</div>
  </Link>
);

const AccordionItem = ({ group }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 ${colorMap[group.color]}`}>
          <span className="text-2xl text-blue-600">{group.icon}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-gray-900 dark:text-white text-base leading-tight">{group.title}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{group.desc}</div>
        </div>
        <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-3 ml-4' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-2 border-l-2 border-blue-500/20 pl-4 py-1">
          {group.items.map((item) => (
            <ListItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <Layout title="Home">
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="section-group">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="flex flex-col">
              {section.items.map((item) =>
                item.isAccordion ? (
                  <AccordionItem key={item.id} group={item} />
                ) : (
                  <ListItem key={item.id} item={item} />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Home;
