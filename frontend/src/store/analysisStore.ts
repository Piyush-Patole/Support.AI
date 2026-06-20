import { create } from 'zustand';
import { AnalyzedTicket, IssueCluster, DashboardStats } from '../types/ticket';

interface AnalysisState {
  tickets: AnalyzedTicket[];
  clusters: IssueCluster[];
  stats: DashboardStats | null;
  isProcessing: boolean;
  progress: { current: number; total: number };
  errors: string[];
  setTickets: (tickets: AnalyzedTicket[]) => void;
  setClusters: (clusters: IssueCluster[]) => void;
  setStats: (stats: DashboardStats) => void;
  updateTicket: (ticketId: string, updates: Partial<AnalyzedTicket>) => void;
  setProcessing: (v: boolean) => void;
  setProgress: (current: number, total: number) => void;
  addError: (msg: string) => void;
  clearErrors: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  tickets: [],
  clusters: [],
  stats: null,
  isProcessing: false,
  progress: { current: 0, total: 0 },
  errors: [],
  setTickets: (tickets) => set({ tickets }),
  setClusters: (clusters) => set({ clusters }),
  setStats: (stats) => set({ stats }),
  updateTicket: (ticketId, updates) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.ticket_id === ticketId ? { ...t, ...updates } : t
      ),
    })),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (current, total) => set({ progress: { current, total } }),
  addError: (msg) => set((state) => ({ errors: [...state.errors, msg] })),
  clearErrors: () => set({ errors: [] }),
  reset: () =>
    set({
      tickets: [],
      clusters: [],
      stats: null,
      errors: [],
      progress: { current: 0, total: 0 },
      isProcessing: false,
    }),
}));
