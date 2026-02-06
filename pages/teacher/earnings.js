// pages/teacher/earnings.js
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import NavbarSwitcher from '../../components/NavbarSwitcher';
import EarningsChart from '../../components/EarningsChart';
import { TrendingUp, DollarSign, Clock, CheckCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherEarnings() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
                fetchEarnings(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchEarnings = async (teacherId) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/teacher/earnings?teacherId=${teacherId}`);

            if (!res.ok) {
                throw new Error('Failed to fetch earnings');
            }

            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching earnings:', error);
            toast.error('Failed to load earnings data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <NavbarSwitcher />
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div className="spinner" />
                        <p style={{ marginTop: '20px', color: '#64748b' }}>Loading earnings...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>My Earnings - BridgeLang Teacher</title>
            </Head>

            <NavbarSwitcher />

            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '40px 20px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: '36px',
                            fontWeight: '700',
                            color: 'white',
                            margin: '0 0 12px 0'
                        }}>
                            💰 My Earnings
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', margin: 0 }}>
                            Track your income and payment history
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '32px'
                    }}>
                        {/* Total Earnings */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <TrendingUp style={{ width: '24px', height: '24px', color: 'white' }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                    Total Earnings
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#0f172a',
                                margin: '8px 0 4px 0'
                            }}>
                                £{stats?.totalEarnings?.toFixed(2) || '0.00'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                {stats?.totalLessons || 0} lessons completed
                            </p>
                        </div>

                        {/* Pending Transfers */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                    Pending Transfers
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#0f172a',
                                margin: '8px 0 4px 0'
                            }}>
                                £{stats?.pendingTransfers?.toFixed(2) || '0.00'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                Awaiting processing
                            </p>
                        </div>

                        {/* Completed Transfers */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CheckCircle style={{ width: '24px', height: '24px', color: 'white' }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                    Received
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#0f172a',
                                margin: '8px 0 4px 0'
                            }}>
                                £{stats?.completedTransfers?.toFixed(2) || '0.00'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                In your account
                            </p>
                        </div>

                        {/* Average per Lesson */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <DollarSign style={{ width: '24px', height: '24px', color: 'white' }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                    Avg per Lesson
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#0f172a',
                                margin: '8px 0 4px 0'
                            }}>
                                £{stats?.averagePerLesson?.toFixed(2) || '0.00'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                {stats?.introLessons || 0} intro, {stats?.standardLessons || 0} standard
                            </p>
                        </div>
                    </div>

                    {/* Monthly Earnings Chart */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#0f172a',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Calendar style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                            Monthly Earnings
                        </h2>
                        <EarningsChart monthlyData={stats?.monthlyEarnings || []} />
                    </div>

                    {/* Transfer History */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#0f172a',
                            marginBottom: '20px'
                        }}>
                            Recent Transfers
                        </h2>

                        {stats?.transferHistory?.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse'
                                }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{
                                                textAlign: 'left',
                                                padding: '12px 8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#64748b'
                                            }}>Date</th>
                                            <th style={{
                                                textAlign: 'left',
                                                padding: '12px 8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#64748b'
                                            }}>Booking ID</th>
                                            <th style={{
                                                textAlign: 'right',
                                                padding: '12px 8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#64748b'
                                            }}>Amount</th>
                                            <th style={{
                                                textAlign: 'center',
                                                padding: '12px 8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#64748b'
                                            }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.transferHistory.map((transfer, index) => (
                                            <tr key={index} style={{
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                <td style={{
                                                    padding: '16px 8px',
                                                    fontSize: '14px',
                                                    color: '#0f172a'
                                                }}>
                                                    {formatDate(transfer.date)}
                                                </td>
                                                <td style={{
                                                    padding: '16px 8px',
                                                    fontSize: '13px',
                                                    color: '#64748b',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {transfer.bookingId.substring(0, 8)}...
                                                </td>
                                                <td style={{
                                                    padding: '16px 8px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    color: '#10b981',
                                                    textAlign: 'right'
                                                }}>
                                                    £{transfer.amount.toFixed(2)}
                                                </td>
                                                <td style={{
                                                    padding: '16px 8px',
                                                    textAlign: 'center'
                                                }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        background: '#d1fae5',
                                                        color: '#065f46',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        ✓ Completed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{
                                padding: '60px 20px',
                                textAlign: 'center',
                                background: '#f8fafc',
                                borderRadius: '8px'
                            }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>No transfer history yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
