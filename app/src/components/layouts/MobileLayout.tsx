import { BottomSheet } from '../BottomSheet';
import { DetailPanel } from '../DetailPanel';
import { FilterPanel } from '../FilterPanel';
import { MapLegend } from '../MapLegend';
import { MapView } from '../MapView';
import { RestaurantList } from '../RestaurantList';
import { useAppContext } from '../../contexts/AppContext';
import type { SharedLayoutProps } from './SharedLayoutProps';

export function MobileLayout({
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
  setFilters,
  setSelectedId,
  saveRestaurant,
  exportRestaurants,
  setShowAddForm,
  setShowColorEditor,
  setShowStylePicker,
  importRef,
  bottomSnap = 'peek',
  mobileTab = 'list',
  setBottomSnap,
  setMobileTab,
  handleMobileSelect,
}: SharedLayoutProps) {
  const { isDark, isEnglish, isAuthenticated, toggleDark, toggleLang, handleLockToggle } = useAppContext();

  return (
    <div className="relative w-full h-full">
      <MapView
        restaurants={filtered}
        selectedId={selectedId}
        onSelect={handleMobileSelect ?? setSelectedId}
        colors={colors}
        tileStyle={tileStyle}
        disablePopups
      />
      <MapLegend
        visibleCuisines={visibleCuisines}
        colors={colors}
        onEditColors={() => setShowColorEditor(true)}
      />
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5">
        <button
          onClick={toggleLang}
          className="px-2 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md text-xs border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          <span
            className={
              isEnglish
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'text-gray-400 dark:text-gray-500'
            }
          >
            EN
          </span>
          <span className="text-gray-300 dark:text-gray-600 mx-0.5">/</span>
          <span
            className={
              !isEnglish
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'text-gray-400 dark:text-gray-500'
            }
          >
            JP
          </span>
        </button>
        <button
          onClick={toggleDark}
          className="px-2.5 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setShowStylePicker(true)}
          className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          🗺
        </button>
        <button
          onClick={handleLockToggle}
          className="px-2.5 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          {isAuthenticated ? 'Logout' : 'Login'}
        </button>
      </div>

      <BottomSheet snap={bottomSnap} onSnapChange={setBottomSnap ?? (() => {})}>
        {selectedRestaurant && mobileTab === 'list' && bottomSnap !== 'full' ? (
          <DetailPanel
            restaurant={selectedRestaurant}
            allTags={allTags}
            onSave={saveRestaurant}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
              {(['list', 'filters'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setMobileTab?.(tab);
                    if (bottomSnap === 'peek') setBottomSnap?.('half');
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    mobileTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab === 'list' ? `List (${filtered.length})` : 'Filters'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {mobileTab === 'filters' ? (
                <FilterPanel
                  filters={filters}
                  onChange={setFilters}
                  allCuisines={allCuisines}
                  allTags={allTags}
                  allAreas={allAreas}
                  allRestaurants={restaurants}
                  forCuisineCounts={forCuisineCounts}
                  forAwardCounts={forAwardCounts}
                  forTagCounts={forTagCounts}
                  forAreaCounts={forAreaCounts}
                  cuisineColors={colors}
                  filteredCount={filtered.length}
                  totalCount={restaurants.length}
                  showTitle={false}
                  onAddNew={() => setShowAddForm(true)}
                  onImport={() => importRef.current?.click()}
                  onExport={exportRestaurants}
                />
              ) : (
                <RestaurantList
                  restaurants={filtered}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setBottomSnap?.('half');
                  }}
                  onToggleVisited={
                    isAuthenticated
                      ? (r) => saveRestaurant({ ...r, visited: !r.visited })
                      : undefined
                  }
                  isEnglish={isEnglish}
                />
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
