// pages/student/teachers.js
import SeoHead from '../../components/SeoHead';
import useSeoData from '../../lib/useSeoData';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import TeacherCard from '../../components/TeacherCard';
import styles from '../../scss/TutorsPagePremium.module.scss';
import { Search, Filter } from 'lucide-react';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { h1: seoH1 } = useSeoData();

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const usersRef = collection(db, 'users');
                // Onaylı öğretmenler: approved === true veya status === 'approved' (mevcut DB uyumu)
                const qApproved = query(usersRef, where('role', '==', 'teacher'), where('approved', '==', true));
                const qStatusApproved = query(usersRef, where('role', '==', 'teacher'), where('status', '==', 'approved'));
                const [snapApproved, snapStatus] = await Promise.all([getDocs(qApproved), getDocs(qStatusApproved)]);
                const byId = new Map();
                [...snapApproved.docs, ...snapStatus.docs].forEach(doc => {
                    if (!byId.has(doc.id)) byId.set(doc.id, { id: doc.id, ...doc.data() });
                });
                setTeachers(Array.from(byId.values()));
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
                    <h1>{seoH1 || 'Find Your Teacher'}</h1>
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
