import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIssue, updateIssueStatus, addComment, deleteIssue } from '../api/issueApi';
import { FiArrowLeft, FiClock, FiUser, FiFolder, FiFlag, FiSend, FiTrash2, FiMessageSquare } from 'react-icons/fi';

const PRIORITY_BADGE = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' };
const STATUS_BADGE = { Open: 'badge-open', 'In Progress': 'badge-in-progress', Resolved: 'badge-resolved', Closed: 'badge-closed' };
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { fetchIssue(); }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getIssue(id);
      setIssue(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await updateIssueStatus(id, newStatus);
      setIssue(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await addComment(id, commentText.trim(), commentAuthor.trim() || 'Anonymous');
      setIssue(res.data);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue? This cannot be undone.')) return;
    try {
      await deleteIssue(id);
      navigate('/', { state: { message: 'Issue deleted successfully' } });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete issue');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent" style={{ borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card-flat p-8 text-center">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-danger)' }}>Error</h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="btn-secondary">
          <FiArrowLeft size={15} /> Back to Dashboard
        </button>
        <button onClick={handleDelete} className="btn-danger">
          <FiTrash2 size={14} /> Delete
        </button>
      </div>

      <div className="card-flat overflow-hidden">
        {/* Header */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>{issue.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${PRIORITY_BADGE[issue.priority]}`}>
              <FiFlag className="mr-1" size={12} />{issue.priority}
            </span>
            <span className={`badge ${STATUS_BADGE[issue.status]}`}>{issue.status}</span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <FiFolder size={16} style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Project</p>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{issue.project}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <FiUser size={16} style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Assignee</p>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{issue.assignee}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <FiClock size={16} style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Created</p>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{formatDate(issue.createdAt)}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Description</h3>
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{issue.description}</p>
        </div>

        {/* Status change */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus || issue.status === s}
                className={issue.status === s ? 'btn-primary' : 'btn-secondary'}
                style={{ opacity: updatingStatus ? 0.6 : 1 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            <FiMessageSquare size={16} /> Comments ({issue.comments.length})
          </h3>

          {issue.comments.length === 0 ? (
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>No comments yet. Be the first to comment.</p>
          ) : (
            <div className="space-y-3 mb-6">
              {issue.comments.map((comment, i) => (
                <div key={comment._id || i} className="p-4 rounded-lg" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{comment.author}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="space-y-3">
            <input
              type="text"
              value={commentAuthor}
              onChange={e => setCommentAuthor(e.target.value)}
              placeholder="Your name (optional)"
              className="input-field"
            />
            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="btn-primary self-end"
              >
                {submittingComment ? '...' : <FiSend size={16} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
