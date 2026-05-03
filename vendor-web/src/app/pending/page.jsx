'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function PendingPage() {
  const { user, vendor, isVerified, signOut, refreshAccessToken } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStatusMessage('');
    
    // Refresh the token which will also fetch the latest user/vendor data
    const newAt = await refreshAccessToken();
    
    if (newAt) {
      // Re-evaluate context or read from localStorage if needed
      // Actually, refreshAccessToken updates the AuthContext state
      // ProtectedRoute will catch the change to isVerified and redirect to /dashboard
      
      // Let's manually check local storage to give immediate feedback
      const storedUser = localStorage.getItem('pp_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.vendor?.is_verified) {
            router.replace('/dashboard');
            return;
          }
        } catch {}
      }
      
      setStatusMessage("Still under review, we'll notify you via email.");
    } else {
      setStatusMessage('Error checking status. Please try again later.');
    }
    
    setIsRefreshing(false);
  };

  return (
    <ProtectedRoute>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '40px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '32px', letterSpacing: '-0.5px' }}>
            PaperPrints
          </h1>

          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#DCFCE7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg style={{ width: '32px', height: '32px', color: '#16A34A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
            Application Submitted!
          </h2>

          <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '1.6', marginBottom: '16px' }}>
            Thank you for registering <strong>{vendor?.shop_name || 'your shop'}</strong> on PaperPrints.
          </p>
          <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '1.6', marginBottom: '32px' }}>
            Our team is reviewing your application and will contact you shortly on <strong>{user?.email}</strong>.
            <br/><br/>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>This usually takes 1-2 business days.</span>
          </p>

          <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #E5E7EB', marginBottom: '24px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '14px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Already approved?
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0D9488',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={e => { if(!isRefreshing) e.currentTarget.style.backgroundColor = '#F0FDFA' }}
                onMouseLeave={e => { if(!isRefreshing) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {isRefreshing ? (
                  <div style={{ width: 14, height: 14, border: '2px solid #0D9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh Status
              </button>
            </div>
            {statusMessage && (
              <p style={{ fontSize: '13px', color: '#0D9488', marginTop: '4px', animation: 'fadeIn 0.3s ease-in-out' }}>
                {statusMessage}
              </p>
            )}
            <style jsx>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </div>

          <button
            onClick={() => {
              signOut();
              router.push('/login');
            }}
            style={{
              marginTop: '40px',
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign Out
          </button>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
