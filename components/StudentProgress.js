// components/StudentProgress.js
import { useEffect, useState } from 'react';
import { BookOpen, Clock, TrendingUp, Award, Users } from 'lucide-react';
import Image from 'next/image';
import { Line } from 'react-chartjs-2';

export default function StudentProgress({ studentId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;

        const fetchProgress = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/student/progress?studentId=${studentId}`);

                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [studentId]);

    if (loading) {
        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div className="spinner" />
                <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading progress...</p>
            </div>
        );
    }

    if (!stats) return null;

    // Chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const chartLabels = stats.monthlyLessons.map(item => {
        const [year, month] = item.month.split('-');
        return `${monthNames[parseInt(month) - 1]}`;
    });

    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Lessons',
                data: stats.monthlyLessons.map(item => item.count),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 10,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: '#64748b' },
                grid: { color: '#f1f5f9' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b' }
            }
        }
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '24px'
            }}>
                📊 Your Learning Progress
            </h2>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}>
                {/* Total Lessons */}
                <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <BookOpen style={{ width: '24px', height: '24px' }} />
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>Total Lessons</span>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
                        {stats.totalLessons}
                    </p>
                    <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>
                        {stats.completedLessons} completed
                    </p>
                </div>

                {/* Total Hours */}
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Clock style={{ width: '24px', height: '24px' }} />
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>Learning Hours</span>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
                        {stats.totalHours}h
                    </p>
                    <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>
                        {stats.upcomingLessons} upcoming
                    </p>
                </div>

                {/* Learning Streak */}
                <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Award style={{ width: '24px', height: '24px' }} />
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>Day Streak</span>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
                        {stats.learningStreak} 🔥
                    </p>
                    <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>
                        {stats.learningStreak > 0 ? 'Keep it up!' : 'Start today!'}
                    </p>
                </div>
            </div>

            {/* Progress Chart */}
            {stats.monthlyLessons.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#0f172a',
                        marginBottom: '16px'
                    }}>
                        Lessons Over Time
                    </h3>
                    <div style={{ height: '200px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Favorite Teachers */}
            {stats.favoriteTeachers.length > 0 && (
                <div>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#0f172a',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Users style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
                        Your Favorite Teachers
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats.favoriteTeachers.map((teacher, index) => (
                            <div
                                key={teacher.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    background: '#f8fafc',
                                    borderRadius: '8px'
                                }}
                            >
                                {/* Rank */}
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#fb923c',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '14px'
                                }}>
                                    {index + 1}
                                </div>

                                {/* Photo */}
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: '#e2e8f0',
                                    position: 'relative'
                                }}>
                                    {teacher.photo ? (
                                        <Image
                                            src={teacher.photo}
                                            alt={teacher.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#64748b',
                                            fontSize: '18px',
                                            fontWeight: '600'
                                        }}>
                                            {teacher.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Name & Count */}
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#0f172a'
                                    }}>
                                        {teacher.name}
                                    </p>
                                    <p style={{
                                        margin: '2px 0 0 0',
                                        fontSize: '12px',
                                        color: '#64748b'
                                    }}>
                                        {teacher.lessonCount} lesson{teacher.lessonCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
