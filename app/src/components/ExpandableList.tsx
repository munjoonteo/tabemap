import { useState, type ReactNode } from 'react';

interface Props {
  label: string;
  headerRight?: ReactNode; // clear button etc
  previewRows?: number; // how many rows to show before truncating
  columns?: number; // columns in the expanded popup
  children: ReactNode; // the actual list items — same markup used in both views
  itemCount: number; // total items, used to decide whether expand button shows
}

export function ExpandableList({
  label,
  headerRight,
  previewRows = 6,
  columns = 3,
  children,
  itemCount,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </label>
          <div className="flex items-center gap-2">
            {headerRight}
            {itemCount > previewRows && (
              <button
                onClick={() => setOpen(true)}
                className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                expand ↗
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1 overflow-y-auto" style={{ maxHeight: `${previewRows * 24}px` }}>
          {children}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{label}</span>
                {headerRight}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <div style={{ columns }}>{children}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
