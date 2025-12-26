import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { pb } from '../lib/pocketbase';

const TechniqueCard = ({ technique, onClick }) => (
    <div
        onClick={() => onClick(technique)}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group"
    >
        {technique.image_path && (
            <img
                src={technique.image_path.startsWith('http') ? technique.image_path : `/media/${technique.image_path}`}
                alt={technique.name_japanese}
                className="w-full h-40 object-contain mb-4 rounded-lg bg-gray-50 dark:bg-gray-900"
                onError={(e) => e.target.style.display = 'none'}
            />
        )}
        <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {technique.name_japanese}
        </h4>
        {technique.name_kanji && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{technique.name_kanji}</p>
        )}
        <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">{technique.name_italian}</p>
    </div>
);

const KataDetail = () => {
    const { slug } = useParams();
    const [kata, setKata] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTechnique, setSelectedTechnique] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Try to fetch from PocketBase first
                const kataRecords = await pb.collection('kata').getFullList({
                    filter: `slug = "${slug}" || name ~ "${slug}"`,
                    requestKey: null
                });

                if (kataRecords.length > 0) {
                    const kataRecord = kataRecords[0];
                    setKata(kataRecord);

                    // Try to fetch sections from kata_sections collection
                    try {
                        const sectionRecords = await pb.collection('kata_sections').getFullList({
                            filter: `kata_id = "${kataRecord.id}"`,
                            sort: 'order',
                            requestKey: null
                        });

                        // For each section, fetch techniques
                        const sectionsWithTechniques = await Promise.all(
                            sectionRecords.map(async (section) => {
                                try {
                                    const techniques = await pb.collection('kata_techniques').getFullList({
                                        filter: `section_id = "${section.id}"`,
                                        sort: 'order',
                                        requestKey: null
                                    });
                                    return { ...section, techniques };
                                } catch {
                                    return { ...section, techniques: [] };
                                }
                            })
                        );

                        setSections(sectionsWithTechniques);
                    } catch (err) {
                        console.error('Error fetching kata_sections:', err);
                        setSections([]);
                    }
                }
            } catch (err) {
                console.error("Error fetching kata detail:", err);
                setKata(null);
                setSections([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <Layout title="Kata">
                <div className="flex justify-center items-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </Layout>
        );
    }

    if (!kata) {
        return (
            <Layout title="Kata non trovato">
                <div className="max-w-4xl mx-auto text-center py-16">
                    <div className="text-6xl mb-4">🥋</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Kata non trovato</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">Il kata "{slug}" non è stato trovato.</p>
                    <Link
                        to="/kata"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold"
                    >
                        ← Torna ai Kata
                    </Link>
                </div>
            </Layout>
        );
    }

    const title = kata.romanized_title || kata.name || 'Kata';
    const kanjiTitle = kata.kanji_title || kata.japanese_name || '';

    return (
        <Layout title={title}>
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <Link
                    to="/kata"
                    className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-8 transition-colors"
                >
                    ← Torna ai Kata
                </Link>

                {/* Japanese Style Header */}
                <header className="text-center mb-12 py-8 border-b-2 border-orange-200 dark:border-orange-900/30">
                    {kanjiTitle && (
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'var(--font-japanese, serif)' }}>
                            {kanjiTitle}
                        </h1>
                    )}
                    <h2 className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        {title}
                    </h2>
                    {kata.subtitle && (
                        <p className="text-xl text-gray-600 dark:text-gray-400">{kata.subtitle}</p>
                    )}
                </header>

                {/* Introduction Card */}
                <section className="mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {kata.image && (
                            <div className="relative h-64 md:h-80 bg-gray-100 dark:bg-gray-900">
                                <img
                                    src={kata.image.startsWith('http') ? kata.image : `/media/${kata.image}`}
                                    alt={title}
                                    className="w-full h-full object-contain"
                                    onError={(e) => e.target.parentElement.style.display = 'none'}
                                />
                            </div>
                        )}
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {kata.intro_title || 'Introduzione'}
                            </h3>
                            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: kata.intro_content || kata.description }} />

                            {/* Video Button */}
                            {kata.video_url && (
                                <a
                                    href={kata.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                                    </svg>
                                    Guarda Video Completo
                                </a>
                            )}

                            {/* Special Video Links (for Goshin) */}
                            {kata.video_links && kata.video_links.length > 0 && (
                                <div className="mt-8">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Video Tutorial</h4>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {kata.video_links.map((video, idx) => (
                                            <a
                                                key={idx}
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                ▶ {video.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Technique Sections */}
                {sections.length > 0 && (
                    <section className="space-y-12">
                        {sections.map((section) => (
                            <div key={section.id} className="space-y-6">
                                <div className="text-center">
                                    <h3
                                        className="text-3xl font-bold mb-2"
                                        style={{ color: section.color || '#c0392b' }}
                                    >
                                        {section.kanji_title && (
                                            <span className="block text-4xl mb-2" style={{ fontFamily: 'var(--font-japanese, serif)' }}>
                                                {section.kanji_title}
                                            </span>
                                        )}
                                        {section.romanized_title || section.title}
                                    </h3>
                                    {section.description && (
                                        <p className="text-gray-600 dark:text-gray-400">{section.description}</p>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {section.techniques?.map((technique) => (
                                        <TechniqueCard
                                            key={technique.id}
                                            technique={technique}
                                            onClick={setSelectedTechnique}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Footer Notes */}
                {kata.footer_content && (
                    <section className="mt-12">
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-3xl p-8 border border-orange-200 dark:border-orange-800/30">
                            <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                                {kata.footer_title || 'Note'}
                            </h3>
                            <div className="text-orange-800 dark:text-orange-200 prose prose-orange dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: kata.footer_content }} />
                        </div>
                    </section>
                )}
            </div>

            {/* Technique Modal */}
            {selectedTechnique && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedTechnique(null)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedTechnique.name_japanese}
                                </h2>
                                {selectedTechnique.name_kanji && (
                                    <p className="text-gray-500 dark:text-gray-400">{selectedTechnique.name_kanji}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedTechnique(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Image */}
                            {selectedTechnique.image_path && (
                                <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                                    <img
                                        src={selectedTechnique.image_path.startsWith('http') ? selectedTechnique.image_path : `/media/${selectedTechnique.image_path}`}
                                        alt={selectedTechnique.name_japanese}
                                        className="w-full object-contain max-h-80"
                                    />
                                </div>
                            )}

                            <p className="text-orange-600 dark:text-orange-400 font-bold text-lg mb-4">
                                {selectedTechnique.name_italian}
                            </p>

                            {selectedTechnique.description_content && (
                                <div
                                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: selectedTechnique.description_content }}
                                />
                            )}

                            {selectedTechnique.defense_notes && (
                                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <strong className="text-blue-900 dark:text-blue-300">Note difensive:</strong>
                                    <span className="text-blue-800 dark:text-blue-200 ml-2">{selectedTechnique.defense_notes}</span>
                                </div>
                            )}

                            {selectedTechnique.video_youtube && (
                                <div className="mt-6">
                                    <a
                                        href={selectedTechnique.video_youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        ▶ Guarda Video
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default KataDetail;
