export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface RawTicket {
  ticket_id: string;
  raw_text: string;
  source_type: 'email' | 'ticket';
  metadata: Record<string, unknown>;
}

export interface AnalyzedTicket {
  ticket_id: string;
  issue_summary: string;
  detailed_issue: string;
  rca: string;
  reason_of_issue: string;
  severity: SeverityLevel;
  recommended_action: string;
  confidence_score: number;
  cluster_id?: string;
  categories: Record<string, string>;
  processing_status: 'success' | 'error' | 'partial';
  error_message?: string;
}

export interface IssueCluster {
  cluster_id: string;
  representative_summary: string;
  ticket_ids: string[];
  count: number;
}

export interface DashboardStats {
  total_tickets: number;
  unique_issues: number;
  top_recurring_issues: Array<{
    cluster_id: string;
    summary: string;
    count: number;
  }>;
  severity_distribution: Record<SeverityLevel, number>;
  category_distribution: Record<string, Record<string, number>>;
}

export interface ProcessingSummary {
  success: number;
  error: number;
  partial: number;
}
