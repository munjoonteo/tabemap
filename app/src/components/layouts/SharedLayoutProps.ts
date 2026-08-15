import type { RefObject } from 'react';
import type { Restaurant, FilterState } from '../../types/restaurant';
import type { SnapPoint } from '../BottomSheet';

export interface SharedLayoutProps {
  // data
  restaurants: Restaurant[];
  filtered: Restaurant[];
  filters: FilterState;
  selectedRestaurant: Restaurant | null;
  selectedId: string | null;
  allCuisines: string[];
  allTags: string[];
  allAreas: string[];
  allRestaurants: Restaurant[];
  forCuisineCounts: Restaurant[];
  forAwardCounts: Restaurant[];
  forTagCounts: Restaurant[];
  forAreaCounts: Restaurant[];
  colors: Record<string, string>;
  visibleCuisines: string[];
  tileStyle: string;
  fitToBounds: number;

  // actions
  setFilters: (f: FilterState) => void;
  setSelectedId: (id: string | null) => void;
  saveRestaurant: (r: Restaurant) => void;
  addRestaurant: (data: Omit<Restaurant, 'id' | 'added_at'>) => void;
  importRestaurants: (data: Restaurant[]) => void;
  exportRestaurants: () => void;
  setColor: (cuisine: string, color: string) => void;
  resetColors: (cuisines: string[]) => void;
  setTileStyle: (s: string) => void;
  setFitToBounds: (fn: (n: number) => number) => void;

  // ui state
  showAddForm: boolean;
  showStylePicker: boolean;
  showColorEditor: boolean;
  setShowAddForm: (v: boolean) => void;
  setShowStylePicker: (v: boolean) => void;
  setShowColorEditor: (v: boolean) => void;

  // refs
  importRef: RefObject<HTMLInputElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;

  // mobile only
  bottomSnap?: SnapPoint;
  mobileTab?: 'list' | 'filters';
  setBottomSnap?: (s: SnapPoint) => void;
  setMobileTab?: (t: 'list' | 'filters') => void;
  handleMobileSelect?: (id: string) => void;
}
