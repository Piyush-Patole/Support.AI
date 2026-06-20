import { AnalyzedTicket } from '../types/ticket';
import * as XLSX from 'xlsx';

export function exportToCSV(tickets: AnalyzedTicket[], filename = 'support_analysis.csv'): void {
  if (!tickets.length) return;

  const rows = tickets.map((t) => flattenTicket(t));
  const headers = Object.keys(rows[0]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    ),
  ].join('\n');

  downloadBlob(
    new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' }),
    filename
  );
}

export function exportToXLSX(tickets: AnalyzedTicket[], filename = 'support_analysis.xlsx'): void {
  if (!tickets.length) return;

  const rows = tickets.map((t) => flattenTicket(t));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Support Analysis');
  
  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F2F2F7' } },
      };
    }
  }

  // Set column widths
  ws['!cols'] = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, 20),
  }));

  XLSX.writeFile(wb, filename);
}

function flattenTicket(ticket: AnalyzedTicket): Record<string, string> {
  const base: Record<string, string> = {
    'Ticket ID': ticket.ticket_id,
    'Cluster': ticket.cluster_id || '',
    'Issue Summary': ticket.issue_summary,
    'Detailed Issue': ticket.detailed_issue,
    'RCA': ticket.rca,
    'Reason': ticket.reason_of_issue,
    'Severity': ticket.severity,
    'Recommended Action': ticket.recommended_action,
    'Confidence': (ticket.confidence_score * 100).toFixed(0) + '%',
    'Status': ticket.processing_status,
  };

  if (ticket.categories) {
    for (const [key, value] of Object.entries(ticket.categories)) {
      base[key] = value || '';
    }
  }

  return base;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
