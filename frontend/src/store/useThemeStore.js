import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  isDark: true, // Default to dark theme for that premium IDE look
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
