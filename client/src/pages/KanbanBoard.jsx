import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIssues, updateIssueStatus } from '../api/issueApi';
import { io } from 'socket.io-client';
import { FiAlertCircle, FiFlag, FiMessageSquare } from 'react-icons/fi';
import { toast } from '../components/Toast';

const COLUMNS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const COLUMN_STYLES = {
  Open: { header: '#f59e0b', headerBg: '#fef3c7', colBg: '#fffbeb', dot: '#f59e0b' },
  'In Progress': { header: '#6366f1', headerBg: '#e0e7ff', colBg: '#eef2ff', dot: '#6366f1' },
  Resolved: { header: '#22c55e', headerBg: '#dcfce7', colBg: '#f0fdf4', dot: '#22c55e' },
  Closed: { header: '#64748b', headerBg: '#e2e8f0', colBg: '#f8fafc', dot: '#64748b' },
};

const COLUMN_STYLES_DARK = {
  Open: { header: '#fbbf24', headerBg: '#451a03', colBg: '#1c1917', dot: '#fbbf24' },
  'In Progress': { header: '#818cf8', headerBg: '#1e1b4b', colBg: '#0f0e1a', dot: '#818cf8' },
  Resolved: { header: '#4ade80', headerBg: '#052e16', colBg: '#0a1a0f', dot: '#4ade80' },
  Closed: { header: '#94a3b8', headerBg: '#1e293b', colBg: '#0f172a', dot: '#94a3b8' },
};

const PRIORITY_COLORS = {
  Low: '#64748b',
  Medium: '#2563eb',
  High: '#ea580c',
  Critical: '#dc2626',
};

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4'];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function KanbanBoard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedIssue, setDraggedIssue] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const isDark = document.documentElement.classList.contains('dark');

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getIssues();
      setIssues(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // Real-time updates (only on localhost)
  useEffect(() => {
    if (window.location.hostname !== 'localhost') return;
    try {
      const socket = io('http://localhost:5000', { timeout: 3000, reconnectionAttempts: 2 });
      socket.on('issueCreated', (issue) => {
        setIssues(prev => [issue, ...prev]);
        toast('New issue created!', 'info');
      });
      socket.on('issueUpdated', (issue) => {
        setIssues(prev => prev.map(i => i._id === issue._id ? issue : i));
      });
      socket.on('issueDeleted', (id) => {
        setIssues(prev => prev.filter(i => i._id !== id));
      });
      return () => socket.disconnect();
    } catch (e) {}
  }, []);

  const handleDragStart = (e, issue) => {
    setDraggedIssue(issue);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', issue._id);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedIssue || draggedIssue.status === newStatus) {
      setDraggedIssue(null);
      return;
    }
    const oldStatus = draggedIssue.status;
    setIssues(prev => prev.map(i => i._id === draggedIssue._id ? { ...i, status: newStatus } : i));
    try {
      await updateIssueStatus(draggedIssue._id, newStatus);
      toast(`Moved to ${newStatus}`, 'success');
    } catch (err) {
      setIssues(prev => prev.map(i => i._id === draggedIssue._id ? { ...i, status: oldStatus } : i));
      toast('Failed to update status', 'error');
    }
    setDraggedIssue(null);
  };

  const getColumnIssues = (status) => issues.filter(i => i.status === status);
  const getStyles = (status) => isDark ? COLUMN_STYLES_DARK[status] : COLUMN_STYLES[status];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent" style={{ borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="card-flat p-8 text-center">
          <FiAlertCircle className="mx-auto mb-3" size={40} style={{ color: 'var(--color-danger)' }} />
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button onClick={fetchIssues} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Kanban Board</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Drag and drop issues to change status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" style={{ minHeight: '75vh' }}>
        {COLUMNS.map(status => {
          const colIssues = getColumnIssues(status);
          const s = getStyles(status);
          const isOver = dragOverColumn === status;

          return (
            <div
              key={status}
              onDragOver={e => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, status)}
              className="flex flex-col rounded-2xl overflow-hidden transition-all"
              style={{
                background: s.colBg,
                border: isOver ? `2px dashed ${s.header}` : '2px solid transparent',
                boxShadow: isOver ? `0 0 20px ${s.header}22` : 'none',
              }}
            >
              {/* Column Header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: s.headerBg }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.header }}></div>
                  <span className="font-bold text-sm" style={{ color: s.header }}>{status}</span>
                </div>
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" style={{ background: s.header, color: 'white' }}>
                  {colIssues.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                {colIssues.map(issue => (
                  <div
                    key={issue._id}
                    draggable
                    onDragStart={e => handleDragStart(e, issue)}
                    className="rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      opacity: draggedIssue?._id === issue._id ? 0.3 : 1,
                      transform: draggedIssue?._id === issue._id ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    {/* Priority indicator */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[issue.priority] }}></div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: PRIORITY_COLORS[issue.priority] }}>
                        {issue.priority}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      to={`/issues/${issue._id}`}
                      className="font-semibold text-sm leading-snug hover:underline block mb-3"
                      style={{ color: 'var(--color-text)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {issue.title.length > 55 ? issue.title.slice(0, 55) + '...' : issue.title}
                    </Link>

                    {/* Project tag */}
                    <div className="mb-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                        {issue.project}
                      </span>
                    </div>

                    {/* Footer: Avatar + Comments */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: getAvatarColor(issue.assignee) }}>
                          {getInitials(issue.assignee)}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{issue.assignee.split(' ')[0]}</span>
                      </div>
                      {issue.comments && issue.comments.length > 0 && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                          <FiMessageSquare size={12} />
                          <span className="text-xs">{issue.comments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {colIssues.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ background: s.headerBg }}>
                      <span style={{ color: s.header, fontSize: '20px' }}>+</span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Drop issues here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
