import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';

let dbInstance = null;
let initPromise = null;

export const useJudoDB = () => {
  const [db, setDb] = useState(dbInstance);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!dbInstance);

  useEffect(() => {
    if (dbInstance) {
      setLoading(false);
      return;
    }

    if (!initPromise) {
      initPromise = (async () => {
        try {
          const SQL = await initSqlJs({
            locateFile: file => `/${file}`
          });

          const response = await fetch('/judo.sqlite');
          if (!response.ok) {
            throw new Error(`Failed to load database: ${response.statusText}`);
          }
          
          const buffer = await response.arrayBuffer();
          dbInstance = new SQL.Database(new Uint8Array(buffer));
          return dbInstance;
        } catch (err) {
          console.error("Database initialization error:", err);
          throw err;
        }
      })();
    }

    initPromise
      .then((database) => {
        setDb(database);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const execQuery = (query, params = []) => {
    if (!db) return [];
    try {
      // sql.js returns [{columns: [...], values: [...]}]
      const results = db.exec(query, params);
      if (results.length === 0) return [];

      const { columns, values } = results[0];
      return values.map(row => {
        return columns.reduce((obj, col, index) => {
          obj[col] = row[index];
          return obj;
        }, {});
      });
    } catch (err) {
      console.error("Query error:", err);
      return [];
    }
  };

  return { db, loading, error, execQuery };
};
