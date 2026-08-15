export type PriceTier = 1 | 2 | 3 | 4;

export type AwardType = 'hyakumeiten' | 'silver' | 'gold' | 'bronze';

export interface Award {
  type: AwardType; // which award
  category?: string; // e.g. "French", "Hamburger" (hyakumeiten only)
  year: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: string;
  price_tier: PriceTier;
  tabelog_rating: number;
  personal_rating: number | null;
  tabelog_url: string;
  awards: Award[];
  tags: string[]; // manual tags only
  notes: string;
  visited: boolean;
  scraped_at: string;
  added_at: string;
}

// Extract ward/city from a Japanese address e.g. "東京都渋谷区..." → "渋谷区"
export function extractArea(address: string): string {
  const m = address.match(/([^\s都道府県市区]+[市区])/);
  return m ? m[1] : '';
}

// Some addresses omit the prefecture and start with the city (e.g. "京都市...")
// Map these ambiguous extractions back to the correct full prefecture name
// 京都市 addresses sometimes omit 京都府, causing the regex to stop at
// the 都 in 京都 rather than the 府 suffix — normalise back to full name
const CITY_TO_PREF: Record<string, string> = {
  京都: '京都府',
};

export function extractPrefecture(address: string): string {
  const m = address.match(/^(.+?[都道府県])/);
  if (!m) return '他';
  return CITY_TO_PREF[m[1]] ?? m[1];
}

export type SortKey = 'name' | 'rating' | 'personal_rating' | 'added';
export type VisitedFilter = 'all' | 'visited' | 'unvisited';

export interface FilterState {
  search: string;
  cuisines: string[];
  price_tiers: PriceTier[];
  tabelog_rating_min: number;
  tabelog_rating_max: number;
  award_types: AwardType[];
  tags: string[];
  areas: string[];
  visited: VisitedFilter;
  sort: SortKey;
}

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  1: '¥',
  2: '¥¥',
  3: '¥¥¥',
  4: '¥¥¥¥',
};

// shown on hover
export const PRICE_TIER_TOOLTIPS: Record<PriceTier, string> = {
  1: 'under ¥1,000',
  2: '¥1,000–2,000',
  3: '¥2,000–5,000',
  4: '¥5,000+',
};

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  cuisines: [],
  price_tiers: [],
  tabelog_rating_min: 3,
  tabelog_rating_max: 5,
  award_types: [],
  tags: [],
  areas: [],
  visited: 'all',
  sort: 'rating',
};

export const AWARD_LABELS: Record<AwardType, string> = {
  hyakumeiten: '百名店',
  silver: 'Silver',
  gold: 'Gold',
  bronze: 'Bronze',
};
