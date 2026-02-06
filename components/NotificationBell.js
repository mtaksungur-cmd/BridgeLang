import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/router';

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUserId(user?.uid || null);
        });
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!currentUserId) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUserId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n) => !n.read).length);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.read) {
            try {
                await fetch('/api/notifications/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        notificationIds: [notification.id],
                        userId: currentUserId,
                    }),
                });
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Navigate to link
        if (notification.link) {
            router.push(notification.link);
        }
        setShowDropdown(false);
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notificationIds: unreadIds,
                    userId: currentUserId,
                }),
            });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const formatTime = (createdAt) => {
        if (!createdAt) return '';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt.seconds * 1000);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                }}
            >
                <Bell style={{ width: '20px', height: '20px', color: '#64748b' }} />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {/* Dropdown Panel */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowDropdown(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                        }}
                    />

                    {/* Dropdown */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '380px',
                        maxHeight: '500px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        zIndex: 1000,
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        fontSize: '0.8125rem',
                                        color: '#3b82f6',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                    }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{
                                    padding: '3rem 1.5rem',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                }}>
                                    <Bell style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        style={{
                                            padding: '1rem 1.25rem',
                                            borderBottom: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            background: notif.read ? 'white' : '#f8fafc',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = notif.read ? 'white' : '#f8fafc')}
                                    >
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            {/* Avatar/Icon */}
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: notif.senderPhoto
                                                    ? `url(${notif.senderPhoto}) center/cover`
                                                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                flexShrink: 0,
                                            }}>
                                                {!notif.senderPhoto && (notif.senderName?.[0] || '?').toUpperCase()}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: notif.read ? '500' : '700',
                                                    color: '#0f172a',
                                                    marginBottom: '0.25rem',
                                                }}>
                                                    {notif.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8125rem',
                                                    color: '#64748b',
                                                    lineHeight: '1.4',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {notif.message}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#94a3b8',
                                                    marginTop: '0.25rem',
                                                }}>
                                                    {formatTime(notif.createdAt)}
                                                </div>
                                            </div>

                                            {/* Unread Indicator */}
                                            {!notif.read && (
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    flexShrink: 0,
                                                    marginTop: '6px',
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
