import { openDB, DBSchema } from 'idb';

export interface FontHistoryItem {
  id: string;
  name: string;
  blob: Blob;
  axes: Record<string, number>;
  features: Record<string, boolean | undefined>;
  lastModified: number;
  textColor?: string;
  bgColor?: string;
  fontSize?: number | '';
  lineHeight?: number | '';
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  previewText?: string;
}

interface FontLabDB extends DBSchema {
  history: {
    key: string;
    value: FontHistoryItem;
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'FontLabDB';
const STORE_NAME = 'history';
const MAX_ITEMS = 10;

export async function initDB() {
  return openDB<FontLabDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-date', 'lastModified');
    },
  });
}

export async function saveFontHistory(item: FontHistoryItem) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(item);
  
  // Enforce max items (FIFO)
  const index = tx.store.index('by-date');
  let cursor = await index.openCursor();
  const count = await tx.store.count();
  
  if (count > MAX_ITEMS) {
    let toDelete = count - MAX_ITEMS;
    while (cursor && toDelete > 0) {
      await cursor.delete();
      cursor = await cursor.continue();
      toDelete--;
    }
  }
  await tx.done;
}

export async function getFontHistoryList(): Promise<Omit<FontHistoryItem, 'blob'>[]> {
  const db = await initDB();
  const items = await db.getAllFromIndex(STORE_NAME, 'by-date');
  // Sort descending (newest first)
  return items.map(({ blob, ...rest }) => rest).sort((a, b) => b.lastModified - a.lastModified);
}

export async function getFontHistoryItem(id: string): Promise<FontHistoryItem | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function clearFontHistory() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}
