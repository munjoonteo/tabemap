interface Props {
  allCuisines: string[];
  colors: Record<string, string>;
  onSetColor: (cuisine: string, color: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ColorEditor({ allCuisines, colors, onSetColor, onReset, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Cuisine colours</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Reset to defaults
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {allCuisines.map((cuisine) => (
            <div key={cuisine} className="flex items-center gap-3">
              <input
                type="color"
                value={colors[cuisine] ?? '#999999'}
                onChange={(e) => onSetColor(cuisine, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-600 p-0.5"
              />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cuisine}</span>
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                {colors[cuisine] ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
