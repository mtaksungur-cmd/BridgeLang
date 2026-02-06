import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, addDoc, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Send, Search, MessageSquare, Settings } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function StudentChats() {
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
      const convos = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId = data.participants.find(id => id !== currentUser.id);

        if (otherUserId) {
          try {
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            convos.push({
              id: docSnap.id,
              ...data,
              otherUser: otherUserDoc.exists() ? { id: otherUserId, ...otherUserDoc.data() } : { id: otherUserId }
            });
          } catch (err) {
            console.error('Error fetching other user:', err);
          }
        }
      }
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedConv) return;

    const q = query(
      collection(db, 'conversations', selectedConv.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConv]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    try {
      await addDoc(collection(db, 'conversations', selectedConv.id, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.id,
        createdAt: new Date()
      });

      // Send notification to the other user
      const recipientId = selectedConv.otherUser?.id;
      if (recipientId) {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: recipientId,
            type: 'message',
            title: 'New Message',
            message: newMessage.trim().length > 50
              ? newMessage.trim().substring(0, 50) + '...'
              : newMessage.trim(),
            link: '/teacher/chats',
            senderId: currentUser.id,
            senderName: currentUser.name || currentUser.email,
            senderPhoto: currentUser.profilePhotoUrl || null,
            sendEmail: true,
          }),
        }).catch(err => console.error('Notification send failed:', err));
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const filteredConversations = searchTerm
    ? conversations.filter(c => c.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : conversations;

  const handleViewProfile = (userId) => {
    router.push(`/student/teacher-profile/${userId}`);
  };

  return (
    <>
      <SeoHead title="Messages" description="Chat with teachers on BridgeLang" />

      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2rem' }}>
        {/* Modern Container */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Chat Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            height: 'calc(100vh - 8rem)',
            display: 'grid',
            gridTemplateColumns: '320px 1fr'
          }}>

            {/* Left Sidebar - Conversations */}
            <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#fafbfc' }}>

              {/* Search */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#f8fafc';
                    }}
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                    <MessageSquare style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 0.875rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>No conversations yet</p>
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>Start chatting with teachers!</p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      style={{
                        padding: '1rem',
                        background: selectedConv?.id === conv.id ? 'white' : 'transparent',
                        borderLeft: selectedConv?.id === conv.id ? '3px solid #3b82f6' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedConv?.id !== conv.id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedConv?.id !== conv.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.0625rem',
                          fontWeight: '600',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(59,130,246,0.2)'
                        }}>
                          {(conv.otherUser?.name || 'T')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#0f172a',
                            marginBottom: '0.125rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {conv.otherUser?.name || 'Unknown'}
                          </p>
                          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            {conv.otherUser?.subject || 'Teacher'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Side - Chat Area */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'white' }}>
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div style={{
                    padding: '1rem 1.5rem',
                    background: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.0625rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(59,130,246,0.2)'
                      }}>
                        {(selectedConv.otherUser?.name || 'T')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                          {selectedConv.otherUser?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                          {selectedConv.otherUser?.subject || 'Teacher'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewProfile(selectedConv.otherUser?.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#475569';
                      }}
                    >
                      <Settings style={{ width: '14px', height: '14px' }} />
                      View Profile
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                        <MessageSquare style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#cbd5e1' }} />
                        <p style={{ fontSize: '0.9375rem', fontWeight: '500' }}>No messages yet</p>
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>Send a message to start the conversation</p>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '65%',
                              padding: '0.75rem 1rem',
                              background: isMe ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
                              color: isMe ? 'white' : '#0f172a',
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                              boxShadow: isMe ? '0 2px 8px rgba(59,130,246,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
                              wordBreak: 'break-word',
                              border: isMe ? 'none' : '1px solid #e2e8f0'
                            }}>
                              <div>{msg.text}</div>
                              <div style={{
                                fontSize: '0.6875rem',
                                color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                                marginTop: '0.375rem',
                                textAlign: 'right'
                              }}>
                                {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'white',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          background: '#f8fafc',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.background = 'white';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.background = '#f8fafc';
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{
                          width: '44px',
                          height: '44px',
                          background: newMessage.trim() ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#e2e8f0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                          boxShadow: newMessage.trim() ? '0 2px 8px rgba(59,130,246,0.25)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (newMessage.trim()) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.35)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = newMessage.trim() ? '0 2px 8px rgba(59,130,246,0.25)' : 'none';
                        }}
                      >
                        <Send style={{ width: '18px', height: '18px' }} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <MessageSquare style={{ width: '40px', height: '40px', color: '#3b82f6' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                    Select a conversation
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', maxWidth: '280px', margin: 0 }}>
                    Choose a conversation from the list to start messaging
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
