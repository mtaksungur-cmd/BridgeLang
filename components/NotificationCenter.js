// components/NotificationCenter.js
import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, DollarSign, Calendar, Star, MessageCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationCenter({ userId }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    // Real-time listener for unread notifications
    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
            setLoading(false);
        }, (error) => {
            console.error('Notification listener error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true,
                readAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifs = notifications.filter(n => !n.read);

            await Promise.all(
                unreadNotifs.map(notif =>
                    updateDoc(doc(db, 'notifications', notif.id), {
                        read: true,
                        readAt: new Date().toISOString()
                    })
                )
            );
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'payment_received':
                return <DollarSign style={{ width: '18px', height: '18px', color: '#10b981' }} />;
            case 'lesson_reminder':
                return <Clock style={{ width: '18px', height: '18px', color: '#f59e0b' }} />;
            case 'booking_confirmed':
                return <Calendar style={{ width: '18px', height: '18px', color: '#3b82f6' }} />;
            case 'review_received':
                return <Star style={{ width: '18px', height: '18px', color: '#fbbf24' }} />;
            case 'reschedule_request':
                return <MessageCircle style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />;
            default:
                return <Bell style={{ width: '18px', height: '18px', color: '#64748b' }} />;
        }
    };

    const getTimeAgo = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <Bell style={{ width: '20px', height: '20px', color: '#64748b' }} />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        minWidth: '18px',
                        textAlign: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '380px',
                    maxHeight: '500px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    zIndex: 9999,
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                            Notifications
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#3b82f6',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setShowDropdown(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X style={{ width: '18px', height: '18px', color: '#64748b' }} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Bell style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                                <p style={{ color: '#94a3b8', margin: 0 }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <Link
                                    key={notif.id}
                                    href={notif.actionUrl || '#'}
                                    onClick={() => {
                                        if (!notif.read) markAsRead(notif.id);
                                        setShowDropdown(false);
                                    }}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div
                                        style={{
                                            padding: '14px 16px',
                                            borderBottom: '1px solid #f1f5f9',
                                            background: notif.read ? 'white' : '#f8fafc',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'start'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'white' : '#f8fafc'}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {getIcon(notif.type)}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'start',
                                                marginBottom: '4px'
                                            }}>
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: '#0f172a'
                                                }}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.read && (
                                                    <div style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: '#3b82f6',
                                                        flexShrink: 0,
                                                        marginLeft: '8px',
                                                        marginTop: '4px'
                                                    }} />
                                                )}
                                            </div>
                                            <p style={{
                                                margin: '0 0 6px 0',
                                                fontSize: '13px',
                                                color: '#64748b',
                                                lineHeight: '1.4'
                                            }}>
                                                {notif.message}
                                            </p>
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                {getTimeAgo(notif.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div style={{
                            padding: '12px',
                            borderTop: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <Link
                                href="/notifications"
                                style={{
                                    color: '#3b82f6',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    textDecoration: 'none'
                                }}
                                onClick={() => setShowDropdown(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
