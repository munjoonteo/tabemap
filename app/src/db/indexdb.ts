import { openDB, type IDBPDatabase } from 'idb';
import type { Restaurant } from '../types/restaurant';

const DB_NAME = 'tabelog-companion';
const DB_VERSION = 1;
const STORE = 'restaurants';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  const db = await getDb();
  const raw = await db.getAll(STORE);
  return raw.map((r: any) => ({
    personal_rating: null,
    scraped_at: r.added_at ?? new Date().toISOString(),
    ...r,
  })) as Restaurant[];
}

export async function putRestaurant(restaurant: Restaurant): Promise<void> {
  const db = await getDb();
  await db.put(STORE, restaurant);
}

export async function deleteRestaurant(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function bulkImport(restaurants: Restaurant[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all([...restaurants.map((r) => tx.store.put(r)), tx.done]);
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}
