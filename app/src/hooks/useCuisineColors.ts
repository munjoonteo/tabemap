import { useCallback, useState } from 'react';

const PALETTE = [
  '#e74c3c',
  '#e67e22',
  '#f1c40f',
  '#2ecc71',
  '#1abc9c',
  '#3498db',
  '#9b59b6',
  '#e91e63',
  '#00bcd4',
  '#8bc34a',
  '#ff5722',
  '#607d8b',
  '#795548',
  '#ff9800',
  '#673ab7',
];

const LS_KEY = 'tabemap-cuisine-colors';

function loadColors(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function assignDefaults(cuisines: string[], saved: Record<string, string>): Record<string, string> {
  const result = { ...saved };
  let idx = Object.keys(result).length;
  for (const c of cuisines) {
    if (!result[c]) {
      result[c] = PALETTE[idx % PALETTE.length];
      idx++;
    }
  }
  return result;
}

export function useCuisineColors(allCuisines: string[]) {
  const [colors, setColors] = useState<Record<string, string>>(() =>
    assignDefaults(allCuisines, loadColors()),
  );

  // Ensure new cuisines get a color (called when allCuisines changes)
  const ensureColors = useCallback((cuisines: string[]) => {
    setColors((prev) => {
      const next = assignDefaults(cuisines, prev);
      // only update if something changed
      if (
        Object.keys(next).length === Object.keys(prev).length &&
        cuisines.every((c) => prev[c] === next[c])
      )
        return prev;
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setColor = useCallback((cuisine: string, color: string) => {
    setColors((prev) => {
      const next = { ...prev, [cuisine]: color };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetColors = useCallback((cuisines: string[]) => {
    const fresh: Record<string, string> = {};
    cuisines.forEach((c, i) => {
      fresh[c] = PALETTE[i % PALETTE.length];
    });
    localStorage.setItem(LS_KEY, JSON.stringify(fresh));
    setColors(fresh);
  }, []);

  return { colors, ensureColors, setColor, resetColors };
}
