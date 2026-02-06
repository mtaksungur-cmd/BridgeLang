import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

export default function AuthSettings() {
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/auth');
            const data = await res.json();
            setOtpEnabled(data.otpEnabled || false);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otpEnabled: !otpEnabled }),
            });

            if (!res.ok) throw new Error();

            setOtpEnabled(!otpEnabled);
            toast.success(`OTP ${!otpEnabled ? 'enabled' : 'disabled'} successfully`);
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>
                    Authentication Settings
                </h1>
                <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>
                    Configure login security options
                </p>

                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '6px', color: '#111827' }}>
                                Email OTP Verification
                            </h2>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                {otpEnabled
                                    ? 'Users must enter a 6-digit code sent to their email after password login'
                                    : 'Users can login with email and password only (no verification code required)'}
                            </p>
                        </div>

                        <button
                            onClick={handleToggle}
                            disabled={saving}
                            style={{
                                position: 'relative',
                                width: '60px',
                                height: '32px',
                                background: otpEnabled ? '#10b981' : '#d1d5db',
                                borderRadius: '16px',
                                border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                marginLeft: '24px'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: otpEnabled ? '32px' : '4px',
                                width: '24px',
                                height: '24px',
                                background: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                        </button>
                    </div>

                    <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                            <strong style={{ color: '#374151' }}>Current Status:</strong> {otpEnabled ? 'Enabled' : 'Disabled'}
                            <br />
                            <strong style={{ color: '#374151' }}>Security Level:</strong> {otpEnabled ? 'High' : 'Standard'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
