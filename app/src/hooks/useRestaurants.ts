import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { bulkImport, clearAll, deleteRestaurant, getAllRestaurants, putRestaurant } from '../db';
import { CUISINE_EN, AREA_EN } from '../lib/translations';
import {
  DEFAULT_FILTERS,
  extractArea,
  type FilterState,
  type Restaurant,
} from '../types/restaurant';

function applyFilters(restaurants: Restaurant[], filters: FilterState): Restaurant[] {
  const result = restaurants.filter((r) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inName = r.name.toLowerCase().includes(q);
      const inAddress = r.address.toLowerCase().includes(q);
      const inTags = r.tags.some((t) => t.toLowerCase().includes(q));
      const inNotes = r.notes.toLowerCase().includes(q);
      const inCuisineEn = (CUISINE_EN[r.cuisine] ?? '').toLowerCase().includes(q);
      const inAreaEn = Object.entries(AREA_EN).some(
        ([ja, en]) => r.address.includes(ja) && en.toLowerCase().includes(q),
      );
      if (!inName && !inAddress && !inTags && !inNotes && !inCuisineEn && !inAreaEn) return false;
    }
    if (filters.cuisines.length > 0 && !filters.cuisines.includes(r.cuisine)) return false;
    if (filters.price_tiers.length > 0 && !filters.price_tiers.includes(r.price_tier)) return false;
    if (
      r.tabelog_rating < filters.tabelog_rating_min ||
      r.tabelog_rating > filters.tabelog_rating_max
    )
      return false;
    if (
      filters.award_types.length > 0 &&
      !filters.award_types.some((t) => r.awards?.some((a) => a.type === t))
    )
      return false;
    if (filters.tags.length > 0 && !filters.tags.every((t) => r.tags.includes(t))) return false;
    if (filters.areas.length > 0 && !filters.areas.includes(extractArea(r.address))) return false;
    if (filters.visited === 'visited' && !r.visited) return false;
    if (filters.visited === 'unvisited' && r.visited) return false;
    return true;
  });

  return result.sort((a, b) => {
    if (filters.sort === 'rating') return b.tabelog_rating - a.tabelog_rating;
    if (filters.sort === 'personal_rating')
      return (b.personal_rating ?? 0) - (a.personal_rating ?? 0);
    if (filters.sort === 'name') return a.name.localeCompare(b.name, 'ja');
    if (filters.sort === 'added') return b.added_at.localeCompare(a.added_at);
    return 0;
  });
}

function applyFiltersExcept(
  restaurants: Restaurant[],
  filters: FilterState,
  exclude: keyof FilterState,
): Restaurant[] {
  return applyFilters(restaurants, { ...filters, [exclude]: DEFAULT_FILTERS[exclude] });
}

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    getAllRestaurants().then((data) => {
      setRestaurants(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => applyFilters(restaurants, filters), [restaurants, filters]);

  const allCuisines = useMemo(
    () => [...new Set(restaurants.map((r) => r.cuisine))].sort(),
    [restaurants],
  );
  const allTags = useMemo(
    () => [...new Set(restaurants.flatMap((r) => r.tags))].sort(),
    [restaurants],
  );
  const allAreas = useMemo(
    () => [...new Set(restaurants.map((r) => extractArea(r.address)).filter(Boolean))].sort(),
    [restaurants],
  );

  // faceted subsets — each excludes its own filter so counts reflect other active filters
  const forCuisineCounts = useMemo(
    () => applyFiltersExcept(restaurants, filters, 'cuisines'),
    [restaurants, filters],
  );
  const forAwardCounts = useMemo(
    () => applyFiltersExcept(restaurants, filters, 'award_types'),
    [restaurants, filters],
  );
  const forTagCounts = useMemo(
    () => applyFiltersExcept(restaurants, filters, 'tags'),
    [restaurants, filters],
  );
  const forAreaCounts = useMemo(
    () => applyFiltersExcept(restaurants, filters, 'areas'),
    [restaurants, filters],
  );

  const saveRestaurant = useCallback(async (restaurant: Restaurant) => {
    await putRestaurant(restaurant);
    setRestaurants((prev) => {
      const idx = prev.findIndex((r) => r.id === restaurant.id);
      return idx >= 0 ? prev.with(idx, restaurant) : [...prev, restaurant];
    });
  }, []);

  const addRestaurant = useCallback(
    async (data: Omit<Restaurant, 'id' | 'added_at'>) => {
      const restaurant: Restaurant = { ...data, id: uuidv4(), added_at: new Date().toISOString() };
      await saveRestaurant(restaurant);
      return restaurant;
    },
    [saveRestaurant],
  );

  const removeRestaurant = useCallback(async (id: string) => {
    await deleteRestaurant(id);
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    if (selectedIdRef.current === id) setSelectedId(null);
  }, []);

  const importRestaurants = useCallback(async (data: Restaurant[]) => {
    await bulkImport(data);
    setRestaurants(data);
  }, []);

  const exportRestaurants = useCallback(() => {
    const blob = new Blob([JSON.stringify(restaurants, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaurants.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [restaurants]);

  const clearData = useCallback(async () => {
    await clearAll();
    setRestaurants([]);
    setSelectedId(null);
  }, []);

  return {
    restaurants,
    filtered,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    loading,
    allCuisines,
    allTags,
    allAreas,
    forCuisineCounts,
    forAwardCounts,
    forTagCounts,
    forAreaCounts,
    saveRestaurant,
    addRestaurant,
    removeRestaurant,
    importRestaurants,
    exportRestaurants,
    clearData,
  };
}
