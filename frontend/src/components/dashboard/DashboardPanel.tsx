import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAnalysisStore } from '../../store/analysisStore';
import {
  BarChart3, Layers, AlertTriangle, CheckCircle2,
  TrendingUp, Repeat, Target, Activity,
} from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#FF3B30',
  High: '#FF9500',
  Medium: '#FFCC00',
  Low: '#34C759',
};

export const DashboardPanel: React.FC = () => {
  const { tickets, clusters, stats } = useAnalysisStore();

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <BarChart3 size={36} />
        </div>
        <div className="empty-state-title">No Data Yet</div>
        <div className="empty-state-subtitle">
          Analyze tickets to see dashboard analytics
        </div>
      </div>
    );
  }

  const severityData = Object.entries(stats.severity_distribution).map(
    ([name, value]) => ({ name, value })
  );

  const categoryCharts = Object.entries(stats.category_distribution || {}).map(
    ([catName, dist]) => ({
      name: catName,
      data: Object.entries(dist).map(([label, count]) => ({ label, count })),
    })
  );

  const successCount = tickets.filter((t) => t.processing_status === 'success').length;
  const errorCount = tickets.filter((t) => t.processing_status === 'error').length;
  const avgConfidence = tickets.length > 0
    ? tickets.reduce((sum, t) => sum + t.confidence_score, 0) / tickets.length
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Stat Cards */}
      <div className="dashboard-grid stagger-children">
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'rgba(0, 122, 255, 0.12)', color: 'var(--ios-blue)' }}
          >
            <Layers size={22} />
          </div>
          <div className="stat-card-value">{stats.total_tickets}</div>
          <div className="stat-card-label">Total Tickets</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'rgba(88, 86, 214, 0.12)', color: 'var(--ios-indigo)' }}
          >
            <Target size={22} />
          </div>
          <div className="stat-card-value">{stats.unique_issues}</div>
          <div className="stat-card-label">Unique Issues</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'rgba(52, 199, 89, 0.12)', color: 'var(--ios-green)' }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-value">{successCount}</div>
          <div className="stat-card-label">Processed OK</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'rgba(255, 59, 48, 0.12)', color: 'var(--ios-red)' }}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="stat-card-value">{errorCount}</div>
          <div className="stat-card-label">Errors</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'rgba(255, 149, 0, 0.12)', color: 'var(--ios-orange)' }}
          >
            <Activity size={22} />
          </div>
          <div className="stat-card-value">{(avgConfidence * 100).toFixed(0)}%</div>
          <div className="stat-card-label">Avg Confidence</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'rgba(175, 82, 222, 0.12)', color: 'var(--ios-purple)' }}
          >
            <Repeat size={22} />
          </div>
          <div className="stat-card-value">
            {clusters.filter((c) => c.count > 1).length}
          </div>
          <div className="stat-card-label">Duplicate Groups</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="two-col">
        {/* Severity Pie Chart */}
        <div className="chart-card">
          <div className="chart-card-title">Severity Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {severityData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEVERITY_COLORS[entry.name] || '#8E8E93'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--separator)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-md)',
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-sm)',
          }}>
            {severityData.map((entry) => (
              <div
                key={entry.name}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: SEVERITY_COLORS[entry.name],
                  }}
                />
                <span style={{
                  fontSize: 'var(--font-size-caption)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}>
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring Issues */}
        <div className="chart-card">
          <div className="chart-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} /> Top Recurring Issues
            </span>
          </div>
          <div className="recurring-list">
            {(stats.top_recurring_issues || []).slice(0, 5).map((issue, i) => (
              <div key={i} className="recurring-item">
                <span className="recurring-rank">{i + 1}</span>
                <span className="recurring-summary">{issue.summary}</span>
                <span className="recurring-count">{issue.count}×</span>
              </div>
            ))}
            {(!stats.top_recurring_issues || stats.top_recurring_issues.length === 0) && (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-xl)',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-footnote)',
              }}>
                No recurring issues detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution Charts */}
      {categoryCharts.length > 0 && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div className="two-col">
            {categoryCharts.map((chart) => (
              <div key={chart.name} className="chart-card">
                <div className="chart-card-title">{chart.name} Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chart.data} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} />
                    <YAxis
                      dataKey="label"
                      type="category"
                      width={80}
                      stroke="var(--text-tertiary)"
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--separator)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow-md)',
                        fontSize: 13,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--ios-blue)"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
