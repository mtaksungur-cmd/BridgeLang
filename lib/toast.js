// Consolidated toast notification service
import toast from 'react-hot-toast';

export const notify = {
    success: (message) => toast.success(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#10b981',
            color: 'white',
            fontWeight: '600',
            padding: '16px',
            borderRadius: '8px',
        }
    }),

    error: (message) => toast.error(message, {
        duration: 5000,
        position: 'top-right',
        style: {
            background: '#ef4444',
            color: 'white',
            fontWeight: '600',
            padding: '16px',
            borderRadius: '8px',
        }
    }),

    loading: (message) => toast.loading(message, {
        position: 'top-right',
        style: {
            background: '#3b82f6',
            color: 'white',
            fontWeight: '600',
            padding: '16px',
            borderRadius: '8px',
        }
    }),

    dismiss: (toastId) => toast.dismiss(toastId),

    promise: (promise, messages) => toast.promise(promise, messages, {
        position: 'top-right',
    })
};

export default notify;
