import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIssues, getStats, getMeta, exportCSV } from '../api/issueApi';
import { io } from 'socket.io-client';
import { FiSearch, FiDownload, FiAlertCircle, FiFilter, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from '../components/Toast';
import StatsCharts from '../components/StatsCharts';

const PRIORITY_BADGE = {
  Low: 'badge-low',
  Medium: 'badge-medium',
  High: 'badge-high',
  Critical: 'badge-critical',
};

const STATUS_BADGE = {
  Open: 'badge-open',
  'In Progress': 'badge-in-progress',
  Resolved: 'badge-resolved',
  Closed: 'badge-closed',
};

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ projects: [], priorities: [], statuses: [], assignees: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ project: '', priority: '', status: '', assignee: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });

      const [issuesRes, statsRes] = await Promise.all([
        getIssues(params),
        getStats()
      ]);
      setIssues(issuesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load issues. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    getMeta().then(res => setMeta(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [fetchData]);

  useEffect(() => {
    try {
      const socketUrl = window.location.hostname === 'localhost'
        ? window.location.origin.replace(':5173', ':5000')
        : window.location.origin;
      const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
      socket.on('issueCreated', () => { fetchData(); toast('New issue created!', 'info'); });
      socket.on('issueUpdated', () => fetchData());
      socket.on('issueDeleted', () => fetchData());
      return () => socket.disconnect();
    } catch (e) {
      // Socket.io not available (e.g., on Vercel serverless)
    }
  }, [fetchData]);

  const clearFilters = () => {
    setFilters({ project: '', priority: '', status: '', assignee: '', search: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="card-flat p-8 text-center" style={{ borderColor: 'var(--color-danger)' }}>
          <FiAlertCircle className="mx-auto mb-3" size={40} style={{ color: 'var(--color-danger)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-danger-text)' }}>Something went wrong</h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button onClick={fetchData} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Track and manage all project issues</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <FiDownload size={15} /> Export CSV
        </button>
      </div>

      {/* Status count cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="stat-card">
            <p className="stat-label">Total</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
            <div key={status} className="stat-card">
              <p className="stat-label">{status}</p>
              <p className="stat-value">{stats.byStatus[status] || 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && <StatsCharts stats={stats} />}

      {/* Search and filter bar */}
      <div className="card-flat p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search issues by title or description..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
            style={hasActiveFilters ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'var(--color-primary-light)' } : {}}
          >
            <FiFilter size={15} /> Filters {hasActiveFilters && '(active)'}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary" style={{ color: 'var(--color-danger)' }}>
              <FiX size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <select value={filters.project} onChange={e => setFilters(prev => ({ ...prev, project: e.target.value }))} className="select-field">
              <option value="">All Projects</option>
              {meta.projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.priority} onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))} className="select-field">
              <option value="">All Priorities</option>
              {meta.priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="select-field">
              <option value="">All Statuses</option>
              {meta.statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.assignee} onChange={e => setFilters(prev => ({ ...prev, assignee: e.target.value }))} className="select-field">
              <option value="">All Assignees</option>
              {meta.assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Issues list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent" style={{ borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary)' }}></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="card-flat p-16 text-center">
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>No issues found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first issue to get started'}
          </p>
        </div>
      ) : (
        <>
          {(() => {
            const totalPages = Math.ceil(issues.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const paginatedIssues = issues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            return (
              <>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, issues.length)} of {issues.length} issue{issues.length !== 1 ? 's' : ''}
                </p>

                {/* Desktop table */}
                <div className="hidden md:block card-flat overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Project</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Assignee</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedIssues.map(issue => (
                        <tr key={issue._id}>
                          <td>
                            <Link to={`/issues/${issue._id}`} className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                              {issue.title}
                            </Link>
                          </td>
                          <td>{issue.project}</td>
                          <td><span className={`badge ${PRIORITY_BADGE[issue.priority]}`}>{issue.priority}</span></td>
                          <td><span className={`badge ${STATUS_BADGE[issue.status]}`}>{issue.status}</span></td>
                          <td>{issue.assignee}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{new Date(issue.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                  {paginatedIssues.map(issue => (
                    <Link key={issue._id} to={`/issues/${issue._id}`} className="card block p-4">
                      <h3 className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>{issue.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`badge ${PRIORITY_BADGE[issue.priority]}`}>{issue.priority}</span>
                        <span className={`badge ${STATUS_BADGE[issue.status]}`}>{issue.status}</span>
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{issue.project}</span>
                        <span>{issue.assignee}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary"
                      style={{ padding: '0.375rem 0.625rem' }}
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={page === currentPage ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '0.375rem 0.75rem', minWidth: '2.25rem' }}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary"
                      style={{ padding: '0.375rem 0.625rem' }}
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
