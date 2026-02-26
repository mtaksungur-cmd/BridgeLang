import React from 'react';
import { Star, CheckCircle2, Clock } from 'lucide-react';
import styles from '../scss/TutorsPagePremium.module.scss';
import Link from 'next/link';

export default function TeacherCard({ teacher }) {
    return (
        <div className={styles.tutorCard}>
            <div className={styles.cardTop}>
                <div style={{ width: 48, height: 48, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: '700', color: '#475569' }}>
                    {teacher.name?.charAt(0)}
                </div>
                <div className={styles.nameBox}>
                    <h3>
                        {teacher.name} 
                        <CheckCircle2 size={16} className={styles.verified} fill="currentColor" />
                        <span className={styles.flag}>🇬🇧</span>
                    </h3>
                </div>
            </div>

            <div className={styles.pricingSection}>
                <div className={styles.priceRow}>
                    <span className={styles.label}>From</span>
                    <span className={styles.amount}>£4.99</span>
                    <span className={styles.unit}>· 15 min intro</span>
                </div>
                <div className={styles.durations}>
                    <Clock size={14} />
                    <span>15 min</span>
                    <span>|</span>
                    <span>30 min</span>
                    <span>|</span>
                    <span>45 min</span>
                    <span>|</span>
                    <span>60 min</span>
                </div>
            </div>

            <div className={styles.cardContent}>
                <div className={styles.headline}>
                    {teacher.specialties?.[0] || 'English Teacher'} · IELTS Prep Specialist
                </div>

                <div className={styles.ratingRow}>
                    <div className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < 4 ? "#fbbf24" : "none"} color="#fbbf24" />
                        ))}
                    </div>
                    <span className={styles.ratingText}>4.8</span>
                    <span className={styles.reviewCount}>108 reviews</span>
                </div>

                <p className={styles.bio}>
                    {teacher.bio || "Friendly, experienced tutor helping students achieve their English goals."}
                </p>
            </div>

            <div className={styles.cardFooter}>
                <Link href={`/student/book/${teacher.id}`} className={styles.btnBook}>
                    Book intro or lesson
                </Link>
                <Link href={`/student/teacher/${teacher.id}`} className={styles.btnProfile}>
                    View profile
                </Link>
            </div>
        </div>
    );
}
