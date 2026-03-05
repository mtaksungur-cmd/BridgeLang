import { TrendingUp, DollarSign, Clock, Target, Award } from 'lucide-react';

export default function EarningsBreakdown({ earnings }) {
    const { today = 0, week = 0, month = 0, total = 0 } = earnings || {};

    const periods = [
        {
            label: 'Today',
            amount: today,
            icon: Clock,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bg: '#ecfdf5',
            trend: '+12%'
        },
        {
            label: 'This Week',
            amount: week,
            icon: TrendingUp,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            bg: '#eff6ff',
            trend: '+8%'
        },
        {
            label: 'This Month',
            amount: month,
            icon: Target,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            bg: '#f5f3ff',
            trend: '+15%'
        },
        {
            label: 'All Time',
            amount: total,
            icon: Award,
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bg: '#fffbeb',
            trend: null
        }
    ];

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <DollarSign style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        Earnings Overview
                    </h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {periods.map((period) => {
                    const Icon = period.icon;
                    return (
                        <div
                            key={period.label}
                            style={{
                                padding: '1.25rem',
                                background: period.bg,
                                borderRadius: '12px',
                                border: '2px solid transparent',
                                transition: 'all 0.2s',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {period.label}
                                </span>
                                <Icon style={{ width: '18px', height: '18px', color: '#64748b' }} />
                            </div>

                            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
                                £{period.amount.toFixed(2)}
                            </div>

                            {period.trend && (
                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981' }}>
                                    {period.trend} vs last period
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
