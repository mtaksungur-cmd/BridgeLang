import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export default function WelcomeBanner({ plan, onDismiss }) {
    const [show, setShow] = useState(true);
    const [confetti, setConfetti] = useState(true);

    useEffect(() => {
        // Hide confetti after 3 seconds
        const timer = setTimeout(() => setConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    const planConfig = {
        starter: {
            title: 'Welcome to BridgeLang+!',
            emoji: '🎉',
            color: '#10b981',
            benefits: ['60 teacher views/month', '20 messages', 'Priority support']
        },
        pro: {
            title: 'Welcome to BridgeLang PRO!',
            emoji: '⚡',
            color: '#2563eb',
            benefits: ['Unlimited teacher views', 'Unlimited messages', '24/7 VIP support', '20% discount on lessons']
        },
        vip: {
            title: 'Welcome to BridgeLang VIP!',
            emoji: '👑',
            color: '#8b5cf6',
            benefits: ['Everything in PRO', 'Personal learning advisor', '30% discount on lessons', 'Exclusive teacher access']
        }
    };

    const config = planConfig[plan] || planConfig.starter;

    const handleDismiss = () => {
        setShow(false);
        if (onDismiss) onDismiss();
    };

    return (
        <>
            {confetti && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 9999
                }}>
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${Math.random() * 100}%`,
                                top: '-10px',
                                width: '10px',
                                height: '10px',
                                background: ['#10b981', '#2563eb', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
                                animation: `fall ${2 + Math.random() * 3}s linear forwards`,
                                opacity: 0.8
                            }}
                        />
                    ))}
                </div>
            )}

            <div style={{
                background: `linear-gradient(135deg, ${config.color}15, ${config.color}05)`,
                border: `2px solid ${config.color}40`,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background sparkle effect */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '200px',
                    height: '200px',
                    background: `radial-gradient(circle, ${config.color}20, transparent)`,
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <button
                    onClick={handleDismiss}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#00000010'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </button>

                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    <div style={{
                        fontSize: '3rem',
                        lineHeight: 1,
                        animation: 'bounce 1s ease-in-out infinite'
                    }}>
                        {config.emoji}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            margin: '0 0 0.5rem 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {config.title}
                            <Sparkles style={{ width: '20px', height: '20px', color: config.color }} />
                        </h3>

                        <p style={{
                            fontSize: '0.9375rem',
                            color: '#64748b',
                            margin: '0 0 1rem 0'
                        }}>
                            You've unlocked premium features! Here's what you get:
                        </p>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {config.benefits.map((benefit, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.625rem',
                                    fontSize: '0.9375rem',
                                    color: '#0f172a'
                                }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: config.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        flexShrink: 0
                                    }}>
                                        ✓
                                    </div>
                                    <span style={{ fontWeight: '500' }}>{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => window.location.href = '/student/teachers'}
                            style={{
                                marginTop: '1em',
                                padding: '0.75rem 1.5rem',
                                background: config.color,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9375rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 4px 12px ${config.color}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Start Learning Now →
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
        </>
    );
}
