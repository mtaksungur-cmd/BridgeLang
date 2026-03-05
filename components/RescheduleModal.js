// components/RescheduleModal.js
import { useState } from 'react';
import LoadingButton from './LoadingButton';
import { notify } from '../lib/toast';

export default function RescheduleModal({ lesson, requestedBy, onClose, onConfirm }) {
    const [newDate, setNewDate] = useState(lesson.date);
    const [newTime, setNewTime] = useState(lesson.startTime);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReschedule = async () => {
        if (!newDate || !newTime) {
            notify.error('Please select a date and time');
            return;
        }

        // Validate not in past
        const proposedDateTime = new Date(`${newDate}T${newTime}:00`);
        if (proposedDateTime < new Date()) {
            notify.error('Cannot reschedule to a time in the past');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/booking/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: lesson.id,
                    newDate,
                    newStartTime: newTime,
                    requestedBy,
                    reason
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to request reschedule');
            }

            notify.success('Reschedule request sent. Waiting for approval.');
            onConfirm();
            onClose();
        } catch (err) {
            notify.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    📅 Reschedule Lesson
                </h2>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                        <strong>Current:</strong> {lesson.date} at {lesson.startTime}
                    </p>
                </div>

                {/* New Date */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        New Date
                    </label>
                    <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* New Time */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        New Time
                    </label>
                    <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Reason */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Reason (optional)
                    </label>
                    <textarea
                        placeholder="Why do you need to reschedule?"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            minHeight: '80px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{
                    padding: '0.75rem',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#92400e'
                }}>
                    <strong>Note:</strong> The {requestedBy === 'student' ? 'teacher' : 'student'} will be notified and must approve this change.
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.875rem',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            background: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <LoadingButton
                        onClick={handleReschedule}
                        style={{
                            flex: 1,
                            padding: '0.875rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Request'}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}
