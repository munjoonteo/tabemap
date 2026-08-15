import { useRef, useState } from 'react';
import { tCuisine } from '../lib/translations';
import { PRICE_TIER_LABELS } from '../types/restaurant';
import type { Restaurant } from '../types/restaurant';

interface Props {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisited?: (r: Restaurant) => void;
  isEnglish: boolean;
}

const SWIPE_THRESHOLD = 60;

function SwipeableRow({
  r,
  selectedId,
  onSelect,
  onToggleVisited,
  isEnglish,
}: {
  r: Restaurant;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisited?: (r: Restaurant) => void;
  isEnglish: boolean;
}) {
  const startX = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    setSwiping(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!swiping) return;
    const dx = e.clientX - startX.current;
    setSwipeX(Math.max(-SWIPE_THRESHOLD * 1.2, Math.min(SWIPE_THRESHOLD * 1.2, dx)));
  }

  function onPointerUp() {
    if (Math.abs(swipeX) >= SWIPE_THRESHOLD && onToggleVisited) {
      onToggleVisited(r);
    }
    setSwipeX(0);
    setSwiping(false);
  }

  const isRight = swipeX > 0;
  const progress = Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1);
  const triggered = Math.abs(swipeX) >= SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
      {/* swipe hint background */}
      {swiping && Math.abs(swipeX) > 8 && (
        <div
          className={`absolute inset-0 flex items-center ${isRight ? 'justify-start pl-3' : 'justify-end pr-3'} transition-colors ${
            triggered
              ? r.visited
                ? 'bg-red-50 dark:bg-red-950'
                : 'bg-green-50 dark:bg-green-950'
              : 'bg-gray-50 dark:bg-gray-800'
          }`}
        >
          <span
            className={`text-xs font-medium ${triggered ? (r.visited ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400') : 'text-gray-400 dark:text-gray-500'}`}
            style={{ opacity: progress }}
          >
            {isRight
              ? r.visited
                ? 'Unmark visited'
                : '✓ Mark visited'
              : r.visited
                ? 'Unmark visited'
                : '✓ Mark visited'}
          </span>
        </div>
      )}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => onSelect(r.id)}
        style={{
          transform: swiping ? `translateX(${swipeX}px)` : 'none',
          transition: swiping ? 'none' : 'transform 0.2s ease',
        }}
        className={`relative w-full flex items-start gap-2 px-3 py-2 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-pan-y ${
          selectedId === r.id ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-l-blue-500' : ''
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
              {r.name}
            </span>
            {r.visited && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold leading-none shrink-0">
                ✓
              </span>
            )}
            <div className="shrink-0 flex items-center gap-1">
              {r.awards?.some((a) => a.type === 'gold') && (
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 inline-block shrink-0" />
              )}
              {r.awards?.some((a) => a.type === 'silver') && (
                <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500 border border-gray-400 dark:border-gray-400 inline-block shrink-0" />
              )}
              {r.awards?.some((a) => a.type === 'bronze') && (
                <span className="w-3 h-3 rounded-full bg-amber-600 border border-amber-700 inline-block shrink-0" />
              )}
              {r.awards?.some((a) => a.type === 'hyakumeiten') && (
                <span className="text-red-500 dark:text-red-400 text-xs font-bold border border-red-300 dark:border-red-700 rounded-full px-1 leading-tight">
                  百
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {tCuisine(r.cuisine, isEnglish)} · {PRICE_TIER_LABELS[r.price_tier]}
            {' · '}★ {r.tabelog_rating.toFixed(2)}
            {r.personal_rating != null ? ` · ♥ ${r.personal_rating.toFixed(1)}` : ''}
          </div>
        </div>
      </button>
    </div>
  );
}

export function RestaurantList({
  restaurants,
  selectedId,
  onSelect,
  onToggleVisited,
  isEnglish,
}: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-900">
        No restaurants match your filters
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
        {restaurants.map((r) => (
          <SwipeableRow
            key={r.id}
            r={r}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggleVisited={onToggleVisited}
            isEnglish={isEnglish}
          />
        ))}
      </div>
    </div>
  );
}
