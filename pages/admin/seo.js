'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import SeoHead from '../../components/SeoHead';
import AdminBar from '../../components/AdminBar';

const DEFAULT_PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/student/teachers', label: 'Browse Tutors' },
  { path: '/student/subscription', label: 'Pricing & Plans' },
  { path: '/how-it-works', label: 'How It Works' },
  { path: '/about', label: 'About Us' },
];

export default function AdminSeo() {
  const [seoData, setSeoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState('/');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSeoData();
  }, []);

  const loadSeoData = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'seo'));
      if (snap.exists()) {
        setSeoData(snap.data().pages || {});
      } else {
        // Load defaults from seo-config.json
        try {
          const res = await fetch('/api/admin/seo-config');
          if (res.ok) {
            const defaults = await res.json();
            setSeoData(defaults);
          }
        } catch {
          // Use empty defaults
        }
      }
    } catch (err) {
      console.error('Load SEO error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      [activePage]: {
        ...prev[activePage],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'seo'), { pages: seoData, updatedAt: new Date() }, { merge: true });
      setMessage('✅ SEO settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Save SEO error:', err);
      setMessage('❌ Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const current = seoData[activePage] || {};

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <SeoHead title="SEO Management" description="Manage SEO settings for all pages" />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <AdminBar />
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              SEO Management
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
              Edit page titles, meta descriptions, and headings
            </p>
          </header>

          {message && (
            <div style={{
              marginBottom: '1.5rem', padding: '0.875rem 1rem',
              background: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${message.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '6px', fontSize: '0.875rem',
              color: message.startsWith('✅') ? '#166534' : '#991b1b'
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>
            {/* Page Selector */}
            <div>
              <div style={{ position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Pages</h3>
                {DEFAULT_PAGES.map(page => (
                  <button
                    key={page.path}
                    onClick={() => setActivePage(page.path)}
                    style={{
                      width: '100%', display: 'block', padding: '0.75rem 1rem', textAlign: 'left',
                      background: activePage === page.path ? '#f1f5f9' : 'transparent',
                      border: 'none', borderLeft: activePage === page.path ? '2px solid #3b82f6' : '2px solid transparent',
                      fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
                      color: activePage === page.path ? '#0f172a' : '#64748b'
                    }}
                  >
                    <div>{page.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{page.path}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>
                {DEFAULT_PAGES.find(p => p.path === activePage)?.label || activePage}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={current.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Page title for browser tab and search results"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    {(current.title || '').length}/60 characters (recommended)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    Meta Description
                  </label>
                  <textarea
                    value={current.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description for search engine results"
                    rows={3}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    {(current.description || '').length}/160 characters (recommended)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    H1 Heading
                  </label>
                  <input
                    type="text"
                    value={current.h1 || ''}
                    onChange={(e) => handleChange('h1', e.target.value)}
                    placeholder="Main heading on the page"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={current.keywords || ''}
                    onChange={(e) => handleChange('keywords', e.target.value)}
                    placeholder="Comma-separated keywords"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                    OG Image URL
                  </label>
                  <input
                    type="text"
                    value={current.ogImage || ''}
                    onChange={(e) => handleChange('ogImage', e.target.value)}
                    placeholder="/images/og-image.png"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Preview */}
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    Google Preview
                  </h4>
                  <div style={{ fontFamily: 'Arial, sans-serif' }}>
                    <div style={{ fontSize: '1.125rem', color: '#1a0dab', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {current.title || 'Page Title | BridgeLang'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#006621', marginBottom: '0.25rem' }}>
                      https://bridgelang.co.uk{activePage}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#545454', lineHeight: '1.4' }}>
                      {current.description || 'Meta description will appear here...'}
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '1rem' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '0.75rem 2rem', background: saving ? '#94a3b8' : '#3b82f6',
                      color: 'white', border: 'none', borderRadius: '6px',
                      fontSize: '0.9375rem', fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save SEO Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
