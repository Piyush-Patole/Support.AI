import React, { useState } from 'react';
import { AppShell, PageView } from './components/layout/AppShell';
import { UploadPanel } from './components/upload/UploadPanel';
import { OutputGrid } from './components/grid/OutputGrid';
import { DashboardPanel } from './components/dashboard/DashboardPanel';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { ToastContainer } from './components/common/Toast';
import { useAnalysisStore } from './store/analysisStore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>('upload');
  const { tickets, isProcessing, progress } = useAnalysisStore();
  const hasResults = tickets.length > 0;

  const handleAnalysisComplete = () => {
    setCurrentView('results');
  };

  const progressPct =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <>
      <AppShell
        currentView={currentView}
        onViewChange={setCurrentView}
        hasResults={hasResults}
      >
        {currentView === 'upload' && (
          <UploadPanel onAnalysisComplete={handleAnalysisComplete} />
        )}
        {currentView === 'results' && <OutputGrid />}
        {currentView === 'dashboard' && <DashboardPanel />}
      </AppShell>

      <LoadingOverlay
        visible={isProcessing}
        message="Analyzing Tickets with AI"
        subMessage={`Processing ${progress.current} of ${progress.total} tickets...`}
        progress={progressPct}
      />

      <ToastContainer />
    </>
  );
};

export default App;
