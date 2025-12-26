import initSqlJs from 'sql.js';

let db = null;
let SQL = null;

export const initDatabase = async () => {
  if (db) return db;

  try {
    // Initialize SQL.js
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Fetch the database file
    const response = await fetch('/judo.sqlite');
    const buffer = await response.arrayBuffer();

    // Create database instance
    db = new SQL.Database(new Uint8Array(buffer));

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Dictionary queries
export const getDictionaryTerms = () => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dizionario ORDER BY termine ASC');
  const results = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      termine: row.termine,
      pronuncia: row.pronuncia,
      descrizione: row.descrizione,
      kanji: row.kanji,
      audio_file: row.audio_file,
      has_audio: !!row.audio_file
    });
  }

  stmt.free();
  return results;
};

export const searchDictionaryTerms = (searchTerm) => {
  const db = getDatabase();
  const normalizedSearch = searchTerm.toLowerCase().replace(/-/g, ' ');

  const stmt = db.prepare(`
    SELECT * FROM dizionario
    WHERE LOWER(termine) LIKE ?
       OR LOWER(REPLACE(termine, '-', ' ')) LIKE ?
    ORDER BY termine ASC
  `);

  stmt.bind([`%${searchTerm}%`, `%${normalizedSearch}%`]);

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      termine: row.termine,
      pronuncia: row.pronuncia,
      descrizione: row.descrizione,
      kanji: row.kanji,
      audio_file: row.audio_file,
      has_audio: !!row.audio_file
    });
  }

  stmt.free();
  return results;
};

export const filterDictionaryByLetter = (letter) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM dizionario
    WHERE UPPER(SUBSTR(termine, 1, 1)) = ?
    ORDER BY termine ASC
  `);

  stmt.bind([letter.toUpperCase()]);

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      termine: row.termine,
      pronuncia: row.pronuncia,
      descrizione: row.descrizione,
      kanji: row.kanji,
      audio_file: row.audio_file,
      has_audio: !!row.audio_file
    });
  }

  stmt.free();
  return results;
};

export const getAvailableLetters = () => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT DISTINCT UPPER(SUBSTR(termine, 1, 1)) as letter
    FROM dizionario
    ORDER BY letter ASC
  `);

  const letters = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    letters.push(row.letter);
  }

  stmt.free();
  return letters;
};

// Quiz queries
export const getQuizQuestions = ({ danLevel, count = 10, category }) => {
  const db = getDatabase();

  let query = 'SELECT * FROM quiz_questions WHERE 1=1';
  const params = [];

  if (danLevel && danLevel !== 'musashi' && danLevel !== 'mifune' && danLevel !== 'kano') {
    // Logic for specific Dan levels (usually cumulative or specific? 
    // The PHP app seems to filtering by specific level based on the dropdown).
    // If the schema stores '1', '2' etc. as text or number.
    // Based on typical Judo exams, you might need previous levels too, 
    // but let's implement strict filtering first to match the selector.
    query += ' AND dan_level = ?';
    params.push(danLevel);
  }

  // Handle Special Modes (Musashi, Mifune, Kano) - usually implies all questions or specific sets
  // For 'musashi', user selects count from slider (1-100), standard pool (often mixed).
  // For 'mifune' (99) and 'kano' (100), it's usually a large random set.
  // If danLevel is one of these keys, we might want to ignore the 'dan_level' filter 
  // and just fetch random questions from ALL levels.

  if (category && category !== 'mista' && category !== 'generale') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(count);

  const stmt = db.prepare(query);
  stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id,
      question: row.question,
      options: [row.option_a, row.option_b, row.option_c, row.option_d],
      correctAnswer: row.correct_answer, // 1-based index usually
      explanation: row.explanation,
      image_path: row.image_path,
      category: row.category,
      dan_level: row.dan_level
    });
  }

  stmt.free();
  return results;
};

// Technique queries
export const getTechniques = (groupBy = 'group') => { // groupBy: 'group' (Gokyo) or 'category' (Te-waza etc)
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM techniques ORDER BY "order" ASC, dan_level ASC');
  const techniques = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    techniques.push(row);
  }
  stmt.free();

  if (groupBy === 'group') {
    // Group by Gokyo groups (Dai Ikkyo, Dai Nikyo...)
    const groups = {};
    techniques.forEach(tech => {
      const g = tech.group || 'Altre';
      if (!groups[g]) groups[g] = [];
      groups[g].push(tech);
    });
    return groups;
  } else if (groupBy === 'category') {
    // Group by type (Te-waza, Koshi-waza...)
    const categories = {};
    techniques.forEach(tech => {
      const c = tech.category || 'Altre';
      if (!categories[c]) categories[c] = [];
      categories[c].push(tech);
    });
    return categories;
  }

  return techniques;
};

export const getTechniqueById = (id) => {
  const db = getDatabase();
  // Assuming ID is string from PB
  const stmt = db.prepare('SELECT * FROM techniques WHERE id = ?');
  stmt.bind([id]);

  let technique = null;
  if (stmt.step()) {
    technique = stmt.getAsObject();
  }
  stmt.free();
  return technique;
};
