// components/CancelLessonModal.js
import { useState } from 'react';
import LoadingButton from './LoadingButton';
import { notify } from '../lib/toast';

export default function CancelLessonModal({ lesson, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    //Calculate hours until lesson
    const calculateHoursUntil = () => {
        const lessonDateTime = new Date(`${lesson.date}T${lesson.startTime}:00`);
        const now = new Date();
        return (lessonDateTime - now) / (1000 * 60 * 60);
    };

    const hoursUntil = calculateHoursUntil();

    // Determine refund
    let refundPercent = 0;
    if (hoursUntil > 24) refundPercent = 100;
    else if (hoursUntil > 12) refundPercent = 50;

    const refundAmount = ((lesson.amountPaid || 0) * refundPercent) / 100;

    const handleCancel = async () => {
        if (!window.confirm(`Are you sure you want to cancel this lesson?${refundPercent === 0 ? ' No refund will be issued.' : ''}`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/booking/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: lesson.id,
                    cancelledBy: 'student',
                    reason
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to cancel');
            }

            notify.success(`Lesson cancelled${refundPercent > 0 ? `. ${refundPercent}% refund will be processed.` : '.'}`);
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
                    Cancel Lesson
                </h2>

                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0.5rem 0', color: '#64748b' }}>
                        <strong>Date:</strong> {lesson.date}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#64748b' }}>
                        <strong>Time:</strong> {lesson.startTime}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#64748b' }}>
                        <strong>Teacher:</strong> {lesson.teacherName || 'Teacher'}
                    </p>
                </div>

                {/* Refund Info */}
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: refundPercent === 100 ? '#d1fae5' : refundPercent === 50 ? '#fef3c7' : '#fee2e2',
                    border: `2px solid ${refundPercent === 100 ? '#10b981' : refundPercent === 50 ? '#f59e0b' : '#ef4444'}`
                }}>
                    {hoursUntil > 24 && (
                        <div>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
                            <strong>Full Refund:</strong> £{refundAmount.toFixed(2)} (100%)
                        </div>
                    )}
                    {hoursUntil > 12 && hoursUntil <= 24 && (
                        <div>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                            <strong>Partial Refund:</strong> £{refundAmount.toFixed(2)} (50%)
                        </div>
                    )}
                    {hoursUntil <= 12 && (
                        <div>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>❌</div>
                            <strong>No Refund</strong><br />
                            <small>Cancellations less than 12 hours before are not refundable per our policy.</small>
                        </div>
                    )}
                </div>

                {/* Reason */}
                <textarea
                    placeholder="Reason for cancellation (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #e2e8f0',
                        marginBottom: '1rem',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        minHeight: '80px',
                        resize: 'vertical'
                    }}
                />

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
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Keep Lesson
                    </button>
                    <LoadingButton
                        onClick={handleCancel}
                        style={{
                            flex: 1,
                            padding: '0.875rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#ef4444',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}
