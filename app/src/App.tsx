import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddRestaurantForm } from './components/AddRestaurantForm';
import { AuthGate } from './components/AuthGate';
import { ColorEditor } from './components/ColorEditor';
import { MapStylePicker } from './components/MapStylePicker';
import { DesktopLayout } from './components/layouts/DesktopLayout';
import { MobileLayout } from './components/layouts/MobileLayout';
import { AppContext } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';
import { useCuisineColors } from './hooks/useCuisineColors';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRestaurants } from './hooks/useRestaurants';
import type { SnapPoint } from './components/BottomSheet';
import type { Restaurant } from './types/restaurant';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function App() {
  // ── data & filters ──────────────────────────────────────────────────────────
  const {
    restaurants,
    filtered,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    loading,
    error,
    allCuisines,
    allTags,
    allAreas,
    forCuisineCounts,
    forAwardCounts,
    forTagCounts,
    forAreaCounts,
    saveRestaurant,
    addRestaurant,
    importRestaurants,
    exportRestaurants,
  } = useRestaurants();

  // ── app-wide settings ───────────────────────────────────────────────────────
  const { isAuthenticated, login, logout } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [isEnglish, setIsEnglish] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  function handleLockToggle() {
    if (isAuthenticated) logout();
    else setShowAuthGate(true);
  }

  // ── cuisine colours ─────────────────────────────────────────────────────────
  const { colors, ensureColors, setColor, resetColors } = useCuisineColors(allCuisines);
  useEffect(() => {
    ensureColors(allCuisines);
  }, [allCuisines, ensureColors]);

  // ── ui state ─────────────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [tileStyle, setTileStyle] = useState('voyager');
  const [fitToBounds, setFitToBounds] = useState(0);

  // mobile-only
  const [bottomSnap, setBottomSnap] = useState<SnapPoint>('peek');
  const [mobileTab, setMobileTab] = useState<'list' | 'filters'>('list');

  const importRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // ── keyboard shortcuts ──────────────────────────────────────────────────────
  const handleMobileSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileTab('list');
    setBottomSnap('half');
  }, []);

  useKeyboardShortcuts(
    {
      onCloseDetail: () => setSelectedId(null),
      onFocusSearch: () => {},
      onSelectNext: () => {
        if (filtered.length === 0) return;
        const idx = filtered.findIndex((r) => r.id === selectedId);
        setSelectedId(filtered[Math.min(idx + 1, filtered.length - 1)].id);
      },
      onSelectPrev: () => {
        if (filtered.length === 0) return;
        const idx = filtered.findIndex((r) => r.id === selectedId);
        setSelectedId(filtered[Math.max(idx - 1, 0)].id);
      },
    },
    searchRef,
  );

  // ── derived ──────────────────────────────────────────────────────────────────
  const visibleCuisines = useMemo(
    () => [...new Set(filtered.map((r) => r.cuisine))].sort(),
    [filtered],
  );
  const selectedRestaurant = filtered.find((r) => r.id === selectedId) ?? null;

  // ── import handler ───────────────────────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text) as Restaurant[];
    await importRestaurants(data);
    e.target.value = '';
  }

  async function handleAdd(data: Omit<Restaurant, 'id'>) {
    await addRestaurant(data);
    setShowAddForm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 dark:text-gray-400 p-8">
        <p className="text-sm font-medium">Failed to load restaurants</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  // shared props passed to both layouts
  const layoutProps = {
    restaurants,
    filtered,
    filters,
    selectedRestaurant,
    selectedId,
    allCuisines,
    allTags,
    allAreas,
    forCuisineCounts,
    forAwardCounts,
    forTagCounts,
    forAreaCounts,
    colors,
    visibleCuisines,
    tileStyle,
    fitToBounds,
    setFilters,
    setSelectedId,
    saveRestaurant,
    addRestaurant,
    importRestaurants,
    exportRestaurants,
    setColor,
    resetColors,
    setTileStyle,
    setFitToBounds,
    showAddForm,
    showStylePicker,
    showColorEditor,
    setShowAddForm,
    setShowStylePicker,
    setShowColorEditor,
    importRef,
    searchRef,
  };

  return (
    <AppContext.Provider
      value={{
        isDark,
        isEnglish,
        isAuthenticated,
        toggleDark,
        toggleLang: () => setIsEnglish((e) => !e),
        handleLockToggle,
      }}
    >
      <div className="flex h-full w-full overflow-hidden">
        {isMobile ? (
          <MobileLayout
            {...layoutProps}
            bottomSnap={bottomSnap}
            mobileTab={mobileTab}
            setBottomSnap={setBottomSnap}
            setMobileTab={setMobileTab}
            handleMobileSelect={handleMobileSelect}
          />
        ) : (
          <DesktopLayout {...layoutProps} />
        )}

        {/* global overlays */}
        {showAuthGate && <AuthGate onLogin={login} onClose={() => setShowAuthGate(false)} />}

        {showColorEditor && (
          <ColorEditor
            allCuisines={allCuisines}
            colors={colors}
            onSetColor={setColor}
            onReset={() => resetColors(allCuisines)}
            onClose={() => setShowColorEditor(false)}
          />
        )}

        {showStylePicker && (
          <MapStylePicker onPick={setTileStyle} onClose={() => setShowStylePicker(false)} />
        )}

        {showAddForm && (
          <AddRestaurantForm
            allCuisines={allCuisines}
            allTags={allTags}
            onSubmit={handleAdd}
            onClose={() => setShowAddForm(false)}
          />
        )}

        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </AppContext.Provider>
  );
}
