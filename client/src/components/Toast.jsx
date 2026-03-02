import { useState, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
};

const STYLES = {
  success: { bg: 'var(--color-success-bg)', border: 'var(--color-success)', color: 'var(--color-success-text)', icon: 'var(--color-success)' },
  error: { bg: 'var(--color-danger-bg)', border: 'var(--color-danger)', color: 'var(--color-danger-text)', icon: 'var(--color-danger)' },
  info: { bg: 'var(--color-info-bg)', border: 'var(--color-info)', color: 'var(--color-info-text)', icon: 'var(--color-info)' },
};

let addToastFn = null;

export function toast(message, type = 'info') {
  if (addToastFn) addToastFn({ message, type, id: Date.now() });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts(prev => [...prev, t]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== t.id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2" style={{ maxWidth: '380px' }}>
      {toasts.map(t => {
        const style = STYLES[t.type] || STYLES.info;
        const Icon = ICONS[t.type] || FiInfo;
        return (
          <div
            key={t.id}
            className="flex items-start gap-3 p-3 rounded-lg shadow-lg animate-slide-in"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.color,
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <Icon size={18} style={{ color: style.icon, flexShrink: 0, marginTop: '1px' }} />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} style={{ color: style.color, opacity: 0.6 }}>
              <FiX size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
