import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { MapPin, Star, Briefcase, Globe, Award, Video, Car, Search, Filter, X, Users } from 'lucide-react';
import { formatTimeAgo } from '../../lib/formatTimeAgo';
import SeoHead from '../../components/SeoHead';

export default function Teachers() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Calculate active (online) teachers
  const activeTeachersCount = useMemo(() => {
    return allTeachers.filter(t => t.isOnline === true).length;
  }, [allTeachers]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // Check auth
        const user = auth.currentUser;
        console.log('Current user:', user ? user.uid : 'NOT LOGGED IN');

        // Fetch all teachers first
        const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const snap = await getDocs(q);
        const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('Total teachers fetched:', allDocs.length);

        // Filter for approved/verified teachers
        const teachers = allDocs.filter(t => t.status === 'approved' || t.verified === true);
        console.log('Approved/verified teachers:', teachers.length, teachers);
        setAllTeachers(teachers);
      } catch (error) {
        console.error('❌ ERROR fetching teachers:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filtered = useMemo(() => {
    return allTeachers.filter(t => {
      if (country && t.country !== country) return false;
      if (city && t.city !== city) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const nameMatch = t.name?.toLowerCase().includes(search);
        const bioMatch = t.bio?.toLowerCase().includes(search);
        const specsMatch = t.teachingSpecializations?.toLowerCase().includes(search);
        if (!nameMatch && !bioMatch && !specsMatch) return false;
      }
      return true;
    });
  }, [allTeachers, country, city, searchTerm]);

  const uniqueCountries = useMemo(() => [...new Set(allTeachers.map(t => t.country).filter(Boolean))], [allTeachers]);
  const uniqueCities = useMemo(() => [...new Set(allTeachers.filter(t => !country || t.country === country).map(t => t.city).filter(Boolean))], [allTeachers, country]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title="Find Your Teacher"
        description="Browse qualified teachers and book personalized lessons on BridgeLang."
      />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }} className="animate-fade-in">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Find Your Teacher</h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748b' }}>Browse {filtered.length} qualified teachers</p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by name, specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem' }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                    <X style={{ width: '16px', height: '16px', color: '#64748b' }} />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{ padding: '0.75rem 1.25rem', background: showFilters ? '#f1f5f9' : 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: '500', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Filter style={{ width: '18px', height: '18px' }} />
                Filters
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Country</label>
                  <select value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); }} style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <option value="">All Countries</option>
                    {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>City</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!country} style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', cursor: country ? 'pointer' : 'not-allowed', background: country ? 'white' : '#f8fafc' }}>
                    <option value="">All Cities</option>
                    {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {(country || city) && (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={() => { setCountry(''); setCity(''); }} style={{ padding: '0.625rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', cursor: 'pointer' }}>
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Users Banner */}
          {activeTeachersCount > 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <div className="active-users-banner">
                <Users style={{ width: '16px', height: '16px' }} />
                <span>
                  <strong>{activeTeachersCount}</strong> teachers currently active
                </span>
              </div>
            </div>
          )}

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>No teachers found</p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem'
            }}>
              {filtered.map(teacher => (
                <div
                  key={teacher.id}
                  className="card-hover"
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header with Photo & Basic Info */}
                  <div style={{ padding: '1.5rem', paddingBottom: '1rem', flex: '0 0 auto' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      {/* Avatar with gradient glow */}
                      <div className="avatar-glow" style={{ width: '64px', height: '64px', flexShrink: 0 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: teacher.profilePhotoUrl ? `url(${teacher.profilePhotoUrl}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', marginBottom: '0.375rem' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{teacher.name}</h3>
                          {/* Online/Offline Status */}
                          {teacher.isOnline ? (
                            <span className="status-badge status-online">
                              <span className="status-dot"></span>
                              Online
                            </span>
                          ) : teacher.lastSeen && (
                            <span className="status-badge status-offline">
                              {formatTimeAgo(teacher.lastSeen)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
                          <MapPin style={{ width: '14px', height: '14px' }} />
                          {teacher.city}, {teacher.country}
                        </div>

                        {/* Intro Lesson Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.375rem' }}>
                          <Award style={{ width: '12px', height: '12px' }} />
                          15-min intro available (£4.99)
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', background: '#f0fdf4', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', color: '#166534' }}>
                          £{teacher.pricing30 || 15}/30min
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    {teacher.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star style={{ width: '16px', height: '16px', fill: '#fbbf24', color: '#fbbf24' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>{teacher.rating.toFixed(1)}</span>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>({teacher.totalReviews || 0} reviews)</span>
                      </div>
                    )}
                  </div>

                  {/* Details Grid - flexible height */}
                  <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem', color: '#475569', flex: '1 1 auto' }}>
                    {teacher.experienceYears && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Briefcase style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
                        <span>{teacher.experienceYears} years experience</span>
                      </div>
                    )}

                    {teacher.languagesSpoken && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Globe style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.languagesSpoken}</span>
                      </div>
                    )}

                    {teacher.teachingSpecializations && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <Award style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Specializations</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '1.5rem' }}>
                          {teacher.teachingSpecializations.split(',').slice(0, 3).map((spec, idx) => {
                            const badgeColors = ['badge-purple', 'badge-blue', 'badge-green', 'badge-orange', 'badge-pink'];
                            const colorClass = badgeColors[idx % badgeColors.length];
                            return (
                              <span
                                key={idx}
                                className={`badge-vibrant ${colorClass}`}
                              >
                                {spec.trim()}
                              </span>
                            );
                          })}
                          {teacher.teachingSpecializations.split(',').length > 3 && (
                            <span style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                              +{teacher.teachingSpecializations.split(',').length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {teacher.deliveryMethod && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Video style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
                        <span>{teacher.deliveryMethod}</span>
                      </div>
                    )}

                    {teacher.willingToTravel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Car style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
                        <span>Willing to travel</span>
                      </div>
                    )}
                  </div>

                  {/* CTA - always at bottom */}
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc', marginTop: 'auto' }}>
                    <button
                      onClick={() => router.push(`/student/teacher/${teacher.id}`)}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        borderRadius: '8px'
                      }}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
