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

export async function validateToken(_token: string): Promise<boolean> {
  return true;
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  const db = await getDb();
  const raw = await db.getAll(STORE);
  return raw.map((r: any) => ({
    personal_rating: null,
    ...r,
  })) as Restaurant[];
}

export async function putRestaurant(restaurant: Restaurant): Promise<void> {
  const db = await getDb();
  await db.put(STORE, restaurant);
}

export async function bulkImport(restaurants: Restaurant[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  // Queue all requests synchronously before awaiting any — prevents the engine
  // from auto-committing the transaction when the clear() request completes
  // and the queue momentarily appears empty.
  await Promise.all([tx.store.clear(), ...restaurants.map((r) => tx.store.put(r)), tx.done]);
}

