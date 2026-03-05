// components/ReviewCard.js
import { useState } from 'react';
import { Star, Edit, Reply, Flag, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';

export default function ReviewCard({ review, onEdit, onReply, canEdit = false, canReply = false }) {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formatDate = (timestamp) => {
        try {
            const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    const isWithin7Days = () => {
        if (!review.createdAt) return false;
        const reviewDate = review.createdAt.seconds
            ? new Date(review.createdAt.seconds * 1000)
            : new Date(review.createdAt);
        const daysSince = (Date.now() - reviewDate) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
    };

    const handleReply = async () => {
        if (!replyText.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/reviews/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId: review.id,
                    teacherId: auth.currentUser?.uid,
                    replyText: replyText.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reply');
            }

            toast.success('Reply added!');
            setShowReplyBox(false);
            setReplyText('');
            if (onReply) onReply();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReport = async () => {
        if (!reportReason) {
            toast.error('Please select a reason');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/reviews/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId: review.id,
                    reportedBy: auth.currentUser?.uid,
                    reason: reportReason,
                    description: reportDescription
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to report');
            }

            toast.success('Report submitted');
            setShowReportModal(false);
            setReportReason('');
            setReportDescription('');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '16px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    {/* Student Photo */}
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        {review.studentPhoto ? (
                            <Image src={review.studentPhoto} alt={review.studentName} fill style={{ objectFit: 'cover' }} />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#64748b'
                            }}>
                                {review.studentName?.charAt(0) || 'S'}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                                {review.studentName || 'Anonymous'}
                            </h4>
                            {review.verifiedBooking && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                }}>
                                    <CheckCircle style={{ width: '12px', height: '12px' }} />
                                    Verified
                                </span>
                            )}
                            {review.edited && (
                                <span style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    fontStyle: 'italic'
                                }}>
                                    (edited)
                                </span>
                            )}
                        </div>

                        {/* Stars */}
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        fill: star <= review.rating ? '#fbbf24' : 'none',
                                        color: star <= review.rating ? '#fbbf24' : '#cbd5e1'
                                    }}
                                />
                            ))}
                        </div>

                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                            {formatDate(review.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {canEdit && isWithin7Days() && !review.edited && (
                        <button
                            onClick={() => onEdit && onEdit(review)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Edit review"
                        >
                            <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                    )}

                    {canReply && !review.teacherReply && (
                        <button
                            onClick={() => setShowReplyBox(!showReplyBox)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#10b981',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Reply to review"
                        >
                            <Reply style={{ width: '16px', height: '16px' }} />
                        </button>
                    )}

                    {!canEdit && !canReply && (
                        <button
                            onClick={() => setShowReportModal(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Report review"
                        >
                            <Flag style={{ width: '16px', height: '16px' }} />
                        </button>
                    )}
                </div>
            </div>

            {/* Comment */}
            <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#334155',
                margin: '12px 0 0 0'
            }}>
                {review.comment}
            </p>

            {/* Teacher Reply */}
            {review.teacherReply && (
                <div style={{
                    marginTop: '16px',
                    background: '#f8fafc',
                    borderLeft: '3px solid #3b82f6',
                    padding: '12px 16px',
                    borderRadius: '0 8px 8px 0'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#3b82f6',
                        marginBottom: '6px'
                    }}>
                        Teacher's Response
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                        {review.teacherReply}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                        {formatDate(review.teacherReplyDate)}
                    </p>
                </div>
            )}

            {/* Reply Box */}
            {showReplyBox && (
                <div style={{ marginTop: '16px' }}>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply... (max 500 characters)"
                        maxLength={500}
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '8px'
                    }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {replyText.length}/500
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowReplyBox(false)}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#64748b',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={submitting}
                                style={{
                                    padding: '8px 16px',
                                    background: '#10b981',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: 'white',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting ? 0.6 : 1
                                }}
                            >
                                {submitting ? 'Sending...' : 'Send Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
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
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                            Report Review
                        </h3>

                        <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '14px',
                                marginBottom: '12px'
                            }}
                        >
                            <option value="">Select a reason</option>
                            <option value="spam">Spam or fake</option>
                            <option value="inappropriate_language">Inappropriate language</option>
                            <option value="false_information">False information</option>
                            <option value="harassment">Harassment</option>
                            <option value="other">Other</option>
                        </select>

                        <textarea
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            placeholder="Additional details (optional)"
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                marginBottom: '16px'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowReportModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={submitting}
                                style={{
                                    padding: '10px 20px',
                                    background: '#ef4444',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'white',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting ? 0.6 : 1
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
