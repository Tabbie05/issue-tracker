import { useState, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
};

const STYLES = {
  success: { bg: '#f0fdf4', border: '#16a34a', color: '#166534', icon: '#16a34a' },
  error: { bg: '#fef2f2', border: '#dc2626', color: '#991b1b', icon: '#dc2626' },
  info: { bg: '#eff6ff', border: '#2563eb', color: '#1e40af', icon: '#2563eb' },
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

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '72px', right: '16px', zIndex: 9999, maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(t => {
        const s = STYLES[t.type] || STYLES.info;
        const Icon = ICONS[t.type] || FiInfo;
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: s.bg,
              border: `1px solid ${s.border}`,
              color: s.color,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out',
              minWidth: '300px',
            }}
          >
            <Icon size={20} style={{ color: s.icon, flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '14px', fontWeight: 500, flex: 1, margin: 0 }}>{t.message}</p>
            <button onClick={() => removeToast(t.id)} style={{ color: s.color, opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <FiX size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
