'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { registerVendor } from '../../lib/api';

export default function OnboardingPage() {
  const { user, refreshAccessToken } = useAuth();
  const router = useRouter();
  
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setOwnerName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerName || !shopName || !phone || !address) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerVendor({
        ownerName,
        shopName,
        phone,
        address,
        email: user?.email,
      });

      // Role is updated in the DB, so we must fetch a new token to get the 'vendor' role
      const newToken = await refreshAccessToken();
      if (newToken) {
        router.push('/dashboard');
      } else {
        // Fallback: force hard reload if token rotation fails
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register vendor profile.');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
        
        {/* Header */}
        <header style={{ background: '#FFFFFF', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/favicon.png" alt="Logo" width={32} height={32} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#0F766E' }}>PaperPrints Partner</span>
        </header>

        {/* Content */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#FFFFFF', width: '100%', maxWidth: 480, borderRadius: 12, padding: 32, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111111', marginBottom: 8 }}>Set up your print shop</h1>
              <p style={{ fontSize: 14, color: '#6B7280' }}>Welcome aboard, {user?.name?.split(' ')[0]}! Complete your shop profile to start receiving print orders.</p>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#B91C1C', fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Owner Name</label>
                <input
                  type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#0D9488'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Shop Name</label>
                <input
                  type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
                  placeholder="QuickPrint Studio"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#0D9488'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Contact Phone Number</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9999999999"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#0D9488'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full Shop Address</label>
                <textarea
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Printing Lane, District Center..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box', resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#0D9488'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px', background: '#0D9488', color: '#FFFFFF',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#0F766E'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#0D9488'; }}
              >
                {loading ? 'Registering Shop...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
