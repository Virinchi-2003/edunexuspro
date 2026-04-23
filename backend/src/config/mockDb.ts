import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface LocalDbSchema {
  schools: any[];
  [key: string]: any[];
}

const ensureDb = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ schools: [] }));
  }
};

export const getCollection = (collectionName: string) => {
  ensureDb();
  const data: LocalDbSchema = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  return data[collectionName] || [];
};

export const saveToCollection = (collectionName: string, item: any) => {
  ensureDb();
  const data: LocalDbSchema = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  if (!data[collectionName]) data[collectionName] = [];
  
  const newItem = { ...item, id: item.id || Date.now().toString(), createdAt: new Date().toISOString() };
  data[collectionName].push(newItem);
  
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  return newItem;
};

export const updateInCollection = (collectionName: string, id: string, updates: any) => {
  ensureDb();
  const data: LocalDbSchema = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const index = data[collectionName].findIndex(i => i.id === id);
  if (index !== -1) {
    data[collectionName][index] = { ...data[collectionName][index], ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return data[collectionName][index];
  }
  return null;
};
