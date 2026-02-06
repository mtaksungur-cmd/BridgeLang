import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
    MapPin, Star, Briefcase, Globe, Award, Video, Car, Calendar, ArrowLeft,
    MessageCircle, CheckCircle, Users, BookOpen, Clock, ChevronRight, Play
} from 'lucide-react';
import SeoHead from '../../../components/SeoHead';

export default function TeacherProfile() {
    const router = useRouter();
    const { id } = router.query;
    const [teacher, setTeacher] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch teacher
                const teacherDoc = await getDoc(doc(db, 'users', id));
                if (!teacherDoc.exists()) {
                    router.push('/student/teachers');
                    return;
                }
                const teacherData = { id: teacherDoc.id, ...teacherDoc.data() };

                // Fetch reviews
                const reviewsQuery = query(collection(db, 'reviews'), where('teacherId', '==', id));
                const reviewsSnap = await getDocs(reviewsQuery);
                const reviewsData = await Promise.all(
                    reviewsSnap.docs.map(async (reviewDoc) => {
                        const reviewData = { id: reviewDoc.id, ...reviewDoc.data() };
                        if (reviewData.studentId) {
                            const studentDoc = await getDoc(doc(db, 'users', reviewData.studentId));
                            reviewData.student = studentDoc.exists() ? studentDoc.data() : null;
                        }
                        return reviewData;
                    })
                );

                // Calculate rating
                if (reviewsData.length > 0) {
                    const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
                    teacherData.rating = avgRating;
                    teacherData.totalReviews = reviewsData.length;
                }

                setTeacher(teacherData);
                setReviews(reviewsData);
            } catch (error) {
                console.error('Error fetching teacher:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    const handleBookLesson = () => {
        if (!currentUser) {
            router.push('/login');
        } else {
            router.push(`/student/book/${id}`);
        }
    };

    const handleSendMessage = () => {
        if (!currentUser) {
            router.push('/login');
        } else {
            router.push('/student/chats');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '48px', height: '48px', border: '4px solid #e2e8f0',
                    borderTopColor: '#3b82f6', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!teacher) return null;

    const specializations = teacher.teachingSpecializations
        ? teacher.teachingSpecializations.split(',').map(s => s.trim())
        : [];

    return (
        <>
            <SeoHead
                title={teacher?.name ? `${teacher.name} - Teacher Profile` : "Teacher Profile"}
                description={teacher?.bio || "View teacher profile and book lessons on BridgeLang."}
            />

            <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
                {/* Header */}
                <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
                        <Link href="/student/teachers">
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: '0.875rem', color: '#64748b', fontWeight: '500',
                                padding: '0.5rem 0', transition: 'color 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                            >
                                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                                Back to Teachers
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>

                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Teacher Header Card */}
                            <div style={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '2rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        background: teacher.profilePhotoUrl
                                            ? `url(${teacher.profilePhotoUrl}) center/cover`
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        flexShrink: 0,
                                        border: '4px solid #f8fafc',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }} />

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                                {teacher.name}
                                            </h1>
                                            {teacher.verified && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.375rem',
                                                    padding: '0.25rem 0.625rem',
                                                    background: '#dcfce7',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#166534'
                                                }}>
                                                    <CheckCircle style={{ width: '14px', height: '14px' }} />
                                                    Verified
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: '#64748b', marginBottom: '1rem' }}>
                                            <MapPin style={{ width: '16px', height: '16px' }} />
                                            {teacher.city}, {teacher.country}
                                        </div>

                                        {teacher.rating && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <Star
                                                            key={i}
                                                            style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                fill: i <= Math.round(teacher.rating) ? '#fbbf24' : 'none',
                                                                color: i <= Math.round(teacher.rating) ? '#fbbf24' : '#cbd5e1'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>
                                                    {teacher.rating.toFixed(1)}
                                                </span>
                                                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                                                    ({teacher.totalReviews} {teacher.totalReviews === 1 ? 'review' : 'reviews'})
                                                </span>
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                                                    {teacher.totalLessons || 0}
                                                </div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                    Lessons
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                                                    {teacher.experienceYears || 0}
                                                </div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                    Years Exp.
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                                                    {teacher.totalReviews || 0}
                                                </div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                    Reviews
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Intro Video (if available) */}
                            {teacher.intro_video_path && (
                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <Play style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                                            Introduction Video
                                        </h2>
                                    </div>
                                    <video
                                        controls
                                        style={{
                                            width: '100%',
                                            borderRadius: '8px',
                                            backgroundColor: '#000'
                                        }}
                                    >
                                        <source src={teacher.intro_video_path} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}

                            {/* About Section */}
                            {teacher.bio && (
                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                                        About Me
                                    </h2>
                                    <p style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {teacher.bio}
                                    </p>
                                </div>
                            )}

                            {/* Teaching Details */}
                            <div style={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '2rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Teaching Details
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {teacher.languagesSpoken && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Globe style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                    Languages Spoken
                                                </div>
                                                <div style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: '500' }}>
                                                    {teacher.languagesSpoken}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {specializations.length > 0 && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Award style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                    Specializations
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {specializations.map((spec, idx) => {
                                                        const badgeColors = ['badge-purple', 'badge-blue', 'badge-green', 'badge-orange', 'badge-pink'];
                                                        const colorClass = badgeColors[idx % badgeColors.length];
                                                        return (
                                                            <span key={idx} className={`badge-vibrant ${colorClass}`}>
                                                                {spec}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {teacher.deliveryMethod && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Video style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                    Delivery Method
                                                </div>
                                                <div style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: '500' }}>
                                                    {teacher.deliveryMethod}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {teacher.studentAges && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Users style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                    Student Ages
                                                </div>
                                                <div style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: '500' }}>
                                                    {teacher.studentAges}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {teacher.willingToTravel && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Car style={{ width: '20px', height: '20px', color: '#22c55e', flexShrink: 0, marginTop: '0.125rem' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                    Travel
                                                </div>
                                                <div style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: '500' }}>
                                                    Willing to travel
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Student Reviews */}
                            {reviews.length > 0 && (
                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                        Student Reviews ({reviews.length})
                                    </h2>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {reviews.slice(0, 5).map(review => (
                                            <div key={review.id} style={{
                                                paddingBottom: '1.5rem',
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '0.75rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: review.student?.profilePhotoUrl
                                                            ? `url(${review.student.profilePhotoUrl}) center/cover`
                                                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: '600',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {!review.student?.profilePhotoUrl && (review.student?.name || 'S')[0].toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                                                            {review.student?.name || 'Anonymous Student'}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <Star
                                                                    key={i}
                                                                    style={{
                                                                        width: '14px',
                                                                        height: '14px',
                                                                        fill: i <= review.rating ? '#fbbf24' : 'none',
                                                                        color: i <= review.rating ? '#fbbf24' : '#cbd5e1'
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p style={{
                                                        fontSize: '0.9375rem',
                                                        color: '#475569',
                                                        lineHeight: '1.6',
                                                        margin: 0,
                                                        paddingLeft: '3.5rem'
                                                    }}>
                                                        "{review.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar - Booking Card (Sticky) */}
                        <div style={{ position: 'sticky', top: '2rem' }}>
                            <div style={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '2rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Book a Lesson
                                </h3>

                                {/* Pricing Options */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    {teacher.pricing30 && (
                                        <div style={{
                                            padding: '0.875rem 1rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                                                    30 minutes
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Quick lesson
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#3b82f6' }}>
                                                £{teacher.pricing30}
                                            </div>
                                        </div>
                                    )}
                                    {teacher.pricing45 && (
                                        <div style={{
                                            padding: '0.875rem 1rem',
                                            background: '#eff6ff',
                                            borderRadius: '8px',
                                            border: '2px solid #3b82f6',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    45 minutes
                                                    <span style={{ fontSize: '0.625rem', fontWeight: '700', color: '#3b82f6', background: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                                                        POPULAR
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Standard lesson
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#3b82f6' }}>
                                                £{teacher.pricing45}
                                            </div>
                                        </div>
                                    )}
                                    {teacher.pricing60 && (
                                        <div style={{
                                            padding: '0.875rem 1rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                                                    60 minutes
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Extended lesson
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#3b82f6' }}>
                                                £{teacher.pricing60}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <button
                                    onClick={handleBookLesson}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.75rem',
                                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                                    }}
                                >
                                    <Calendar style={{ width: '18px', height: '18px' }} />
                                    Book Lesson
                                </button>

                                <button
                                    onClick={handleSendMessage}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: 'white',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '0.9375rem',
                                        fontWeight: '600',
                                        color: '#475569',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.borderColor = '#3b82f6';
                                        e.currentTarget.style.color = '#3b82f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                        e.currentTarget.style.color = '#475569';
                                    }}
                                >
                                    <MessageCircle style={{ width: '18px', height: '18px' }} />
                                    Send Message
                                </button>

                                {/* Info Box */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: '#f0fdf4',
                                    borderRadius: '8px',
                                    border: '1px solid #bbf7d0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Clock style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#166534' }}>
                                            Fast Response
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: '1.5' }}>
                                        This teacher typically responds within 24 hours
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
