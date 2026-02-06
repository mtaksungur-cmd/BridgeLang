import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, addDoc, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { Send, Search, UserCircle, X, MessageSquare } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function Chats() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: user.uid, ...userDoc.data() });
        } else {
          setCurrentUser({ id: user.uid, email: user.email });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setCurrentUser({ id: user.uid, email: user.email });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherId = data.participants.find(p => p !== currentUser.id);
        const otherUserDoc = await getDoc(doc(db, 'users', otherId));
        const otherUser = otherUserDoc.exists() ? { id: otherId, ...otherUserDoc.data() } : { id: otherId, name: 'Unknown' };

        convs.push({
          id: docSnap.id,
          ...data,
          otherUser,
        });
      }

      convs.sort((a, b) => (b.lastMessageAt?.toDate() || 0) - (a.lastMessageAt?.toDate() || 0));
      setConversations(convs);
      setLoading(false);

      // Auto-select conversation if teacher param exists
      if (router.query.teacher) {
        const teacherId = router.query.teacher;
        const existingConv = convs.find(c => c.participants.includes(teacherId));

        if (existingConv) {
          setSelectedConv(existingConv);
        } else {
          // Create new conversation
          const newConvRef = doc(collection(db, 'conversations'));
          await setDoc(newConvRef, {
            participants: [currentUser.id, teacherId],
            createdAt: new Date(),
            lastMessageAt: new Date(),
          });
          // It will be auto-selected on next snapshot update
        }
        // Clear the query param
        router.replace('/student/chats', undefined, { shallow: true });
      }
    });

    return () => unsubscribe();
  }, [currentUser, router.query.teacher]);

  useEffect(() => {
    if (!selectedConv) return;

    const q = query(
      collection(db, 'conversations', selectedConv.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConv]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    await addDoc(collection(db, 'conversations', selectedConv.id, 'messages'), {
      text: newMessage,
      senderId: currentUser.id,
      createdAt: new Date(),
    });

    setNewMessage('');
  };

  const filteredConversations = searchTerm
    ? conversations.filter(c => c.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : conversations;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'white', fontSize: '1rem', fontWeight: '500' }}>Loading conversations...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Messages" description="Chat with teachers on BridgeLang" />

      {/* Modern gradient background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -1
      }} />

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Premium Header */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.3)',
          padding: '1.25rem 2rem',
          boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MessageSquare style={{ width: '32px', height: '32px', color: '#667eea' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Messages
            </h1>
          </div>
        </div>

        {/* Chat Container */}
        <div style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '2rem auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            height: 'calc(100vh - 180px)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>

            {/* Sidebar - Conversations List */}
            <div style={{ width: '380px', borderRight: '1px solid rgba(102,126,234,0.1)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.5)' }}>
              {/* Search Bar */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(102,126,234,0.1)' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      border: '2px solid rgba(102,126,234,0.2)',
                      borderRadius: '12px',
                      fontSize: '0.9375rem',
                      background: 'white',
                      outline: 'none',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(102,126,234,0.2)'}
                  />
                </div>
              </div>

              {/* Conversations */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                    <MessageSquare style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500', marginBottom: '0.5rem' }}>No conversations yet</p>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Start chatting with teachers!</p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      style={{
                        width: '100%',
                        padding: '1rem 1.25rem',
                        marginBottom: '0.5rem',
                        background: selectedConv?.id === conv.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        border: selectedConv?.id === conv.id ? 'none' : '1px solid rgba(102,126,234,0.1)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s',
                        transform: selectedConv?.id === conv.id ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: selectedConv?.id === conv.id ? '0 8px 20px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedConv?.id !== conv.id) {
                          e.currentTarget.style.background = 'rgba(102,126,234,0.05)';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedConv?.id !== conv.id) {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: selectedConv?.id === conv.id ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <UserCircle style={{ width: '28px', height: '28px', color: selectedConv?.id === conv.id ? 'white' : 'rgba(255,255,255,0.9)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: selectedConv?.id === conv.id ? 'white' : '#0f172a',
                            marginBottom: '0.25rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {conv.otherUser?.name || 'Unknown'}
                          </p>
                          <p style={{
                            fontSize: '0.8125rem',
                            color: selectedConv?.id === conv.id ? 'rgba(255,255,255,0.9)' : '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {conv.otherUser?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(102,126,234,0.1)',
                    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UserCircle style={{ width: '28px', height: '28px', color: 'white' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                          {selectedConv.otherUser?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {selectedConv.otherUser?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map(msg => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%',
                            padding: '1rem 1.25rem',
                            background: isMe ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                            color: isMe ? 'white' : '#0f172a',
                            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            fontSize: '0.9375rem',
                            lineHeight: '1.6',
                            boxShadow: isMe ? '0 4px 15px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                            border: isMe ? 'none' : '1px solid rgba(102,126,234,0.1)',
                            wordBreak: 'break-word'
                          }}>
                            {msg.text}
                            <div style={{ fontSize: '0.75rem', color: isMe ? 'rgba(255,255,255,0.8)' : '#94a3b8', marginTop: '0.5rem' }}>
                              {msg.createdAt?.toDate?.().toLocaleTimeString() || ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} style={{
                    padding: '1.5rem',
                    borderTop: '1px solid rgba(102,126,234,0.1)',
                    background: 'linear-gradient(135deg, rgba(102,126,234,0.02) 0%, rgba(118,75,162,0.02) 100%)'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                          flex: 1,
                          padding: '1rem 1.25rem',
                          border: '2px solid rgba(102,126,234,0.2)',
                          borderRadius: '16px',
                          fontSize: '0.9375rem',
                          background: 'white',
                          outline: 'none',
                          transition: 'all 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(102,126,234,0.2)'}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{
                          padding: '1rem 2rem',
                          background: newMessage.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s',
                          boxShadow: newMessage.trim() ? '0 4px 15px rgba(102,126,234,0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (newMessage.trim()) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = newMessage.trim() ? '0 4px 15px rgba(102,126,234,0.3)' : 'none';
                        }}
                      >
                        <Send style={{ width: '18px', height: '18px' }} />
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <MessageSquare style={{ width: '60px', height: '60px', color: '#667eea' }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Select a conversation
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#64748b', textAlign: 'center', maxWidth: '300px' }}>
                    Choose from your existing conversations or start a new chat with a teacher
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
