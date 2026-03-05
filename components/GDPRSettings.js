// components/GDPRSettings.js
import { useState } from 'react';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GDPRSettings({ userId }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExportData = async () => {
        try {
            setLoading(true);

            // Trigger download
            window.location.href = `/api/user/export-data?userId=${userId}`;

            toast.success('Data export started! Download will begin shortly.');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch('/api/user/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, confirmDelete: true })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }

            toast.success('Account deleted successfully. Redirecting...');

            // Sign out and redirect
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #e2e8f0',
            maxWidth: '600px'
        }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Privacy & Data
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                Manage your personal data and privacy settings
            </p>

            {/* Export Data */}
            <div style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Download style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        Export Your Data
                    </h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Download a copy of all your data including bookings, messages, and transactions (GDPR Article 15).
                </p>
                <button
                    onClick={handleExportData}
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Download style={{ width: '16px', height: '16px' }} />
                    {loading ? 'Preparing Export...' : 'Export My Data'}
                </button>
            </div>

            {/* Delete Account */}
            <div style={{
                padding: '1.5rem',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Trash2 style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#dc2626' }}>
                        Delete Account
                    </h3>
                </div>
                <p style={{ color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Permanently delete your account and anonymize your data (GDPR Article 17).
                    This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <AlertTriangle style={{ width: '16px', height: '16px' }} />
                        Delete My Account
                    </button>
                ) : (
                    <div>
                        <div style={{
                            padding: '1rem',
                            background: 'white',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            border: '1px solid #fecaca'
                        }}>
                            <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#dc2626' }}>
                                ⚠️ This will:
                            </p>
                            <ul style={{ marginLeft: '1.5rem', color: '#991b1b', fontSize: '0.875rem' }}>
                                <li>Anonymize your profile data</li>
                                <li>Delete your Firebase authentication</li>
                                <li>Anonymize your booking history</li>
                                <li>Keep transaction records (legal requirement)</li>
                            </ul>
                            <p style={{ fontWeight: '600', marginTop: '1rem', color: '#991b1b' }}>
                                Note: You cannot delete your account if you have active bookings.
                            </p>
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                            Type <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>DELETE</code> to confirm:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #fecaca',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                marginBottom: '1rem'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading || confirmText !== 'DELETE'}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: confirmText === 'DELETE' ? '#dc2626' : '#cbd5e1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: (loading || confirmText !== 'DELETE') ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setConfirmText('');
                                }}
                                disabled={loading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'white',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
