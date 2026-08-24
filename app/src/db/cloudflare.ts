import type { Restaurant } from '../types/restaurant';
import { clearSessionToken, getSessionToken, NotAuthenticatedError } from '../lib/auth';

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
    ...r,
  })) as Restaurant[];
  return cache;
}

async function pushAll(restaurants: Restaurant[]): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new NotAuthenticatedError();
  const res = await fetch(`${API_URL}/api/restaurants`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(restaurants),
  });
  if (res.status === 401) {
    clearSessionToken();
    throw new NotAuthenticatedError();
  }
  if (!res.ok) throw new Error(`Failed to save restaurants: ${res.status}`);
  cache = restaurants;
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/validate`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  return fetchAll();
}

export async function putRestaurant(restaurant: Restaurant): Promise<void> {
  const all = await fetchAll();
  const idx = all.findIndex((r) => r.id === restaurant.id);
  await pushAll(idx >= 0 ? all.with(idx, restaurant) : [...all, restaurant]);
}

export async function bulkImport(restaurants: Restaurant[]): Promise<void> {
  await pushAll(restaurants);
}

