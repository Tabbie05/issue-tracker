import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIssue, updateIssueStatus, addComment, deleteIssue } from '../api/issueApi';
import { FiArrowLeft, FiClock, FiUser, FiFolder, FiFlag, FiSend, FiTrash2, FiMessageSquare } from 'react-icons/fi';

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

  useEffect(() => {
    fetchIssue();
  }, [id]);

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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiArrowLeft size={16} /> Back to Dashboard
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <FiTrash2 size={14} /> Delete
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{issue.title}</h1>
          <div className="flex flex-wrap gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_COLORS[issue.priority]}`}>
              <FiFlag className="inline mr-1" size={14} />{issue.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[issue.status]}`}>
              {issue.status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FiFolder className="text-gray-400" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Project</p>
                <p className="font-medium">{issue.project}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FiUser className="text-gray-400" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assignee</p>
                <p className="font-medium">{issue.assignee}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FiClock className="text-gray-400" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium">{formatDate(issue.createdAt)}</p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
        </div>

        {/* Status change */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus || issue.status === s}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  issue.status === s
                    ? 'bg-indigo-600 text-white cursor-default'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <FiMessageSquare size={18} /> Comments ({issue.comments.length})
          </h3>

          {issue.comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {issue.comments.map((comment, i) => (
                <div key={comment._id || i} className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="space-y-3">
            <input
              type="text"
              value={commentAuthor}
              onChange={e => setCommentAuthor(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="self-end px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
