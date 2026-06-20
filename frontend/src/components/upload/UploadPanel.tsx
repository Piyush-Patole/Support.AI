import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { PasteInput } from './PasteInput';
import { CategoryManager } from '../category/CategoryManager';
import { RawTicket } from '../../types/ticket';
import { useCategoryStore } from '../../store/categoryStore';
import { parseFile, parsePastedTable, parsePastedEmail } from '../../services/fileParser';
import { analyzeBatch } from '../../services/geminiClient';
import { useAnalysisStore } from '../../store/analysisStore';
import { useToastStore } from '../../store/toastStore';
import { FileSpreadsheet, X, Zap, Mail, Table2 } from 'lucide-react';

interface UploadPanelProps {
  onAnalysisComplete: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste-ticket' | 'paste-email'>('file');
  const [rawTickets, setRawTickets] = useState<RawTicket[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const { columns } = useCategoryStore();
  const { setTickets, setClusters, setStats, setProcessing, setProgress, addError, reset } =
    useAnalysisStore();
  const { addToast } = useToastStore();
  const { isProcessing } = useAnalysisStore();

  const handleFilesSelected = async (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setIsParsing(true);
    try {
      const newTickets: RawTicket[] = [];
      for (const file of newFiles) {
        const parsed = await parseFile(file);
        newTickets.push(...parsed);
      }
      const updated = [...rawTickets, ...newTickets];
      setRawTickets(updated);
      addToast(
        `Parsed ${newTickets.length} tickets from ${newFiles.length} file(s)`,
        'success'
      );
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to parse files', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteTicket = (text: string) => {
    try {
      const parsed = parsePastedTable(text);
      if (!parsed.length) { addToast('No data found in pasted text', 'warning'); return; }
      const updated = [...rawTickets, ...parsed];
      setRawTickets(updated);
      addToast(`Parsed ${parsed.length} ticket(s)`, 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to parse text', 'error');
    }
  };

  const handlePasteEmail = (text: string) => {
    try {
      const ticket = parsePastedEmail(text);
      setRawTickets((prev) => [...prev, ticket]);
      addToast('Email added successfully', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to parse email', 'error');
    }
  };

  const handleAnalyze = async () => {
    if (rawTickets.length === 0) {
      addToast('No tickets to analyze. Upload or paste tickets first.', 'warning');
      return;
    }
    reset();
    setProcessing(true);
    try {
      const result = await analyzeBatch(
        rawTickets,
        { columns },
        (current, total) => setProgress(current, total)
      );
      setTickets(result.tickets);
      setClusters(result.clusters);
      setStats(result.stats);
      addToast(
        `Analysis complete! ${result.processing_summary.success} succeeded, ${result.processing_summary.error} failed`,
        result.processing_summary.error > 0 ? 'warning' : 'success'
      );
      onAnalysisComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      addError(msg);
      addToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const clearAll = () => { setFiles([]); setRawTickets([]); };

  return (
    <div className="upload-panel animate-fade-in">
      {/* Input Section */}
      <div className="page-section">
        <div className="page-section-title">Input Source</div>
        <div className="page-section-subtitle">
          Upload files or paste ticket data to begin AI analysis
        </div>

        <div className="segmented-control" style={{ marginBottom: 'var(--space-lg)' }}>
          <button className={`segment-btn ${activeTab === 'file' ? 'active' : ''}`} onClick={() => setActiveTab('file')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> File Upload</span>
          </button>
          <button className={`segment-btn ${activeTab === 'paste-ticket' ? 'active' : ''}`} onClick={() => setActiveTab('paste-ticket')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Table2 size={14} /> Paste Tickets</span>
          </button>
          <button className={`segment-btn ${activeTab === 'paste-email' ? 'active' : ''}`} onClick={() => setActiveTab('paste-email')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> Paste Email</span>
          </button>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          {activeTab === 'file' && (
            <div>
              <DropZone onFilesSelected={handleFilesSelected} />
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((file, i) => (
                    <div key={i} className="file-item">
                      <FileSpreadsheet size={18} className="file-item-icon" />
                      <span className="file-item-name">{file.name}</span>
                      <span className="file-item-size">{(file.size / 1024).toFixed(1)} KB</span>
                      <button className="chip-remove" onClick={() => removeFile(i)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'paste-ticket' && (
            <PasteInput
              onSubmit={handlePasteTicket}
              label="Paste Ticket Data"
              placeholder={`Paste tab-separated or comma-separated ticket data here...\n\nExample:\nTicket ID, Description, Status\nT-001, Server is down, Open\nT-002, Login page error, Open`}
              buttonLabel="Parse Tickets"
            />
          )}
          {activeTab === 'paste-email' && (
            <PasteInput
              onSubmit={handlePasteEmail}
              label="Paste Email Content"
              placeholder={`Paste the full email content here...\n\nSubject: Issue with payment processing\nFrom: user@company.com\n\nHi Support Team,\nWe are experiencing issues with...`}
              buttonLabel="Add Email"
            />
          )}
        </div>

        {/* Ticket Summary Bar */}
        {rawTickets.length > 0 && (
          <div
            className="glass-card animate-slide-up"
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              marginTop: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <span className="badge badge-success" style={{ fontSize: 'var(--font-size-footnote)', padding: '5px 12px' }}>
                {rawTickets.length} ticket{rawTickets.length !== 1 ? 's' : ''} ready
              </span>
              <span style={{ fontSize: 'var(--font-size-footnote)', color: 'var(--text-tertiary)' }}>
                {isParsing ? 'Parsing...' : 'Ready for analysis'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear All</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAnalyze}
                disabled={isProcessing || rawTickets.length === 0}
              >
                <Zap size={14} /> Analyze with AI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Configuration */}
      <div className="page-section">
        <div className="page-section-title">Custom Categories</div>
        <div className="page-section-subtitle">
          Define custom classification columns for your tickets (optional)
        </div>
        <CategoryManager />
      </div>

      {/* Empty State */}
      {rawTickets.length === 0 && (
        <div className="empty-state" style={{ paddingTop: 'var(--space-xl)' }}>
          <div className="empty-state-icon"><Zap size={36} /></div>
          <div className="empty-state-title">No Tickets Loaded</div>
          <div className="empty-state-subtitle">
            Upload a .xlsx / .csv file or paste ticket data above to get started
          </div>
        </div>
      )}
    </div>
  );
};
