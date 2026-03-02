import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIssues, getStats, getMeta, exportCSV } from '../api/issueApi';
import { io } from 'socket.io-client';
import { FiSearch, FiDownload, FiAlertCircle, FiFilter, FiX } from 'react-icons/fi';
import StatsCharts from '../components/StatsCharts';

const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const STATUS_COLORS = {
  Open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
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

  // Real-time updates via Socket.io
  useEffect(() => {
    const socket = io(window.location.origin.replace(':5173', ':5000'));
    socket.on('issueCreated', () => fetchData());
    socket.on('issueUpdated', () => fetchData());
    socket.on('issueDeleted', () => fetchData());
    return () => socket.disconnect();
  }, [fetchData]);

  const clearFilters = () => {
    setFilters({ project: '', priority: '', status: '', assignee: '', search: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Something went wrong</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Status count cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{status}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byStatus[status] || 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && <StatsCharts stats={stats} />}

      {/* Export CSV */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportCSV}
          className="flex items-center gap-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FiDownload size={14} /> Export CSV
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search issues by title or description..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-4 py-2 border rounded-md transition-colors ${
              hasActiveFilters
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FiFilter size={16} /> Filters {hasActiveFilters && `(active)`}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              <FiX size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={filters.project}
              onChange={e => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Projects</option>
              {meta.projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={filters.priority}
              onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Priorities</option>
              {meta.priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              {meta.statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filters.assignee}
              onChange={e => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Assignees</option>
              {meta.assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Issues list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No issues found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, issues.length)} of {issues.length} issue{issues.length !== 1 ? 's' : ''}
                </p>

                {/* Desktop table */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedIssues.map(issue => (
                        <tr key={issue._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3">
                            <Link to={`/issues/${issue._id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                              {issue.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{issue.project}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                              {issue.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{issue.assignee}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                  {paginatedIssues.map(issue => (
                    <Link
                      key={issue._id}
                      to={`/issues/${issue._id}`}
                      className="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">{issue.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                          {issue.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
                          {issue.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{issue.project}</span>
                        <span>{issue.assignee}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
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
