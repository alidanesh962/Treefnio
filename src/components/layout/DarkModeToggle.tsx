import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed left-4 bottom-4 p-2.5 rounded-lg bg-white dark:bg-gray-700 
                shadow-md hover:shadow-lg dark:hover:bg-gray-600 
                transition-all duration-200 ease-in-out z-50
                border border-gray-200 dark:border-gray-600"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500 dark:text-amber-300" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}