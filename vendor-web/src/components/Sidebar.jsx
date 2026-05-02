'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const navItems = [
  {
    label: 'All Orders',
    href: '/dashboard',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    label: 'Pending Orders',
    href: '/dashboard?filter=pending',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    label: 'Accepted Orders',
    href: '/dashboard?filter=accepted',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: 'Completed Orders',
    href: '/dashboard?filter=completed',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,

  },
  {
    label: 'Order History',
    href: '/dashboard?filter=history',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: 'Rejected Orders',
    href: '/dashboard?filter=rejected',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

export default function Sidebar({ user, onSignOut }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter');
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <aside style={{ width: 220, background: '#F9FAFB', borderRight: '1px solid #E5E7EB' }}
        className="fixed left-0 top-0 bottom-0 flex flex-col z-40">
        {/* Vendor info */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ marginBottom: 16 }}>
            <img src="/favicon.png" alt="PaperPrint Logo" style={{ height: 56, width: 'auto' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>{user?.name || 'Vendor'}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Vendor dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: 8 }}>
          {navItems.map((item) => {
            const itemFilter = item.href.includes('?filter=') ? item.href.split('?filter=')[1] : null;
            const isActive = itemFilter
              ? currentFilter === itemFilter
              : item.href === '/settings'
                ? pathname === '/settings'
                : (item.href === '/dashboard' && pathname === '/dashboard' && !currentFilter);
            return (
              <Link key={item.label} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 36, padding: '0 10px', borderRadius: 6,
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#166534' : '#6B7280',
                  background: isActive ? '#DCFCE7' : 'transparent',
                  textDecoration: 'none', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? '#DCFCE7' : 'transparent'; }}
              >
                <span style={{ opacity: isActive ? 1 : 0.5, display: 'flex', color: isActive ? '#16A34A' : '#9CA3AF' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out trigger */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid #E5E7EB' }}>
          {onSignOut && (
            <button onClick={() => setShowLogout(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 10px',
                fontSize: 12, fontWeight: 500, color: '#B91C1C', background: 'none', border: 'none',
                borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              SIGN OUT
            </button>
          )}
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogout && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setShowLogout(false)} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 360,
            background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB',
            padding: 28, margin: '0 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg style={{ width: 18, height: 18, color: '#B91C1C' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#111111' }}>Sign out?</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>You'll need to sign in again to access the dashboard.</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button onClick={() => setShowLogout(false)}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button onClick={() => { setShowLogout(false); onSignOut(); }}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  color: '#FFFFFF', background: '#B91C1C', border: 'none', cursor: 'pointer',
                }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
