import Image from 'next/image';
import Link from 'next/link';
import styles from '../scss/TeacherCard.module.scss';

export default function TeacherCard({ teacher }) {
    const {
        id,
        name,
        photoURL,
        location,
        teaches,
        pricing30,
        verified,
        rating,
        reviewCount,
    } = teacher;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.name}>{name}</h3>
                {verified && (
                    <div className={styles.verifiedBadge}>
                        <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Verified Tutor</span>
                    </div>
                )}
            </div>

            <div className={styles.avatarWrapper}>
                <Image
                    src={photoURL || '/default-avatar.png'}
                    alt={name}
                    width={200}
                    height={200}
                    className={styles.avatar}
                />
            </div>

            <div className={styles.info}>
                <div className={styles.infoRow}>
                    <span className={styles.label}>Location:</span>
                    <span className={styles.value}>{location}</span>
                </div>
                <div className={styles.infoRow}>
                    <span className={styles.label}>Teaches:</span>
                    <span className={styles.value}>{teaches}</span>
                </div>
            </div>

            <div className={styles.pricing}>
                <span className={styles.priceLabel}>From</span>
                <span className={styles.priceValue}>£{pricing30}</span>
                <span className={styles.duration}>/ 30 min</span>
            </div>

            {rating && (
                <div className={styles.rating}>
                    <span className={styles.stars}>{'★'.repeat(Math.floor(rating))}</span>
                    <span className={styles.ratingValue}>{rating}</span>
                    <span className={styles.reviewCount}>({reviewCount} reviews)</span>
                </div>
            )}

            <div className={styles.availability}>
                15-minute intro available (£6.99)
            </div>

            <Link href={`/student/teacher/${id}`} className={styles.viewButton}>
                View profile
            </Link>

            <p className={styles.footnote}>
                You can change tutors anytime.
            </p>
        </div>
    );
}
