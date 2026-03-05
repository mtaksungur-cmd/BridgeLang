import { Circle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
    const configs = {
        approved: {
            label: 'Approved',
            bg: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
            color: '#166534',
            border: '#86efac'
        },
        pending: {
            label: 'Pending Approval',
            bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            color: '#92400e',
            border: '#fcd34d'
        },
        confirmed: {
            label: 'Confirmed',
            bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            color: '#1e40af',
            border: '#93c5fd'
        },
        cancelled: {
            label: 'Cancelled',
            bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            color: '#991b1b',
            border: '#fca5a5'
        },
        completed: {
            label: 'Completed',
            bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            color: '#3730a3',
            border: '#a5b4fc'
        },
        starting_soon: {
            label: 'Starting Soon',
            bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            color: '#92400e',
            border: '#fcd34d',
            pulse: true
        },
        in_progress: {
            label: 'In Progress',
            bg: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
            color: '#166534',
            border: '#86efac',
            pulse: true
        }
    };

    const config = configs[status] || configs.pending;
    const sizeMap = {
        sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem', iconSize: 8 },
        md: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem', iconSize: 10 },
        lg: { padding: '0.5rem 1rem', fontSize: '0.875rem', iconSize: 12 }
    };
    const sizing = sizeMap[size];

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: sizing.padding,
            background: config.bg,
            color: config.color,
            border: `2px solid ${config.border}`,
            borderRadius: '6px',
            fontSize: sizing.fontSize,
            fontWeight: '600',
            textTransform: 'capitalize',
            animation: config.pulse ? 'pulse 2s infinite' : 'none'
        }}>
            <Circle
                style={{
                    width: `${sizing.iconSize}px`,
                    height: `${sizing.iconSize}px`,
                    fill: config.color
                }}
            />
            {config.label}

            {config.pulse && (
                <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}</style>
            )}
        </div>
    );
}
