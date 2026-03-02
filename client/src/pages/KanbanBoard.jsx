import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getIssues, updateIssueStatus } from '../api/issueApi';
import { FiAlertCircle, FiFlag } from 'react-icons/fi';

const COLUMNS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const COLUMN_STYLES = {
  Open: { accent: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  'In Progress': { accent: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  Resolved: { accent: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  Closed: { accent: 'var(--color-priority-low)', bg: 'var(--color-priority-low-bg)' },
};

const PRIORITY_BADGE = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' };

export default function KanbanBoard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedIssue, setDraggedIssue] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

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

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedIssue || draggedIssue.status === newStatus) {
      setDraggedIssue(null);
      return;
    }

    // Optimistic update
    setIssues(prev => prev.map(i => i._id === draggedIssue._id ? { ...i, status: newStatus } : i));

    try {
      await updateIssueStatus(draggedIssue._id, newStatus);
    } catch (err) {
      // Revert on error
      setIssues(prev => prev.map(i => i._id === draggedIssue._id ? { ...i, status: draggedIssue.status } : i));
      alert('Failed to update status');
    }

    setDraggedIssue(null);
  };

  const getColumnIssues = (status) => issues.filter(i => i.status === status);

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
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Drag and drop issues between columns to update status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(status => {
          const colIssues = getColumnIssues(status);
          const styles = COLUMN_STYLES[status];
          const isOver = dragOverColumn === status;

          return (
            <div
              key={status}
              onDragOver={e => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, status)}
              className="rounded-xl p-3 transition-all"
              style={{
                background: isOver ? styles.bg : 'var(--color-surface-secondary)',
                border: isOver ? `2px dashed ${styles.accent}` : '2px solid transparent',
                minHeight: '200px'
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: styles.accent }}></div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{status}</span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: styles.bg, color: styles.accent }}>
                  {colIssues.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colIssues.map(issue => (
                  <div
                    key={issue._id}
                    draggable
                    onDragStart={e => handleDragStart(e, issue)}
                    className="card p-3 cursor-grab active:cursor-grabbing"
                    style={{
                      opacity: draggedIssue?._id === issue._id ? 0.4 : 1,
                      borderLeft: `3px solid ${styles.accent}`
                    }}
                  >
                    <Link
                      to={`/issues/${issue._id}`}
                      className="font-medium text-sm hover:underline block mb-2"
                      style={{ color: 'var(--color-text)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {issue.title}
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className={`badge ${PRIORITY_BADGE[issue.priority]}`}>
                        <FiFlag size={10} className="mr-1" />{issue.priority}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{issue.assignee.split(' ')[0]}</span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>{issue.project}</p>
                  </div>
                ))}
                {colIssues.length === 0 && (
                  <div className="text-center py-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    No issues
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
