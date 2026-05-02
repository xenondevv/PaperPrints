'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Sidebar from '../../components/Sidebar';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  const vendorInfo = [
    { label: 'Name', value: user?.name || user?.shopName || '—' },
    { label: 'Shop Name', value: user?.shopName || user?.name || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Phone', value: user?.phone || '—' },
    { label: 'Address', value: user?.address || '—' },
    { label: 'Role', value: (user?.role || 'vendor').toUpperCase() },
  ];

  const developers = [
    { name: 'Anuj Pal', phone: '+91 98765 43210', role: 'Lead Developer' },
    { name: 'PaperPrints Support', phone: '+91 91234 56789', role: 'Technical Support' },
  ];

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF' }}>
        <Sidebar user={user} onSignOut={signOut} />

        <main style={{ flex: 1, marginLeft: 220 }}>
          {/* Header */}
          <div style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: '#111111' }}>Settings</h1>
          </div>

          <div style={{ padding: '24px', maxWidth: 640 }}>

            {/* Account Details */}
            <SectionCard title="Account Details" icon={
              <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }>
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#F0FDFA', border: '2px solid #0D9488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 600, color: '#0D9488',
                  overflow: 'hidden',
                }}>
                  {user?.photoUrl
                    ? <img src={user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (user?.name || 'V').charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#111111' }}>{user?.name || 'Vendor'}</p>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>{user?.email || ''}</p>
                </div>
              </div>

              {/* Info rows */}
              {vendorInfo.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < vendorInfo.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{item.label}</span>
                  <span style={{
                    fontSize: 13, color: item.value === '—' ? '#D1D5DB' : '#111111',
                    fontWeight: 400, textAlign: 'right', maxWidth: '60%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.value}</span>
                </div>
              ))}
            </SectionCard>

            {/* Help & Support */}
            <SectionCard title="Help & Support" icon={
              <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                Need assistance? Reach out to our development team directly.
              </p>

              {developers.map((dev, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 8,
                  background: '#F9FAFB', border: '1px solid #E5E7EB',
                  marginBottom: i < developers.length - 1 ? 8 : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg style={{ width: 16, height: 16, color: '#0D9488' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#111111' }}>{dev.name}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{dev.role}</p>
                    </div>
                  </div>
                  <a href={`tel:${dev.phone.replace(/\s/g, '')}`}
                    style={{
                      fontSize: 13, fontWeight: 500, color: '#0D9488',
                      textDecoration: 'none', padding: '6px 12px', borderRadius: 6,
                      border: '1px solid #99F6E4', background: '#F0FDFA',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#CCFBF1'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F0FDFA'}
                  >
                    {dev.phone}
                  </a>
                </div>
              ))}

              {/* Email support */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: 16, padding: '10px 14px', borderRadius: 8,
                background: '#FAFAFA', border: '1px solid #E5E7EB',
              }}>
                <svg style={{ width: 14, height: 14, color: '#6B7280' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Email: </span>
                <a href="mailto:paperprintsofficial@gmail.com" style={{ fontSize: 13, color: '#0D9488', fontWeight: 500, textDecoration: 'none' }}>
                  paperprintsofficial@gmail.com
                </a>
              </div>
            </SectionCard>

            {/* App Info */}
            <div style={{
              textAlign: 'center', padding: '20px 0', marginTop: 8,
              fontSize: 11, color: '#D1D5DB',
            }}>
              PaperPrints Vendor Dashboard v1.0.0
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ── Section Card ──────────────────────────────────────────────────────────── */

function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 10,
      padding: '20px 20px 16px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: '#0D9488', display: 'flex' }}>{icon}</span>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
