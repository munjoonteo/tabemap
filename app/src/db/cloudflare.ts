import type { Restaurant } from '../types/restaurant';
import { getSessionToken, NotAuthenticatedError } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

// In-memory cache so reads after the first load are instant
let cache: Restaurant[] | null = null;

async function fetchAll(): Promise<Restaurant[]> {
  if (cache) return cache;
  const res = await fetch(`${API_URL}/api/restaurants`);
  if (!res.ok) throw new Error(`Failed to fetch restaurants: ${res.status}`);
  const data = (await res.json()) as any[];
  cache = data.map((r: any) => ({
    personal_rating: null,
    scraped_at: r.added_at ?? new Date().toISOString(),
    ...r,
  })) as Restaurant[];
  return cache;
}

async function pushAll(restaurants: Restaurant[]): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new NotAuthenticatedError();
  cache = restaurants;
  const res = await fetch(`${API_URL}/api/restaurants`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(restaurants),
  });
  if (res.status === 401) {
    // Token is wrong — clear it so the auth gate re-prompts
    sessionStorage.removeItem('tabemap_token');
    throw new NotAuthenticatedError();
  }
  if (!res.ok) throw new Error(`Failed to save restaurants: ${res.status}`);
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  return fetchAll();
}

export async function putRestaurant(restaurant: Restaurant): Promise<void> {
  const all = await fetchAll();
  const idx = all.findIndex((r) => r.id === restaurant.id);
  await pushAll(idx >= 0 ? all.with(idx, restaurant) : [...all, restaurant]);
}

export async function deleteRestaurant(id: string): Promise<void> {
  const all = await fetchAll();
  await pushAll(all.filter((r) => r.id !== id));
}

export async function bulkImport(restaurants: Restaurant[]): Promise<void> {
  await pushAll(restaurants);
}

export async function clearAll(): Promise<void> {
  await pushAll([]);
}
