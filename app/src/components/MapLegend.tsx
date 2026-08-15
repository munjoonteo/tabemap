import { useState } from 'react';

interface Props {
  visibleCuisines: string[];
  colors: Record<string, string>;
  onEditColors: () => void;
}

export function MapLegend({ visibleCuisines, colors, onEditColors }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (visibleCuisines.length === 0) return null;

  return (
    <div className="absolute bottom-8 left-3 z-[500]">
      {expanded ? (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-36 max-h-72 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Cuisine
            </span>
            <div className="flex gap-2">
              <button
                onClick={onEditColors}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 leading-none"
              >
                ×
              </button>
            </div>
          </div>
          <div className="overflow-y-auto space-y-1.5">
            {visibleCuisines.map((cuisine) => (
              <div key={cuisine} className="flex items-center gap-2">
                <span
                  className="shrink-0 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"
                  style={{ width: 12, height: 12, backgroundColor: colors[cuisine] ?? '#999' }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{cuisine}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex gap-0.5">
            {visibleCuisines.slice(0, 4).map((c) => (
              <span
                key={c}
                className="rounded-full border border-white dark:border-gray-900"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: colors[c] ?? '#999',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Legend</span>
        </button>
      )}
    </div>
  );
}
