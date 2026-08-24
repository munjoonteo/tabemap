import { groupAreasByPrefecture } from '../lib/areas';
import { AWARD_ACTIVE, AWARD_INACTIVE, AWARD_TYPES } from '../lib/awards';
import { tArea, tCuisine, tPrefecture } from '../lib/translations';
import {
  AWARD_LABELS,
  PRICE_TIER_LABELS,
  PRICE_TIER_TOOLTIPS,
  extractArea,
} from '../types/restaurant';
import type {
  FilterState,
  PriceTier,
  Restaurant,
  SortKey,
  VisitedFilter,
} from '../types/restaurant';
import { tagColor } from '../lib/tags';
import { useAppContext } from '../contexts/AppContext';
import { ExpandableList } from './ExpandableList';
import { Tooltip } from './Tooltip';

const PRICE_TIERS: PriceTier[] = [1, 2, 3, 4];

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  allCuisines: string[];
  allTags: string[];
  allAreas: string[];
  allRestaurants: Restaurant[];
  forCuisineCounts: Restaurant[];
  forAwardCounts: Restaurant[];
  forTagCounts: Restaurant[];
  forAreaCounts: Restaurant[];
  cuisineColors: Record<string, string>;
  filteredCount: number;
  totalCount: number;
  showTitle?: boolean;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onAddNew: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function FilterPanel({
  filters,
  onChange,
  allCuisines,
  allTags,
  allAreas,
  allRestaurants,
  forCuisineCounts,
  forAwardCounts,
  forTagCounts,
  forAreaCounts,
  cuisineColors,
  filteredCount,
  totalCount,
  showTitle = true,
  searchRef,
  onAddNew,
  onImport,
  onExport,
}: Props) {
  const { isDark, isEnglish, isAuthenticated, toggleDark, toggleLang, handleLockToggle } =
    useAppContext();
  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const sortedCuisines = isEnglish
    ? [...allCuisines].sort((a, b) => tCuisine(a, true).localeCompare(tCuisine(b, true)))
    : allCuisines;

  // faceted counts — each uses the subset that excludes its own filter
  // cuisine and area are OR filters: counts show availability under all other filters
  // tags are AND filters: counts show intersection with currently selected tags
  const cuisineCounts = Object.fromEntries(
    allCuisines.map((c) => [c, forCuisineCounts.filter((r) => r.cuisine === c).length]),
  );
  const awardCounts = Object.fromEntries(
    AWARD_TYPES.map((t) => [
      t,
      forAwardCounts.filter((r) => r.awards?.some((a) => a.type === t)).length,
    ]),
  );
  // for each tag, count restaurants that match all other active filters AND all currently
  // selected tags AND this tag — so selecting one tag makes non-overlapping tags show zero
  const tagCounts = Object.fromEntries(
    allTags.map((tag) => [
      tag,
      forTagCounts.filter(
        (r) => r.tags.includes(tag) && filters.tags.every((selected) => r.tags.includes(selected)),
      ).length,
    ]),
  );
  const areaCounts = Object.fromEntries(
    allAreas.map((area) => [
      area,
      forAreaCounts.filter((r) => extractArea(r.address) === area).length,
    ]),
  );

  const areaGroups = groupAreasByPrefecture(allRestaurants);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">食べマップ</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={isEnglish ? 'Switch to Japanese' : 'Switch to English'}
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
                className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button
                onClick={handleLockToggle}
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {isAuthenticated ? 'Logout' : 'Login'}
              </button>
            </div>
          </div>
        )}
        <input
          ref={searchRef}
          type="text"
          placeholder="Search… (press / to focus)"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Sort + Visited */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Sort
            </label>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="rating">★ Tabelog rating</option>
              <option value="personal_rating">♥ My rating</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Visited
            </label>
            <select
              value={filters.visited}
              onChange={(e) => onChange({ ...filters, visited: e.target.value as VisitedFilter })}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">All</option>
              <option value="unvisited">Not visited</option>
              <option value="visited">Visited</option>
            </select>
          </div>
        </div>

        {/* Price tier */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Price
          </label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {PRICE_TIERS.map((value) => (
              <Tooltip key={value} text={PRICE_TIER_TOOLTIPS[value]}>
                <button
                  onClick={() =>
                    onChange({ ...filters, price_tiers: toggle(filters.price_tiers, value) })
                  }
                  className={`px-3 py-1 rounded-full text-sm border transition-colors shrink-0 ${
                    filters.price_tiers.includes(value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  {PRICE_TIER_LABELS[value]}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Tabelog rating */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tabelog Rating ≥ {filters.tabelog_rating_min.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={filters.tabelog_rating_min}
            onChange={(e) =>
              onChange({ ...filters, tabelog_rating_min: parseFloat(e.target.value) })
            }
            className="w-full mt-2 accent-blue-600"
          />
        </div>

        {/* Awards */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Awards
          </label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {AWARD_TYPES.map((type) => (
              <button
                key={type}
                onClick={() =>
                  onChange({ ...filters, award_types: toggle(filters.award_types, type) })
                }
                className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                  filters.award_types.includes(type)
                    ? AWARD_ACTIVE[type]
                    : `bg-white dark:bg-gray-800 ${AWARD_INACTIVE[type]}`
                }`}
              >
                {AWARD_LABELS[type]} <span className="opacity-70">({awardCounts[type] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine */}
        {sortedCuisines.length > 0 && (
          <ExpandableList
            label="Cuisine"
            itemCount={sortedCuisines.length}
            previewRows={8}
            columns={2}
            headerRight={
              filters.cuisines.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, cuisines: [] })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  clear
                </button>
              )
            }
          >
            {sortedCuisines.map((cuisine) => {
              const count = cuisineCounts[cuisine] ?? 0;
              const checked = filters.cuisines.includes(cuisine);
              return (
                <label
                  key={cuisine}
                  className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-1 py-0.5 rounded break-inside-avoid ${count === 0 && !checked ? 'opacity-40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({ ...filters, cuisines: toggle(filters.cuisines, cuisine) })
                    }
                    className="accent-blue-600"
                    disabled={count === 0 && !checked}
                  />
                  <span
                    className="shrink-0 rounded-full border-2 border-white shadow-sm"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: cuisineColors[cuisine] ?? '#999',
                    }}
                  />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {tCuisine(cuisine, isEnglish)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                </label>
              );
            })}
          </ExpandableList>
        )}

        {/* Area */}
        {allAreas.length > 0 && (
          <ExpandableList
            label="Area"
            itemCount={allAreas.length}
            previewRows={6}
            columns={3}
            headerRight={
              filters.areas.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, areas: [] })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  clear
                </button>
              )
            }
          >
            {areaGroups.map(({ pref, areas }) => (
              <div key={pref} className="break-inside-avoid mb-3">
                <div className="text-xs font-medium text-gray-400 px-1 mb-1">
                  {tPrefecture(pref, isEnglish)}
                </div>
                {areas.map((area) => {
                  const count = areaCounts[area] ?? 0;
                  const checked = filters.areas.includes(area);
                  return (
                    <label
                      key={area}
                      className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-1 py-0.5 rounded ${count === 0 && !checked ? 'opacity-40' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange({ ...filters, areas: toggle(filters.areas, area) })
                        }
                        className="accent-blue-600"
                        disabled={count === 0 && !checked}
                      />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {tArea(area, isEnglish)}
                      </span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </ExpandableList>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Tags
              </label>
              {filters.tags.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, tags: [] })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map((tag) => {
                const color = tagColor(tag);
                const active = filters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onChange({ ...filters, tags: toggle(filters.tags, tag) })}
                    style={
                      active
                        ? { backgroundColor: color, borderColor: color, color: 'white' }
                        : isDark
                          ? { borderColor: color, color: '#e5e7eb' }
                          : { borderColor: color, color: color }
                    }
                    className={`px-2 py-1 rounded-full text-xs border transition-colors bg-white dark:bg-gray-800 ${tagCounts[tag] === 0 && !active ? 'opacity-40' : ''}`}
                  >
                    {tag} <span className="opacity-70">({tagCounts[tag] ?? 0})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {filteredCount} / {totalCount} restaurants
        </div>
        {isAuthenticated && (
          <>
            <button
              onClick={onAddNew}
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Restaurant
            </button>
            <div className="flex gap-2">
              <button
                onClick={onImport}
                className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Import JSON
              </button>
              <button
                onClick={onExport}
                className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
