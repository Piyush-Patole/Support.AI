import React from 'react';
import { Upload, Table2, BarChart3, Sparkles } from 'lucide-react';
import { PageView } from './AppShell';

interface SidebarProps {
  currentView: PageView;
  onViewChange: (view: PageView) => void;
  hasResults: boolean;
}

const navItems: { view: PageView; label: string; icon: React.ReactNode }[] = [
  { view: 'upload', label: 'Upload & Analyze', icon: <Upload size={20} /> },
  { view: 'results', label: 'Results', icon: <Table2 size={20} /> },
  { view: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  hasResults,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sparkles size={22} />
        </div>
        <span className="sidebar-logo-text">Support AI</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {navItems.map((item) => {
          const disabled =
            (item.view === 'results' || item.view === 'dashboard') &&
            !hasResults;

          return (
            <button
              key={item.view}
              className={`sidebar-item ${currentView === item.view ? 'active' : ''}`}
              onClick={() => !disabled && onViewChange(item.view)}
              style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              title={disabled ? 'Analyze tickets first' : item.label}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-divider" />
      <div style={{ padding: '8px 16px' }}>
        <div style={{
          fontSize: 'var(--font-size-caption)',
          color: 'var(--text-quaternary)',
          textAlign: 'center'
        }}>
          Support Intelligence v1.0
        </div>
      </div>
    </aside>
  );
};
