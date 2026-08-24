import type { Restaurant } from '../types/restaurant';

// Determine adapter at module load time based on whether the API URL is configured.
// Vite inlines import.meta.env values at build time so the unused branch is tree-shaken.
const adapter = import.meta.env.VITE_API_URL
  ? await import('./cloudflare')
  : await import('./indexdb');

export const validateToken = (token: string): Promise<boolean> => adapter.validateToken(token);
export const getAllRestaurants = (): Promise<Restaurant[]> => adapter.getAllRestaurants();
export const putRestaurant = (r: Restaurant): Promise<void> => adapter.putRestaurant(r);
export const bulkImport = (rs: Restaurant[]): Promise<void> => adapter.bulkImport(rs);
