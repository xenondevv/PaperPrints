'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
  registerVendor,
  updateVendorPricing,
  updateBusinessHours,
} from '../../lib/api';

/* ── Step Indicator ────────────────────────────────────────────────────────── */

function StepIndicator({ current }) {
  const steps = ['Shop Info', 'Location', 'Pricing & Hours'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: 48, height: 2, background: isDone ? '#0D9488' : '#E5E7EB', transition: 'background 0.3s' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, transition: 'all 0.3s',
                background: isDone ? '#0D9488' : isActive ? '#0D9488' : '#F3F4F6',
                color: isDone || isActive ? '#FFFFFF' : '#9CA3AF',
                border: isActive ? '2px solid #0D9488' : isDone ? '2px solid #0D9488' : '2px solid #E5E7EB',
              }}>
                {isDone ? (
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                ) : stepNum}
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? '#0D9488' : '#9CA3AF' }}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Form Field ────────────────────────────────────────────────────────────── */

function Field({ label, value, onChange, type = 'text', placeholder, error, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#B91C1C', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: `1px solid ${error ? '#FECACA' : '#D1D5DB'}`,
          fontSize: 14, color: '#111111', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box',
          background: error ? '#FFF5F5' : '#FFFFFF',
        }}
        onFocus={e => e.target.style.borderColor = error ? '#F87171' : '#0D9488'}
        onBlur={e => e.target.style.borderColor = error ? '#FECACA' : '#D1D5DB'}
      />
      {error && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const { user, refreshAccessToken } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Step 1
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [shopEmail, setShopEmail] = useState('');

  // Step 2
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Step 3
  const [priceBw, setPriceBw] = useState('');
  const [priceColor, setPriceColor] = useState('');
  const [priceDoubleSided, setPriceDoubleSided] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');

  // Pre-fill owner name from Google account
  useEffect(() => {
    if (user?.name) setOwnerName(user.name);
    if (user?.email) setShopEmail(user.email);
  }, [user]);

  /* ── Validation ── */

  const validateStep1 = () => {
    const e = {};
    if (!shopName.trim()) e.shopName = 'Shop name is required';
    if (!ownerName.trim()) e.ownerName = 'Owner name is required';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) e.phone = 'Enter a valid phone number (at least 10 digits)';
    if (!shopEmail.trim()) e.shopEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail)) e.shopEmail = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!address.trim()) e.address = 'Address is required';
    if (lat == null || lng == null) e.location = 'Please use the location button to set your exact coordinates';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!priceBw || parseFloat(priceBw) < 0) e.priceBw = 'Enter a valid price (₹0 or more)';
    if (!priceColor || parseFloat(priceColor) < 0) e.priceColor = 'Enter a valid price (₹0 or more)';
    if (!priceDoubleSided || parseFloat(priceDoubleSided) < 0) e.priceDoubleSided = 'Enter a valid price (₹0 or more)';
    if (!openingTime) e.openingTime = 'Opening time is required';
    if (!closingTime) e.closingTime = 'Closing time is required';
    if (openingTime && closingTime && openingTime >= closingTime) e.closingTime = 'Closing time must be after opening time';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Navigation ── */

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const goPrev = () => {
    setErrors({});
    if (step > 1) setStep(step - 1);
  };

  /* ── Detect Location ── */

  const detectLocation = () => {
    if (!navigator.geolocation) { setErrors(e => ({ ...e, location: 'Geolocation is not supported by your browser' })); return; }
    setIsDetecting(true);
    setErrors(e => { const n = { ...e }; delete n.location; return n; });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data?.display_name) setAddress(data.display_name);
        } catch (err) { console.error('Reverse geocoding failed', err); }
        finally { setIsDetecting(false); }
      },
      () => {
        setErrors(e => ({ ...e, location: 'Unable to retrieve your location. Please allow location access.' }));
        setIsDetecting(false);
      }
    );
  };

  /* ── Submit ── */

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Register vendor profile (creates vendor + default settings + upgrades role)
      await registerVendor({
        ownerName,
        shopName,
        phone,
        address,
        email: shopEmail,
        lat: lat || 0,
        lng: lng || 0,
      });

      // 2. Update pricing with vendor's chosen values
      await updateVendorPricing({
        priceBw: parseFloat(priceBw) || 0,
        priceColor: parseFloat(priceColor) || 0,
        priceDoubleSided: parseFloat(priceDoubleSided) || 0,
      });

      // 3. Update business hours
      await updateBusinessHours(openingTime, closingTime);

      // 4. Refresh token to get updated role: 'vendor'
      const newToken = await refreshAccessToken();
      if (newToken) {
        router.push('/dashboard');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      const errMessage = err.response?.data?.message || '';
      if (errMessage === 'User is already registered as a vendor') {
        // User already has a vendor profile, just their local role is outdated.
        const newToken = await refreshAccessToken();
        if (newToken) {
          router.push('/dashboard');
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setSubmitError(errMessage || 'Registration failed. Please try again.');
        setSubmitting(false);
      }
    }
  };

  /* ── Render ── */

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
          <div style={{ background: '#FFFFFF', width: '100%', maxWidth: 520, borderRadius: 12, padding: '36px 32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111111', marginBottom: 6 }}>Set up your print shop</h1>
              <p style={{ fontSize: 14, color: '#6B7280' }}>
                Welcome, {user?.name?.split(' ')[0]}! Complete these steps to start receiving print orders.
              </p>
            </div>

            {/* Step Indicator */}
            <StepIndicator current={step} />

            {/* Global error */}
            {submitError && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#B91C1C', fontSize: 13, marginBottom: 20 }}>
                {submitError}
              </div>
            )}

            {/* ═══ STEP 1: Shop Info ═══ */}
            {step === 1 && (
              <>
                <Field label="Shop Name" value={shopName} onChange={setShopName} placeholder="QuickPrint Studio" error={errors.shopName} required />
                <Field label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="John Doe" error={errors.ownerName} required />
                <Field label="Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="+91 9999999999" error={errors.phone} required />
                <Field label="Shop Email" value={shopEmail} onChange={setShopEmail} type="email" placeholder="shop@example.com" error={errors.shopEmail} required />
              </>
            )}

            {/* ═══ STEP 2: Location ═══ */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={detectLocation}
                    disabled={isDetecting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                      color: isDetecting ? '#9CA3AF' : '#0D9488',
                      background: '#F0FDFA', border: `1px solid ${isDetecting ? '#E5E7EB' : '#CCFBF1'}`,
                      cursor: isDetecting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => !isDetecting && (e.currentTarget.style.background = '#CCFBF1')}
                    onMouseLeave={e => !isDetecting && (e.currentTarget.style.background = '#F0FDFA')}
                  >
                    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {isDetecting ? 'Detecting Location...' : 'Use My Current Location'}
                  </button>
                </div>

                <Field label="Full Shop Address" value={address} onChange={setAddress} placeholder="123 Printing Lane, District Center..." error={errors.address} required />

                {lat != null && lng != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, marginBottom: 16 }}>
                    <svg style={{ width: 16, height: 16, color: '#16A34A', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span style={{ fontSize: 13, color: '#166534' }}>
                      Location set: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                    </span>
                  </div>
                )}

                {errors.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 16 }}>
                    <svg style={{ width: 16, height: 16, color: '#B91C1C', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                    <span style={{ fontSize: 12, color: '#B91C1C' }}>{errors.location}</span>
                  </div>
                )}
              </>
            )}

            {/* ═══ STEP 3: Pricing & Hours ═══ */}
            {step === 3 && (
              <>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Field label="B&W per page (₹)" value={priceBw} onChange={setPriceBw} type="number" placeholder="2.00" error={errors.priceBw} required />
                  <Field label="Color per page (₹)" value={priceColor} onChange={setPriceColor} type="number" placeholder="10.00" error={errors.priceColor} required />
                </div>
                <Field label="Double-sided extra (₹)" value={priceDoubleSided} onChange={setPriceDoubleSided} type="number" placeholder="1.00" error={errors.priceDoubleSided} required />

                <div style={{ height: 1, background: '#E5E7EB', margin: '8px 0 20px' }} />

                <div style={{ display: 'flex', gap: 12 }}>
                  <Field label="Opening Time" value={openingTime} onChange={setOpeningTime} type="time" error={errors.openingTime} required />
                  <Field label="Closing Time" value={closingTime} onChange={setClosingTime} type="time" error={errors.closingTime} required />
                </div>
              </>
            )}

            {/* ── Navigation Buttons ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              {step > 1 ? (
                <button onClick={goPrev}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                    color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  Previous
                </button>
              ) : <div />}

              {step < 3 ? (
                <button onClick={goNext}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    color: '#FFFFFF', background: '#0D9488', border: 'none', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0F766E'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0D9488'}
                >
                  Next
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    color: '#FFFFFF', background: '#0D9488', border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#0F766E'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0D9488'; }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      Registering...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: '#9CA3AF' }}>
          © 2026 PaperPrints
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
