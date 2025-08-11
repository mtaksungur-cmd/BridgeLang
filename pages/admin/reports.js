import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState({});
  const [teachers, setTeachers] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      const snap = await getDocs(collection(db, 'complaints'));
      const reportList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportList);

      const userIds = new Set();
      const teacherIds = new Set();

        for (let r of reportList) {
        // Booking ID yoksa geç
        if (!r.bookingId) continue;

        try {
            const bookingSnap = await getDoc(doc(db, 'bookings', r.bookingId));
            if (bookingSnap.exists()) {
            const booking = bookingSnap.data();
            r.teacherId = booking.teacherId;
            teacherIds.add(booking.teacherId);
            }
        } catch (err) {
            console.error('Failed to fetch booking for complaint:', r.id, err);
        }
        }

      // Öğrenci ve öğretmen bilgilerini topla
      const userMap = {};
      for (let uid of userIds) {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) userMap[uid] = userSnap.data();
      }

      const teacherMap = {};
      for (let tid of teacherIds) {
        const tSnap = await getDoc(doc(db, 'users', tid));
        if (tSnap.exists()) teacherMap[tid] = tSnap.data();
      }

      setUsers(userMap);
      setTeachers(teacherMap);
      setReports([...reportList]); // teacherId'ler eklenmiş haliyle yeniden set et
    };

    fetchReports();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>🚨 Complaints</h2>
      {reports.length === 0 ? (
        <p>No complaints submitted.</p>
      ) : (
        reports.map((r, i) => {
          const user = users[r.userId] || {};
          const teacher = teachers[r.teacherId] || {};
          return (
            <div key={i} style={{ border: '1px solid #ccc', marginBottom: 20, padding: 15 }}>
              <p><strong>Submitted by:</strong> {user.name || r.userId} ({r.role})</p>
              <p><strong>Teacher:</strong> {r.teacherId} {teacher.name ? `(${teacher.name})` : ''}</p>
              <p><strong>Booking ID:</strong> {r.bookingId}</p>
              <p><strong>Reason:</strong> {r.reason}</p>
              <p><strong>Description:</strong><br />{r.description}</p>
              <p><strong>Status:</strong> {r.status}</p>
              <p style={{ fontSize: 13, color: '#888' }}>
                {r.createdAt?.toDate?.().toLocaleString?.() || 'Unknown date'}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
