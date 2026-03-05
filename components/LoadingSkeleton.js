export default function LoadingSkeleton({ type = 'card' }) {
    if (type === 'teacher-card') {
        return (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="skeleton skeleton-avatar" />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    </div>
                </div>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ width: '80px', height: '28px' }} />
                    <div className="skeleton" style={{ width: '80px', height: '28px' }} />
                </div>
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-text" />
                        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                    </div>
                ))}
            </div>
        );
    }

    return <div className="skeleton skeleton-card" />;
}
