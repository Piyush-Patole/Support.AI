import React, { useState, useMemo } from 'react';
import { AnalyzedTicket, SeverityLevel } from '../../types/ticket';
import { useAnalysisStore } from '../../store/analysisStore';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { exportToCSV, exportToXLSX } from '../../utils/exportUtils';
import { useCategoryStore } from '../../store/categoryStore';

type SortDir = 'asc' | 'desc' | null;
interface SortState {
  field: string;
  dir: SortDir;
}

const severityOrder: Record<SeverityLevel, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const severityColors: Record<SeverityLevel, string> = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

const confidenceColor = (score: number) => {
  if (score >= 0.8) return 'var(--ios-green)';
  if (score >= 0.5) return 'var(--ios-orange)';
  return 'var(--ios-red)';
};

export const OutputGrid: React.FC = () => {
  const { tickets, updateTicket } = useAnalysisStore();
  const { columns: categoryColumns } = useCategoryStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ field: '', dir: null });
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'All'>('All');
  const [editingCell, setEditingCell] = useState<{ ticketId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const filtered = useMemo(() => {
    let data = [...tickets];

    // Search
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.ticket_id.toLowerCase().includes(lower) ||
          t.issue_summary.toLowerCase().includes(lower) ||
          t.detailed_issue.toLowerCase().includes(lower) ||
          t.rca.toLowerCase().includes(lower)
      );
    }

    // Severity filter
    if (severityFilter !== 'All') {
      data = data.filter((t) => t.severity === severityFilter);
    }

    // Sort
    if (sort.field && sort.dir) {
      data.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';

        if (sort.field === 'severity') {
          va = severityOrder[a.severity];
          vb = severityOrder[b.severity];
        } else if (sort.field === 'confidence_score') {
          va = a.confidence_score;
          vb = b.confidence_score;
        } else {
          va = String((a as any)[sort.field] ?? '');
          vb = String((b as any)[sort.field] ?? '');
        }

        if (typeof va === 'number' && typeof vb === 'number') {
          return sort.dir === 'asc' ? va - vb : vb - va;
        }
        return sort.dir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }

    return data;
  }, [tickets, search, sort, severityFilter]);

  const toggleSort = (field: string) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      if (prev.dir === 'desc') return { field: '', dir: null };
      return { field, dir: 'asc' };
    });
  };

  const sortIcon = (field: string) => {
    if (sort.field !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    if (sort.dir === 'asc') return <ArrowUp size={12} />;
    return <ArrowDown size={12} />;
  };

  const startEdit = (ticketId: string, field: string, currentValue: string) => {
    setEditingCell({ ticketId, field });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (editingCell) {
      updateTicket(editingCell.ticketId, {
        [editingCell.field]: editValue,
      } as Partial<AnalyzedTicket>);
      setEditingCell(null);
    }
  };

  const editableFields = [
    'issue_summary',
    'detailed_issue',
    'rca',
    'reason_of_issue',
    'recommended_action',
  ];

  const baseColumns = [
    { field: 'ticket_id', label: 'Ticket ID', width: 110 },
    { field: 'cluster_id', label: 'Cluster', width: 110 },
    { field: 'issue_summary', label: 'Issue Summary', width: 220 },
    { field: 'detailed_issue', label: 'Detailed Issue', width: 280 },
    { field: 'rca', label: 'RCA', width: 200 },
    { field: 'reason_of_issue', label: 'Reason', width: 200 },
    { field: 'severity', label: 'Severity', width: 110 },
    { field: 'recommended_action', label: 'Action', width: 220 },
    { field: 'confidence_score', label: 'Confidence', width: 130 },
  ];

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div className="grid-search">
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
            <select
              className="input"
              style={{ padding: '6px 12px', fontSize: 'var(--font-size-caption)', width: 'auto', minWidth: 100 }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityLevel | 'All')}
            >
              <option value="All">All Severity</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <span style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
          }}>
            {filtered.length} of {tickets.length}
          </span>

          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered)}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => exportToXLSX(filtered)}>
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="data-grid-wrapper">
        <div className="grid-scroll">
          <table className="data-grid">
            <thead>
              <tr>
                {baseColumns.map((col) => (
                  <th
                    key={col.field}
                    style={{ width: col.width, minWidth: col.width }}
                    onClick={() => toggleSort(col.field)}
                    className={sort.field === col.field ? 'sorted' : ''}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label} {sortIcon(col.field)}
                    </span>
                  </th>
                ))}
                {categoryColumns.map((cat) => (
                  <th key={cat.column_name} style={{ width: 120, minWidth: 120 }}>
                    {cat.column_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.ticket_id}>
                  {/* Ticket ID */}
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-caption)', fontFamily: 'monospace' }}>
                      {ticket.ticket_id}
                    </span>
                  </td>

                  {/* Cluster */}
                  <td>
                    {ticket.cluster_id && (
                      <span className="badge badge-cluster">
                        {ticket.cluster_id.slice(0, 12)}
                      </span>
                    )}
                  </td>

                  {/* Editable text fields */}
                  {['issue_summary', 'detailed_issue', 'rca', 'reason_of_issue'].map(
                    (field) => {
                      const value = String(
                        (ticket as any)[field] ?? ''
                      );
                      const isEditing =
                        editingCell?.ticketId === ticket.ticket_id &&
                        editingCell?.field === field;
                      return (
                        <td
                          key={field}
                          className="editable"
                          onClick={() => {
                            if (!isEditing) startEdit(ticket.ticket_id, field, value);
                          }}
                        >
                          {isEditing ? (
                            <textarea
                              className="cell-edit-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setEditingCell(null);
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  commitEdit();
                                }
                              }}
                              autoFocus
                              rows={2}
                            />
                          ) : (
                            <span style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    }
                  )}

                  {/* Severity */}
                  <td>
                    <span className={`badge ${severityColors[ticket.severity]}`}>
                      {ticket.severity}
                    </span>
                  </td>

                  {/* Recommended Action */}
                  <td
                    className="editable"
                    onClick={() => {
                      const isEditing =
                        editingCell?.ticketId === ticket.ticket_id &&
                        editingCell?.field === 'recommended_action';
                      if (!isEditing)
                        startEdit(ticket.ticket_id, 'recommended_action', ticket.recommended_action);
                    }}
                  >
                    {editingCell?.ticketId === ticket.ticket_id &&
                    editingCell?.field === 'recommended_action' ? (
                      <textarea
                        className="cell-edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingCell(null);
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            commitEdit();
                          }
                        }}
                        autoFocus
                        rows={2}
                      />
                    ) : (
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {ticket.recommended_action}
                      </span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td>
                    <div className="confidence-bar">
                      <div className="confidence-bar-track">
                        <div
                          className="confidence-bar-fill"
                          style={{
                            width: `${ticket.confidence_score * 100}%`,
                            background: confidenceColor(ticket.confidence_score),
                          }}
                        />
                      </div>
                      <span className="confidence-bar-label">
                        {(ticket.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Dynamic Category Columns */}
                  {categoryColumns.map((cat) => (
                    <td key={cat.column_name}>
                      {ticket.categories?.[cat.column_name] ? (
                        <span className="chip" style={{ fontSize: 'var(--font-size-caption)' }}>
                          {ticket.categories[cat.column_name]}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-quaternary)', fontSize: 'var(--font-size-caption)' }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
