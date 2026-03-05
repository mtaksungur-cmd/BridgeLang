// pages/reset-password.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPassword() {
    const router = useRouter();
    const { token, uid } = router.query;

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!token || !uid) {
            toast.error('Invalid reset link');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    uid,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            toast.success('Password reset successful! Redirecting to login...');

            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error) {
            console.error('Reset error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toaster position="top-center" />
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    maxWidth: '440px',
                    width: '100%',
                    padding: '40px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '32px'
                        }}>
                            🔑
                        </div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            margin: '0 0 8px 0',
                            color: '#1a202c'
                        }}>
                            Reset your password
                        </h1>
                        <p style={{
                            fontSize: '15px',
                            color: '#718096',
                            margin: 0
                        }}>
                            for <strong>{router.query.email || 'your account'}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2d3748',
                                marginBottom: '8px'
                            }}>
                                New password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 12px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        transition: 'border-color 0.2s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '20px'
                                    }}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <p style={{
                                fontSize: '12px',
                                color: '#718096',
                                marginTop: '6px',
                                marginBottom: 0
                            }}>
                                Minimum 6 characters
                            </p>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2d3748',
                                marginBottom: '8px'
                            }}>
                                Confirm password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    transition: 'border-color 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'transform 0.1s',
                                marginBottom: '16px'
                            }}
                            onMouseDown={(e) => !loading && (e.target.style.transform = 'scale(0.98)')}
                            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            {loading ? '⏳ Resetting...' : '✅ Reset Password'}
                        </button>

                        <div style={{
                            textAlign: 'center',
                            paddingTop: '16px',
                            borderTop: '1px solid #e2e8f0'
                        }}>
                            <Link href="/login" style={{
                                color: '#667eea',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                ← Back to login
                            </Link>
                        </div>
                    </form>

                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        background: '#edf2f7',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#4a5568'
                    }}>
                        <p style={{ margin: 0 }}>
                            <strong>💡 Security tip:</strong> Choose a strong password with letters, numbers, and symbols.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
