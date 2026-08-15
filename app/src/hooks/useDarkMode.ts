import { useState, useEffect } from 'react';

const KEY = 'tabemap-dark-mode';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(KEY);
    return stored === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(KEY, String(isDark));
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
