import React from 'react';
import { Clock } from 'lucide-react';
import styles from '../scss/TutorsPagePremium.module.scss';
import Link from 'next/link';
import Image from 'next/image';

export default function TeacherCard({ teacher }) {
    return (
        <div className={styles.tutorCard}>
            <div className={styles.cardTop}>
                {teacher.profilePhotoUrl ? (
                    <Image
                        src={teacher.profilePhotoUrl}
                        alt={teacher.name || 'Teacher'}
                        width={48}
                        height={48}
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: 48, height: 48, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: '700', color: '#475569' }}>
                        {teacher.name?.charAt(0)}
                    </div>
                )}
                <div className={styles.nameBox}>
                    <h3>
                        {teacher.name} 
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
