import { createContext, useContext } from 'react';

export interface AppContextValue {
  isDark: boolean;
  isEnglish: boolean;
  isAuthenticated: boolean;
  toggleDark: () => void;
  toggleLang: () => void;
  handleLockToggle: () => void;
}

export const AppContext = createContext<AppContextValue>({
  isDark: false,
  isEnglish: false,
  isAuthenticated: false,
  toggleDark: () => {},
  toggleLang: () => {},
  handleLockToggle: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
