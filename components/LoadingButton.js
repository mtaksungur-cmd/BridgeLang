// components/LoadingButton.js
import React, { useState } from 'react';

export default function LoadingButton({
    onClick,
    children,
    style = {},
    disabled = false,
    type = 'button',
    className = ''
}) {
    const [loading, setLoading] = useState(false);

    const handleClick = async (e) => {
        if (loading || disabled) return;

        setLoading(true);
        try {
            await onClick(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={loading || disabled}
            className={className}
            style={{
                ...style,
                opacity: (loading || disabled) ? 0.6 : 1,
                cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
                position: 'relative'
            }}
        >
            {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite'
                    }} />
                    Loading...
                    <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
                </span>
            ) : children}
        </button>
    );
}
