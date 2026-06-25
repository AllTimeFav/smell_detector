import { create } from 'zustand';

const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
};

export const useThemeStore = create((set) => ({
  isDark: getSystemTheme(), // Default to system theme
  toggleTheme: () => set((state) => {
    const newDark = !state.isDark;
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark: newDark };
  }),
  setTheme: (isDark) => set(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark };
  }),
}));
