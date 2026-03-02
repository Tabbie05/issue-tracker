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
      <button onClick={() => navigate(-1)} className="btn-secondary mb-6">
        <FiArrowLeft size={15} /> Back
      </button>

      <div className="card-flat p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Create New Issue</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Fill in the details below to log a new issue</p>

        {serverError && (
          <div className="p-3 rounded-lg mb-5 text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger)' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Brief summary of the issue"
              className="input-field"
              style={errors.title ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.title && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Description <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Detailed description of the issue..."
              rows={4}
              className="input-field"
              style={errors.description ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.description && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Project <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select value={form.project} onChange={e => handleChange('project', e.target.value)} className="select-field" style={errors.project ? { borderColor: 'var(--color-danger)' } : {}}>
                <option value="">Select Project</option>
                {meta.projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.project && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.project}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Priority <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select value={form.priority} onChange={e => handleChange('priority', e.target.value)} className="select-field" style={errors.priority ? { borderColor: 'var(--color-danger)' } : {}}>
                <option value="">Select Priority</option>
                {meta.priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.priority}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Assignee <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select value={form.assignee} onChange={e => handleChange('assignee', e.target.value)} className="select-field" style={errors.assignee ? { borderColor: 'var(--color-danger)' } : {}}>
                <option value="">Select Assignee</option>
                {meta.assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.assignee && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.assignee}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
              <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="select-field">
                {meta.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center" style={{ padding: '0.625rem 1rem' }}>
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-white"></div> Creating...</>
            ) : (
              <><FiSave size={15} /> Create Issue</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
