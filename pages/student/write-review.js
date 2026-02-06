// pages/student/write-review.js
import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, addDoc, collection, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { isInappropriate } from '../../lib/messageFilter';
import SeoHead from '../../components/SeoHead';

export default function WriteReview() {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hovered, setHovered] = useState(0);
    const [consentGiven, setConsentGiven] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            alert('Please write a comment about your experience.');
            return;
        }

        if (isInappropriate(comment)) {
            alert('Your comment contains inappropriate content. Please revise.');
            return;
        }

        if (!auth.currentUser) {
            alert('You must be logged in to submit a review.');
            return;
        }

        try {
            setSubmitting(true);

            const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            const userData = userSnap.data();

            let displayName = userData?.name || 'Anonymous';
            let displayPhoto = userData?.profilePhotoUrl || null;

            if (!consentGiven) {
                // Anonymize: "John Doe" → "j*** d***"
                const parts = displayName.split(' ');
                displayName = parts.map(p => p[0].toLowerCase() + '***').join(' ');
                displayPhoto = null;
            }

            await addDoc(collection(db, 'reviews'), {
                review_type: 'platform_student',
                studentId: auth.currentUser.uid,
                rating: Number(rating),
                comment: comment.trim(),
                display_name: displayName,
                display_photo: displayPhoto,
                hidden: false,
                createdAt: new Date().toISOString(),
            });

            alert('Thank you for sharing your experience! 🎉');
            router.push('/testimonials/student');
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <SeoHead
                title="Share Your Experience"
                description="Tell us about your experience with BridgeLang"
            />
            <div style={{
                minHeight: '100vh',
                background: '#f8fafc',
                padding: '2rem 1rem'
            }}>
                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        marginBottom: '0.5rem'
                    }}>
                        Share Your Experience
                    </h1>
                    <p style={{
                        fontSize: '0.9375rem',
                        color: '#64748b',
                        marginBottom: '2rem'
                    }}>
                        Tell us about your experience with BridgeLang platform
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Rating */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#334155',
                                marginBottom: '0.5rem'
                            }}>
                                Rating
                            </label>
                            <div
                                style={{ display: 'flex', gap: '0.25rem', fontSize: '2rem' }}
                                onMouseLeave={() => setHovered(0)}
                            >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHovered(star)}
                                        style={{
                                            cursor: 'pointer',
                                            color: star <= (hovered || rating) ? '#fbbf24' : '#e5e7eb',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#334155',
                                marginBottom: '0.5rem'
                            }}>
                                Your Experience
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="5"
                                placeholder="Share your thoughts about using BridgeLang..."
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '0.9375rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Consent */}
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: '#f1f5f9',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1'
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#475569'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={consentGiven}
                                    onChange={(e) => setConsentGiven(e.target.checked)}
                                    style={{ marginTop: '0.25rem' }}
                                />
                                <span>
                                    I agree to publicly display my full name and profile photo with this review.
                                    <br />
                                    <span style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem', display: 'inline-block' }}>
                                        If unchecked, your review will be anonymized (e.g., "j*** d***")
                                    </span>
                                </span>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    background: submitting ? '#94a3b8' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.9375rem',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'white',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '0.9375rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
