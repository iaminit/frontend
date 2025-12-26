import PocketBase from 'pocketbase';

// Replace with your actual PocketBase URL. 
// For local development, it's usually http://127.0.0.1:8090
const url = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(url);
