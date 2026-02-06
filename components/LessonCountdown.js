import { useEffect, useState } from 'react';
import { Clock, Video } from 'lucide-react';

export default function LessonCountdown({ lesson, onJoin }) {
    const [timeUntil, setTimeUntil] = useState(null);
    const [canJoin, setCanJoin] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            if (!lesson?.date || !lesson?.startTime) return;

            const [year, month, day] = lesson.date.split('-').map(Number);
            const [hours, minutes] = lesson.startTime.split(':').map(Number);

            const lessonTime = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();
            const diff = lessonTime - now;

            // Can join 5 minutes before
            const canJoinTime = diff <= 5 * 60 * 1000 && diff > -60 * 60 * 1000; // 5min before to 1h after
            setCanJoin(canJoinTime);

            if (diff < 0) {
                setTimeUntil('Lesson started');
            } else if (diff < 60 * 1000) {
                setTimeUntil(`${Math.floor(diff / 1000)}s`);
            } else if (diff < 60 * 60 * 1000) {
                const mins = Math.floor(diff / (60 * 1000));
                setTimeUntil(`${mins}m`);
            } else if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor(diff / (60 * 60 * 1000));
                const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
                setTimeUntil(`${hours}h ${mins}m`);
            } else {
                const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                setTimeUntil(`${days}d`);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [lesson]);

    if (!lesson?.meetingLink) return null;

    return (
        <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: canJoin ? '#dcfce7' : '#f3f4f6',
            border: `2px solid ${canJoin ? '#10b981' : '#e5e7eb'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock style={{ width: '20px', height: '20px', color: canJoin ? '#059669' : '#6b7280' }} />
                <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: canJoin ? '#065f46' : '#374151' }}>
                        {canJoin ? 'Ready to join!' : `Starts in ${timeUntil}`}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                        {lesson.startTime} - {lesson.endTime}
                    </p>
                </div>
            </div>

            {canJoin && (
                <button
                    onClick={() => window.open(lesson.meetingLink, '_blank')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                >
                    <Video style={{ width: '16px', height: '16px' }} />
                    Join Lesson
                </button>
            )}
        </div>
    );
}
