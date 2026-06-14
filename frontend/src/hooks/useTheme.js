import { useState, useEffect } from 'react';

export function useTheme() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.getElementById('highlight-theme').href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
    } else {
      document.documentElement.classList.add('dark');
      document.getElementById('highlight-theme').href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    }
  }, [isLight]);

  const toggleTheme = () => setIsLight(!isLight);

  return { isLight, toggleTheme };
}
