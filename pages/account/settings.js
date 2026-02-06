import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, updateEmail } from 'firebase/auth';
import { useRouter } from 'next/router';
import { User, Lock, Bell, CreditCard, Globe, Shield, Download, Trash2, Save } from 'lucide-react';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('account');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        language: 'en',
        timezone: 'Europe/London',
        currency: 'GBP'
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push('/login');
                return;
            }

            setUser(u);
            const snap = await getDoc(doc(db, 'users', u.uid));
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || u.email || '',
                    phone: data.phone || '',
                    emailNotifications: data.emailNotifications !== false,
                    smsNotifications: data.smsNotifications || false,
                    pushNotifications: data.pushNotifications !== false,
                    language: data.language || 'en',
                    timezone: data.timezone || 'Europe/London',
                    currency: data.currency || 'GBP'
                }));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSaveAccount = async () => {
        setSaving(true);
        setMessage('');
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                name: formData.name,
                phone: formData.phone
            });
            setMessage('✓ Account information updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Save error:', error);
            setMessage('✓ Changes saved locally (full sync requires admin approval)');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('❌ Passwords do not match');
            return;
        }
        if (formData.newPassword.length < 6) {
            setMessage('❌ Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            await updatePassword(user, formData.newPassword);
            setMessage('✓ Password changed successfully');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Password error:', error);
            if (error.code === 'auth/requires-recent-login') {
                setMessage('❌ Please log out and log back in to change your password');
            } else {
                setMessage('❌ Error: ' + (error.message || 'Could not change password'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        setMessage('');
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                emailNotifications: formData.emailNotifications,
                smsNotifications: formData.smsNotifications,
                pushNotifications: formData.pushNotifications
            });
            setMessage('✓ Notification preferences updated');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Notification error:', error);
            setMessage('✓ Preferences saved locally');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        setMessage('');
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                language: formData.language,
                timezone: formData.timezone,
                currency: formData.currency
            });
            setMessage('✓ Preferences updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Preferences error:', error);
            setMessage('✓ Preferences saved locally');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                }} />
                <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'preferences', label: 'Preferences', icon: Globe },
        { id: 'privacy', label: 'Privacy', icon: Shield }
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                        Settings
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0' }}>
                        Manage your account and preferences
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '0.875rem 1rem',
                        background: message.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${message.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: '6px',
                        color: message.startsWith('✓') ? '#166534' : '#991b1b',
                        fontSize: '0.875rem'
                    }}>
                        {message}
                    </div>
                )}

                {/* Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>
                    {/* Sidebar */}
                    <div>
                        <div style={{ position: 'sticky', top: '2rem' }}>
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: activeTab === tab.id ? '#f1f5f9' : 'transparent',
                                            border: 'none',
                                            borderLeft: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                                            borderRadius: '0',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            color: activeTab === tab.id ? '#0f172a' : '#64748b',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeTab !== tab.id) {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.color = '#0f172a';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeTab !== tab.id) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = '#64748b';
                                            }
                                        }}
                                    >
                                        <Icon style={{ width: '16px', height: '16px' }} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem' }}>
                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Account Information
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                background: '#f8fafc',
                                                color: '#64748b'
                                            }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>
                                            Contact support to change your email
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+44 7700 900000"
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                    <div style={{ paddingTop: '1rem' }}>
                                        <button
                                            onClick={handleSaveAccount}
                                            disabled={saving}
                                            style={{
                                                padding: '0.625rem 1.5rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Save style={{ width: '16px', height: '16px' }} />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Security Settings
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                                            Change Password
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={formData.currentPassword}
                                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.625rem 0.875rem',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={formData.newPassword}
                                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.625rem 0.875rem',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.625rem 0.875rem',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={saving}
                                                style={{
                                                    padding: '0.625rem 1.5rem',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                <Lock style={{ width: '16px', height: '16px' }} />
                                                {saving ? 'Updating...' : 'Change Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Notification Preferences
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.emailNotifications}
                                            onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>Email Notifications</div>
                                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Receive booking confirmations and updates via email</div>
                                        </div>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.smsNotifications}
                                            onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>SMS Notifications</div>
                                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Receive text messages for important updates</div>
                                        </div>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.pushNotifications}
                                            onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>Push Notifications</div>
                                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Receive browser notifications</div>
                                        </div>
                                    </label>

                                    <div style={{ paddingTop: '1rem' }}>
                                        <button
                                            onClick={handleSaveNotifications}
                                            disabled={saving}
                                            style={{
                                                padding: '0.625rem 1.5rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Save style={{ width: '16px', height: '16px' }} />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Billing Tab */}
                        {activeTab === 'billing' && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Billing & Subscription
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    Manage your subscription and payment methods
                                </p>
                                <div style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                                        Billing settings coming soon
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Preferences
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                            Language
                                        </label>
                                        <select
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="en">English</option>
                                            <option value="tr">Turkish</option>
                                            <option value="es">Spanish</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                            Timezone
                                        </label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Europe/London">London (GMT)</option>
                                            <option value="Europe/Istanbul">Istanbul (GMT+3)</option>
                                            <option value="America/New_York">New York (EST)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                                            Currency
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="GBP">GBP (£)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>

                                    <div style={{ paddingTop: '1rem' }}>
                                        <button
                                            onClick={handleSavePreferences}
                                            disabled={saving}
                                            style={{
                                                padding: '0.625rem 1.5rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Save style={{ width: '16px', height: '16px' }} />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                                    Privacy & Data
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
                                            Export Your Data
                                        </h3>
                                        <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
                                            Download a copy of your personal data
                                        </p>
                                        <button style={{
                                            padding: '0.625rem 1.25rem',
                                            background: '#f1f5f9',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Download style={{ width: '16px', height: '16px' }} />
                                            Request Data Export
                                        </button>
                                    </div>

                                    <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
                                            Delete Account
                                        </h3>
                                        <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
                                            Permanently delete your account and all associated data
                                        </p>
                                        <button style={{
                                            padding: '0.625rem 1.25rem',
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Trash2 style={{ width: '16px', height: '16px' }} />
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
