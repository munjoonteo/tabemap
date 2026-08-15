import { useEffect } from 'react';

interface Shortcuts {
  onCloseDetail: () => void;
  onFocusSearch: () => void;
  onSelectNext: () => void;
  onSelectPrev: () => void;
}

export function useKeyboardShortcuts(
  { onCloseDetail, onFocusSearch, onSelectNext, onSelectPrev }: Shortcuts,
  searchRef: React.RefObject<HTMLInputElement | null>,
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        onCloseDetail();
        if (isTyping) (e.target as HTMLElement).blur();
        return;
      }

      if (isTyping) return;

      if (e.key === '/') {
        e.preventDefault();
        onFocusSearch();
        searchRef.current?.focus();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        onSelectNext();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        onSelectPrev();
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCloseDetail, onFocusSearch, onSelectNext, onSelectPrev, searchRef]);
}
