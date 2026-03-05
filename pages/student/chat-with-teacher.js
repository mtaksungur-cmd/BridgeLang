'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { MessageSquare, Send, AlertTriangle, ChevronLeft } from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import styles from '../../scss/StudentChatUI.module.scss';
import Link from 'next/link';

export default function ChatWithTeacher() {
  const router = useRouter();
  const { teacherId } = router.query;
  const [teacher, setTeacher] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      
      if (teacherId) {
        try {
          const tSnap = await getDoc(doc(db, 'users', teacherId));
          if (tSnap.exists()) {
            setTeacher({ id: teacherId, ...tSnap.data() });
          }
        } catch (err) {
          console.error('Error loading teacher:', err);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [teacherId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !teacher || submitting) return;

    setSubmitting(true);
    try {
      // 1. Find or Create Conversation
      // Simplified: Just add to messages subcollection for a new/existing convo
      // In a real app, you'd check for an existing convo ID between these two users.
      const convRef = collection(db, 'conversations');
      const newConv = await addDoc(convRef, {
        participants: [currentUser.uid, teacher.id],
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });

      await addDoc(collection(db, 'conversations', newConv.id, 'messages'), {
        text: message.trim(),
        senderId: currentUser.uid,
        createdAt: new Date(),
      });

      router.push('/student/chats');
    } catch (err) {
      console.error('Send error:', err);
      alert('Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'5rem'}}>Loading...</div>;

  return (
    <>
      <SeoHead title={`Chat with ${teacher?.name || 'Teacher'}`} />
      
      <div style={{ background: 'linear-gradient(180deg, #f8f9fb 0%, #eef2ff 100%)', minHeight: '100vh' }}>
        <div className="container py-4">
           <Link href="/student/teachers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
            <ChevronLeft size={18} /> Back to Teachers
          </Link>

          <div className={styles.chatContainer}>
            <div className={styles.chatCard}>
              <div className={styles.chatHeader}>
                <div className={styles.iconBox}>
                  <MessageSquare size={24} />
                </div>
                <div className={styles.headerText}>
                  <h2>Chat with {teacher?.name || 'Teacher'}</h2>
                  <p>Most tutors reply within 24 hours.</p>
                </div>
              </div>

              <div className={styles.chatContent}>
                <p className={styles.instruction}>Use this space to introduce yourself or ask about lesson availability.</p>
                
                <div className={styles.exampleBox}>
                  <strong>Example:</strong>
                  <p>"Hi, I'm looking to book a lesson this week. Are you available on weekdays?"</p>
                </div>

                <form onSubmit={handleSend}>
                  <div className={styles.inputArea}>
                    <textarea 
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value.substring(0, 500))}
                      required
                    />
                    <div className={styles.inputFooter}>
                      <span className={styles.charCount}>{message.length} / 500</span>
                      <button 
                        type="submit" 
                        disabled={!message.trim() || submitting}
                        className={`${styles.btnSend} ${message.trim() ? styles.active : ''}`}
                      >
                        {submitting ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </form>

                <div className={styles.warningBox}>
                  <AlertTriangle className={styles.warningIcon} size={20} />
                  <p>Please avoid sharing personal contact details or external links.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
