// components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);

        // TODO: Send to error monitoring service (Sentry)
        // if (window.Sentry) {
        //   window.Sentry.captureException(error);
        // }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '2rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '3rem',
                        maxWidth: '500px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '2.5rem'
                        }}>
                            😢
                        </div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '0.75rem'
                        }}>
                            Something went wrong
                        </h1>
                        <p style={{
                            color: '#64748b',
                            marginBottom: '2rem',
                            lineHeight: '1.6'
                        }}>
                            We're sorry, but something unexpected happened. Our team has been notified and we're working on it.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#667eea',
                                color: 'white',
                                padding: '0.875rem 2rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#5568d3'}
                            onMouseLeave={(e) => e.target.style.background = '#667eea'}
                        >
                            Reload Page
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                background: 'transparent',
                                color: '#667eea',
                                padding: '0.875rem 2rem',
                                borderRadius: '8px',
                                border: '2px solid #667eea',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginLeft: '1rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
