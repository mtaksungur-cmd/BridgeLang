import { useEffect, useState } from 'react';
import { Calendar as Cal, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function LessonCalendar({ lessons = [], onDateClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const getLessonsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return lessons.filter(l => l.date === dateStr);
    };

    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Cal style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {monthName}
                    </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        style={{
                            padding: '0.5rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        style={{
                            padding: '0.5rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronRight style={{ width: '16px', height: '16px' }} />
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#64748b',
                        padding: '0.5rem'
                    }}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {days.map((day, index) => {
                    if (!day) {
                        return <div key={index} />;
                    }

                    const dayLessons = getLessonsForDate(day);
                    const hasLessons = dayLessons.length > 0;
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate?.toDateString() === day.toDateString();

                    return (
                        <button
                            key={index}
                            onClick={() => {
                                setSelectedDate(day);
                                onDateClick && onDateClick(day, dayLessons);
                            }}
                            style={{
                                padding: '0.75rem',
                                background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : hasLessons ? '#eff6ff' : 'white',
                                border: isToday ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = hasLessons ? '#eff6ff' : 'white')}
                        >
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: isToday ? '700' : '500',
                                color: isSelected ? 'white' : isToday ? '#3b82f6' : '#0f172a',
                                marginBottom: hasLessons ? '0.25rem' : 0
                            }}>
                                {day.getDate()}
                            </div>
                            {hasLessons && (
                                <div style={{
                                    fontSize: '0.625rem',
                                    fontWeight: '600',
                                    color: isSelected ? 'white' : '#3b82f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                }}>
                                    <Clock style={{ width: '10px', height: '10px' }} />
                                    {dayLessons.length}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
