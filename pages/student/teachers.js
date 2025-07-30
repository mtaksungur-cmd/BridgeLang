import { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import StudentLayout from '../../components/StudentLayout';
import SubscriptionBanner from "../../components/SubscriptionBanner";
import { useRouter } from 'next/router';

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeachers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'teacher' && user.status === 'approved');
      setTeachers(data);
      setLoading(false);
    };

    const checkPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const sSnap = await getDoc(doc(db, "users", user.uid));
      if (sSnap.exists()) {
        setActivePlan(sSnap.data().subscriptionPlan || "");
      }
    };

    fetchTeachers();
    checkPlan();
  }, []);

  if (loading) return <p>Loading teachers...</p>;

  // Abone değilse (plan yoksa) kartları blurla ve tıklanınca aboneliğe yönlendir
  const isLocked = !activePlan;

  return (
    <StudentLayout>
      <SubscriptionBanner />
      <div style={{ padding: 40 }}>
        <h2>Browse Our Teachers</h2>
        {isLocked && (
          <div style={{
            background: "#fee",
            border: "1px solid #f88",
            color: "#a11",
            padding: 16,
            borderRadius: 8,
            marginBottom: 30,
            textAlign: "center"
          }}>
            <b>You need a subscription to view teachers.</b>
            <br />
            <Link href="/student/subscription">
              <button style={{
                marginTop: 10,
                background: "#1464ff",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "8px 22px",
                cursor: "pointer"
              }}>See Plans</button>
            </Link>
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 22
        }}>
          {teachers.map(t => (
            <div
              key={t.id}
              style={{
                border: '1px solid #ccc',
                padding: 20,
                borderRadius: 10,
                filter: isLocked ? "blur(4.4px) grayscale(0.6)" : "none",
                opacity: isLocked ? 0.75 : 1,
                position: "relative"
              }}
              onClick={isLocked ? () => router.push("/student/subscription") : undefined}
            >
              <div style={{
                pointerEvents: isLocked ? "none" : "auto"
              }}>
                <Link href={`/student/teachers/${t.id}`}>
                  <h3 style={{ color: 'blue', cursor: 'pointer' }}>{t.name}</h3>
                </Link>
                {t.profilePhotoUrl && (
                  <img src={t.profilePhotoUrl} alt="Profile" width="100"
                    style={{ borderRadius: '50%', marginTop: 10 }} />
                )}
                <p><strong>Languages:</strong> {t.languagesTaught}</p>
                <p><strong>Experience:</strong> {t.experienceYears} years</p>
                <p><strong>Price:</strong><br />
                  30 min: £{t.pricing30}<br />
                  45 min: £{t.pricing45}<br />
                  60 min: £{t.pricing60}
                </p>
              </div>
              {isLocked && (
                <div style={{
                  position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
                  zIndex: 2, background: "rgba(255,255,255,0.52)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ color: "#a11", fontWeight: 600, fontSize: 16 }}>
                    Subscription required
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
