import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  title: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <button
          className={`theme-toggle ${darkMode ? 'dark' : ''}`}
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle-knob">
            {darkMode ? <Moon size={14} color="#5856D6" /> : <Sun size={14} color="#FF9500" />}
          </span>
        </button>
      </div>
    </header>
  );
};
