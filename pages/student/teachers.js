// pages/student/teachers.js
import SeoHead from '../../components/SeoHead';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import TeacherCard from '../../components/TeacherCard';
import styles from '../../scss/TutorsPagePremium.module.scss';
import { Search, Filter } from 'lucide-react';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'teacher'), where('approved', '==', true));
                const snap = await getDocs(q);
                setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching teachers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    return (
        <div className={styles.tutorPage}>
            <SeoHead title="Meet Our UK-Based Tutors" />
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Find Your Teacher</h1>
                    <p>Browse {teachers.length} qualified teachers</p>
                </header>

                <div className={styles.filterBar}>
                    <div className={styles.searchBox}>
                        <Search className={styles.icon} size={20} />
                        <input type="text" placeholder="Search by name, specialty..." />
                    </div>
                    <button className={styles.btnFilter}>
                        <Filter size={20} /> Filters
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
                         <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4a6fbd', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                         <span>Loading teachers...</span>
                    </div>
                ) : (
                    <div className={styles.tutorGrid}>
                        {teachers.length > 0 ? (
                            teachers.map(t => (
                                <TeacherCard key={t.id} teacher={t} />
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <p style={{ color: '#64748b' }}>No verified teachers found yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style jsx>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
