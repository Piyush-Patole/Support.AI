import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export type PageView = 'upload' | 'results' | 'dashboard';

interface AppShellProps {
  children: React.ReactNode;
  currentView: PageView;
  onViewChange: (view: PageView) => void;
  hasResults: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentView,
  onViewChange,
  hasResults,
}) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute(
      'data-theme',
      !darkMode ? 'dark' : 'light'
    );
  };

  const pageTitles: Record<PageView, string> = {
    upload: 'Upload & Analyze',
    results: 'Analysis Results',
    dashboard: 'Dashboard',
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        hasResults={hasResults}
      />
      <div className="app-content">
        <Header
          title={pageTitles[currentView]}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
};
