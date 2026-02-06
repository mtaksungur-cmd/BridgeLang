import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function UserDropdown({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    // Get user role from Firestore
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            const fetchRole = async () => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    }
                } catch (err) {
                    console.error('Error fetching user role:', err);
                }
            };
            fetchRole();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    if (!user) return null;

    const displayName = user.name || user.email?.split('@')[0] || 'User';
    const displayEmail = user.email;

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.5rem 0.75rem',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
                {/* Avatar */}
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#4f46e5',
                    overflow: 'hidden',
                    flexShrink: '0'
                }}>
                    {user.profilePhotoUrl ? (
                        <img
                            src={user.profilePhotoUrl}
                            alt={displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        displayName.charAt(0).toUpperCase()
                    )}
                </div>

                {/* Name (desktop only) */}
                <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#0f172a',
                    display: 'none'
                }}
                    className="user-dropdown-name"
                >
                    {displayName}
                </span>

                {/* Chevron */}
                <ChevronDown style={{
                    width: '16px',
                    height: '16px',
                    color: '#94a3b8',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                }} />

                <style jsx>{`
          @media (min-width: 640px) {
            .user-dropdown-name {
              display: block !important;
            }
          }
        `}</style>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: '0',
                    width: '240px',
                    background: 'white',
                    border: '1px solid  #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: '1000',
                    overflow: 'hidden'
                }}>
                    {/* User Info */}
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #f1f5f9'
                    }}>
                        <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                            {displayName}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayEmail}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '0.5rem' }}>
                        {/* Profile - Teachers only */}
                        {userRole === 'teacher' && (
                            <Link href="/account/profile">
                                <div
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        textDecoration: 'none'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <User style={{ width: '16px', height: '16px', color: '#64748b' }} />
                                    <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: '500' }}>Profile</span>
                                </div>
                            </Link>
                        )}

                        <Link href="/account/settings">
                            <div
                                onClick={() => setIsOpen(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.625rem 0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <Settings style={{ width: '16px', height: '16px', color: '#64748b' }} />
                                <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: '500' }}>Settings</span>
                            </div>
                        </Link>
                    </div>

                    {/* Sign Out */}
                    <div style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <button
                            onClick={handleSignOut}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.625rem 0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <LogOut style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                            <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: '500' }}>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
