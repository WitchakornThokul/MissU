import { createContext, useContext, useState, useCallback } from 'react';
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo, FiTrash2 } from 'react-icons/fi';

const DialogContext = createContext(null);

export function useDialog() {
  return useContext(DialogContext);
}

function DialogModal({ dialog, onClose }) {
  if (!dialog) return null;

  const icons = {
    alert:   <FiAlertCircle   size={28} color="#f43f5e" />,
    confirm: <FiAlertTriangle size={28} color="#f59e0b" />,
    success: <FiCheckCircle   size={28} color="#22c55e" />,
    info:    <FiInfo          size={28} color="#3b82f6" />,
    delete:  <FiTrash2        size={28} color="#ef4444" />,
  };

  const confirmColors = {
    alert:   { bg: '#f43f5e', hover: '#e11d48' },
    confirm: { bg: '#f59e0b', hover: '#d97706' },
    success: { bg: '#22c55e', hover: '#16a34a' },
    info:    { bg: '#3b82f6', hover: '#2563eb' },
    delete:  { bg: '#ef4444', hover: '#dc2626' },
  };

  const color = confirmColors[dialog.type] || confirmColors.alert;
  const icon  = icons[dialog.type] || icons.alert;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        padding: '0 20px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(false); }}>

      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '28px 24px 24px',
          maxWidth: 360,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.2s ease',
        }}>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: `${color.bg}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
        </div>

        {/* Title */}
        {dialog.title && (
          <p style={{
            textAlign: 'center', fontWeight: 800, fontSize: '1.1rem',
            color: '#111', marginBottom: 8, lineHeight: 1.3,
          }}>
            {dialog.title}
          </p>
        )}

        {/* Message */}
        <p style={{
          textAlign: 'center', color: '#6b7280', fontSize: '0.92rem',
          lineHeight: 1.6, marginBottom: 22,
        }}>
          {dialog.message}
        </p>

        {/* Buttons */}
        {dialog.isConfirm ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onClose(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: 14,
                background: '#f3f4f6', color: '#6b7280',
                border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}>
              {dialog.cancelLabel || 'ยกเลิก'}
            </button>
            <button
              onClick={() => onClose(true)}
              style={{
                flex: 1, padding: '12px', borderRadius: 14,
                background: color.bg, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
                boxShadow: `0 4px 14px ${color.bg}55`,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {dialog.confirmLabel || 'ตกลง'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => onClose(true)}
            style={{
              width: '100%', padding: '13px', borderRadius: 14,
              background: color.bg, color: '#fff',
              border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.95rem',
              boxShadow: `0 4px 14px ${color.bg}55`,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {dialog.confirmLabel || 'ตกลง'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [resolver, setResolver] = useState(null);

  const openDialog = useCallback((options) => {
    return new Promise(resolve => {
      setDialog(options);
      setResolver(() => resolve);
    });
  }, []);

  function handleClose(result) {
    setDialog(null);
    resolver?.(result);
    setResolver(null);
  }

  // alert(msg) — just an ok button
  const alert = useCallback((message, { title, type = 'alert', confirmLabel } = {}) =>
    openDialog({ message, title, type, isConfirm: false, confirmLabel }), [openDialog]);

  // confirm(msg) — returns true/false
  const confirm = useCallback((message, { title, type = 'confirm', confirmLabel, cancelLabel } = {}) =>
    openDialog({ message, title, type, isConfirm: true, confirmLabel, cancelLabel }), [openDialog]);

  // success toast-like alert
  const success = useCallback((message, { title } = {}) =>
    openDialog({ message, title, type: 'success', isConfirm: false, confirmLabel: 'เยี่ยม!' }), [openDialog]);

  // deleteConfirm — red confirm for destructive actions
  const deleteConfirm = useCallback((message, { title = 'ยืนยันการลบ', confirmLabel = 'ลบ', cancelLabel = 'ยกเลิก' } = {}) =>
    openDialog({ message, title, type: 'delete', isConfirm: true, confirmLabel, cancelLabel }), [openDialog]);

  return (
    <DialogContext.Provider value={{ alert, confirm, success, deleteConfirm }}>
      {children}
      <DialogModal dialog={dialog} onClose={handleClose} />
    </DialogContext.Provider>
  );
}
