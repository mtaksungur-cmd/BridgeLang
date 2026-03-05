import { useEffect, useState } from 'react';

let toastId = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = ({ title, message, type = 'info', duration = 3000 }) => {
        const id = toastId++;
        const toast = { id, title, message, type };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, showToast, removeToast };
};

export default function Toast({ toasts, onClose }) {
    if (!toasts || toasts.length === 0) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'info': return 'ℹ';
            default: return 'ℹ';
        }
    };

    return (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => onClose(toast.id)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="toast-icon">
                        {getIcon(toast.type)}
                    </div>
                    <div className="toast-content">
                        {toast.title && <div className="toast-title">{toast.title}</div>}
                        <div className="toast-message">{toast.message}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
