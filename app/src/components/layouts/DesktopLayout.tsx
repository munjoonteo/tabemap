import { DetailPanel } from '../DetailPanel';
import { FilterPanel } from '../FilterPanel';
import { MapLegend } from '../MapLegend';
import { MapView } from '../MapView';
import { RestaurantList } from '../RestaurantList';
import { useAppContext } from '../../contexts/AppContext';
import type { SharedLayoutProps } from './SharedLayoutProps';

export function DesktopLayout({
  restaurants,
  filtered,
  filters,
  selectedRestaurant,
  selectedId,
  allCuisines,
  allTags,
  allAreas,
  allRestaurants,
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
  exportRestaurants,
  setFitToBounds,
  setShowAddForm,
  setShowColorEditor,
  setShowStylePicker,
  importRef,
  searchRef,
}: SharedLayoutProps) {
  const { isDark, isEnglish, isAuthenticated, toggleDark, toggleLang, handleLockToggle } =
    useAppContext();

  return (
    <>
      <div className="w-96 shrink-0 flex flex-col h-full">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          allCuisines={allCuisines}
          allTags={allTags}
          allAreas={allAreas}
          allRestaurants={allRestaurants}
          forCuisineCounts={forCuisineCounts}
          forAwardCounts={forAwardCounts}
          forTagCounts={forTagCounts}
          forAreaCounts={forAreaCounts}
          cuisineColors={colors}
          filteredCount={filtered.length}
          totalCount={restaurants.length}
          searchRef={searchRef}
          isAuthenticated={isAuthenticated}
          isDark={isDark}
          isEnglish={isEnglish}
          onAddNew={() => setShowAddForm(true)}
          onImport={() => importRef.current?.click()}
          onExport={exportRestaurants}
          onLockToggle={handleLockToggle}
          onDarkToggle={toggleDark}
          onLangToggle={toggleLang}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative">
          <MapView
            restaurants={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            colors={colors}
            tileStyle={tileStyle}
            fitToBounds={fitToBounds}
          />
          <MapLegend
            visibleCuisines={visibleCuisines}
            colors={colors}
            onEditColors={() => setShowColorEditor(true)}
          />
          <div className="absolute top-3 right-3 z-[500] flex gap-1.5">
            <button
              onClick={() => setFitToBounds((n) => n + 1)}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              ⊡ Fit
            </button>
            <button
              onClick={() => setShowStylePicker(true)}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              🗺 Style
            </button>
          </div>
        </div>
        <div className="h-48 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <RestaurantList
            restaurants={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleVisited={
              isAuthenticated ? (r) => saveRestaurant({ ...r, visited: !r.visited }) : undefined
            }
            isEnglish={isEnglish}
          />
        </div>
      </div>

      {selectedRestaurant && (
        <div className="w-72 shrink-0 border-l border-gray-200 dark:border-gray-700">
          <DetailPanel
            restaurant={selectedRestaurant}
            allTags={allTags}
            isAuthenticated={isAuthenticated}
            isDark={isDark}
            isEnglish={isEnglish}
            onSave={saveRestaurant}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </>
  );
}
