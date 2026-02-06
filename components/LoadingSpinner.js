// Simple Loading Spinner Component
export default function LoadingSpinner({ size = 40, color = '#3b82f6' }) {
    return (
        <div style={{
            width: `${size}px`,
            height: `${size}px`,
            border: `3px solid #e5e7eb`,
            borderTop: `3px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }}>
            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
