'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, vendor, isVerified, loading } = useAuth();
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const hasVendorProfile = user.role === 'vendor' || vendor != null;

    if (!hasVendorProfile && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else if (hasVendorProfile && !isVerified && pathname !== '/pending') {
      router.replace('/pending');
    } else if (hasVendorProfile && isVerified && (pathname === '/onboarding' || pathname === '/pending')) {
      router.replace('/dashboard');
    }
  }, [user, vendor, isVerified, loading, router, pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 24, border: '2px solid #E5E7EB', borderTopColor: '#0D9488', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Loading…</p>
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return children;
}
