import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue, getMeta } from '../api/issueApi';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

export default function CreateIssue() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ projects: [], priorities: [], statuses: [], assignees: [] });
  const [form, setForm] = useState({
    title: '',
    description: '',
    project: '',
    priority: '',
    assignee: '',
    status: 'Open'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    getMeta().then(res => setMeta(res.data)).catch(() => {});
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
    if (!form.description.trim() || form.description.trim().length < 10) errs.description = 'Description must be at least 10 characters';
    if (!form.project) errs.project = 'Please select a project';
    if (!form.priority) errs.priority = 'Please select a priority';
    if (!form.assignee) errs.assignee = 'Please select an assignee';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await createIssue(form);
      navigate('/', { state: { message: 'Issue created successfully!' } });
    } catch (err) {
      setServerError(err.response?.data?.details?.join(', ') || err.response?.data?.error || 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <FiArrowLeft size={16} /> Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Issue</h1>

        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Brief summary of the issue"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Detailed description of the issue..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Project & Priority row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={form.project}
                onChange={e => handleChange('project', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                  errors.project ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select Project</option>
                {meta.projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.project && <p className="text-red-500 text-sm mt-1">{errors.project}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={form.priority}
                onChange={e => handleChange('priority', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                  errors.priority ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select Priority</option>
                {meta.priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
            </div>
          </div>

          {/* Assignee & Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignee <span className="text-red-500">*</span>
              </label>
              <select
                value={form.assignee}
                onChange={e => handleChange('assignee', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                  errors.assignee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select Assignee</option>
                {meta.assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.assignee && <p className="text-red-500 text-sm mt-1">{errors.assignee}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {meta.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <FiSave size={16} /> Create Issue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
