'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Sidebar from '../../components/Sidebar';
import {
  fetchVendorProfile,
  toggleShopStatus,
  updateBusinessHours,
  updateVendorLocation,
  updateVendorEmail,
  updateBankDetails,
  updateVendorPricing,
} from '../../lib/api';

/* ── Reusable UI Components ────────────────────────────────────────────────── */

function SectionCard({ title, children }) {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
      {title && (
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', placeholder, disabled = false }) {
  return (
    <div style={{ marginBottom: 16, flex: 1 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#4B5563', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
          fontSize: 14, color: disabled ? '#9CA3AF' : '#111111', background: disabled ? '#F9FAFB' : '#FFFFFF',
          outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
        }}
        onFocus={e => !disabled && (e.target.style.borderColor = '#0D9488')}
        onBlur={e => !disabled && (e.target.style.borderColor = '#E5E7EB')}
      />
    </div>
  );
}

function SaveButton({ onSave, status }) {
  const isSuccess = status === 'success';
  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: 16 }}>
      <button
        onClick={onSave}
        disabled={isLoading || isSuccess}
        style={{
          padding: '8px 24px', borderRadius: 6, fontSize: 13, fontWeight: 500,
          color: isSuccess ? '#16A34A' : '#FFFFFF',
          background: isSuccess ? '#DCFCE7' : '#0D9488',
          border: isSuccess ? '1px solid #16A34A' : '1px solid #0D9488',
          cursor: (isLoading || isSuccess) ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s'
        }}>
        {isLoading ? 'Saving...' : isSuccess ? 'Saved!' : 'Save'}
      </button>
      {isError && <span style={{ fontSize: 12, color: '#B91C1C', marginTop: 8 }}>Failed to save. Please try again.</span>}
    </div>
  );
}

/* ── Profile Info Row (read-only) ──────────────────────────────────────────── */

function InfoRow({ label, value, isLast }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: value && value !== '—' ? '#111111' : '#D1D5DB', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '—'}
      </span>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('overview'); // 'overview' or 'edit'

  // Shop Status
  const [isActive, setIsActive] = useState(false);

  // Pricing
  const [priceBw, setPriceBw] = useState('');
  const [priceColor, setPriceColor] = useState('');
  const [priceDoubleSided, setPriceDoubleSided] = useState('');
  const [pricingSaveStatus, setPricingSaveStatus] = useState('idle');

  // Hours
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [hoursSaveStatus, setHoursSaveStatus] = useState('idle');

  // Location
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);
  const [locationSaveStatus, setLocationSaveStatus] = useState('idle');

  // Email
  const [email, setEmail] = useState('');
  const [emailSaveStatus, setEmailSaveStatus] = useState('idle');

  // Bank Details
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankSaveStatus, setBankSaveStatus] = useState('idle');

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchVendorProfile();
      setProfile(p);
      setIsActive(p.isActive || false);

      setPriceBw(String(p.settings?.priceBw ?? ''));
      setPriceColor(String(p.settings?.priceColor ?? ''));
      setPriceDoubleSided(String(p.settings?.priceDoubleSided ?? ''));

      setOpeningTime(p.settings?.openingTime || '');
      setClosingTime(p.settings?.closingTime || '');

      setAddress(p.address || '');
      setLat(p.lat || null);
      setLng(p.lng || null);

      setEmail(p.email || '');

      setAccountName(p.bankDetails?.accountName || '');
      setAccountNumber(p.bankDetails?.accountNumber || '');
      setIfsc(p.bankDetails?.ifsc || '');
      setBankName(p.bankDetails?.bankName || '');
      setUpiId(p.bankDetails?.upiId || '');

    } catch (error) {
      console.error('Could not load profile', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Handlers
  const handleToggleStatus = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    try {
      await toggleShopStatus(newStatus);
    } catch {
      setIsActive(!newStatus);
      alert("Failed to update shop status");
    }
  };

  const wrapSave = async (apiCall, setStatus) => {
    setStatus('loading');
    try {
      await apiCall();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  };

  const handleSavePricing = () => wrapSave(
    () => updateVendorPricing({ priceBw: parseFloat(priceBw) || 0, priceColor: parseFloat(priceColor) || 0, priceDoubleSided: parseFloat(priceDoubleSided) || 0 }),
    setPricingSaveStatus
  );

  const handleSaveHours = () => wrapSave(
    () => updateBusinessHours(openingTime, closingTime),
    setHoursSaveStatus
  );

  const handleSaveLocation = () => wrapSave(
    () => updateVendorLocation(lat || 0, lng || 0, address),
    setLocationSaveStatus
  );

  const handleSaveEmail = () => wrapSave(
    () => updateVendorEmail(email),
    setEmailSaveStatus
  );

  const handleSaveBank = () => wrapSave(
    () => updateBankDetails({ accountName, accountNumber, ifsc, bankName, upiId }),
    setBankSaveStatus
  );

  const detectLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation is not supported by your browser"); return; }
    setIsDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.display_name) { setAddress(data.display_name); }
        } catch (err) { console.error("Reverse geocoding failed", err); }
        finally { setIsDetectingLoc(false); }
      },
      () => { alert("Unable to retrieve your location"); setIsDetectingLoc(false); }
    );
  };

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF' }}>
        <Sidebar user={user} onSignOut={signOut} />

        <main style={{ flex: 1, marginLeft: 220 }}>
          {/* Header */}
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, background: '#FFF', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111111' }}>
                {view === 'overview' ? 'Settings' : 'Edit Shop Details'}
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                {view === 'overview' ? 'Manage your print shop profile and availability.' : 'Update your pricing, hours, location, and bank details.'}
              </p>
            </div>
            {view === 'edit' && (
              <button
                onClick={() => { setView('overview'); loadProfile(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                Back
              </button>
            )}
          </div>

          <div style={{ padding: '32px 24px', maxWidth: 720 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading your settings...</div>
            ) : view === 'overview' ? (
              /* ═══════════════ OVERVIEW VIEW ═══════════════ */
              <>
                {/* ── Shop Status Toggle ── */}
                <SectionCard title="Shop Status">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#111111' }}>Accepting New Orders</p>
                      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        Turn this off when you are closed or too busy to accept new print jobs.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#16A34A' : '#B91C1C' }}>
                        {isActive ? 'OPEN' : 'CLOSED'}
                      </span>
                      <button
                        onClick={handleToggleStatus}
                        style={{
                          width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                          background: isActive ? '#16A34A' : '#D1D5DB', position: 'relative', transition: 'background 0.2s'
                        }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: '#FFFFFF',
                          position: 'absolute', top: 2, left: isActive ? 26 : 2, transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  </div>
                </SectionCard>

                {/* ── Vendor Profile Card ── */}
                <SectionCard>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%', background: '#F0FDFA', border: '2px solid #0D9488',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 600, color: '#0D9488', overflow: 'hidden'
                      }}>
                        {user?.photoUrl
                          ? <Image src={user.photoUrl} alt="" width={52} height={52} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (user?.name || 'V').charAt(0).toUpperCase()
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#111111' }}>{profile?.shopName || user?.name || 'Vendor'}</p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>{profile?.email || user?.email || ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setView('edit')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                        color: '#0D9488', background: '#F0FDFA', border: '1px solid #CCFBF1', cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#CCFBF1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F0FDFA'; }}
                    >
                      <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      Edit Details
                    </button>
                  </div>

                  <InfoRow label="Owner" value={profile?.ownerName} />
                  <InfoRow label="Shop Name" value={profile?.shopName} />
                  <InfoRow label="Phone" value={profile?.phone} />
                  <InfoRow label="Address" value={profile?.address} />
                  <InfoRow label="Email" value={profile?.email} />
                  <InfoRow label="B&W Price" value={profile?.settings?.priceBw != null ? `₹${profile.settings.priceBw}` : null} />
                  <InfoRow label="Color Price" value={profile?.settings?.priceColor != null ? `₹${profile.settings.priceColor}` : null} />
                  <InfoRow label="Hours" value={
                    profile?.settings?.openingTime && profile?.settings?.closingTime
                      ? `${profile.settings.openingTime} – ${profile.settings.closingTime}`
                      : null
                  } />
                  <InfoRow label="Bank" value={
                    profile?.bankDetails?.accountNumber
                      ? `••••${profile.bankDetails.accountNumber.slice(-4)}`
                      : null
                  } isLast />
                </SectionCard>

                {/* ── Help & Support ── */}
                <SectionCard title="Help & Support">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg style={{ width: 16, height: 16, color: '#0D9488' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>Email Support</p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>paperprintsofficial@gmail.com</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg style={{ width: 16, height: 16, color: '#0D9488' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>Phone Support</p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>Contact details will be added soon</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg style={{ width: 16, height: 16, color: '#0D9488' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>FAQ & Help</p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>Coming soon</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: '#D1D5DB' }}>
                  PaperPrints Vendor Dashboard v1.0.0
                </div>
              </>
            ) : (
              /* ═══════════════ EDIT VIEW ═══════════════ */
              <>
                {/* PRICING */}
                <SectionCard title="Pricing Setup">
                  <div style={{ display: 'flex', gap: 16 }}>
                    <FormInput label="B&W Price per page (₹)" type="number" value={priceBw} onChange={setPriceBw} placeholder="2.00" />
                    <FormInput label="Color Price per page (₹)" type="number" value={priceColor} onChange={setPriceColor} placeholder="10.00" />
                    <FormInput label="Double-sided extra (₹)" type="number" value={priceDoubleSided} onChange={setPriceDoubleSided} placeholder="1.00" />
                  </div>
                  <SaveButton onSave={handleSavePricing} status={pricingSaveStatus} />
                </SectionCard>

                {/* OPENING HOURS */}
                <SectionCard title="Opening Hours">
                  <div style={{ display: 'flex', gap: 16 }}>
                    <FormInput label="Opening Time" type="time" value={openingTime} onChange={setOpeningTime} />
                    <FormInput label="Closing Time" type="time" value={closingTime} onChange={setClosingTime} />
                  </div>
                  <SaveButton onSave={handleSaveHours} status={hoursSaveStatus} />
                </SectionCard>

                {/* SHOP LOCATION */}
                <SectionCard title="Shop Location">
                  <div style={{ marginBottom: 12 }}>
                    <button
                      onClick={detectLocation}
                      disabled={isDetectingLoc}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
                        color: isDetectingLoc ? '#9CA3AF' : '#0D9488', background: '#F0FDFA',
                        border: `1px solid ${isDetectingLoc ? '#E5E7EB' : '#CCFBF1'}`,
                        padding: '8px 12px', borderRadius: 6, cursor: isDetectingLoc ? 'not-allowed' : 'pointer'
                      }}>
                      <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {isDetectingLoc ? 'Detecting Location...' : 'Use My Current Location'}
                    </button>
                  </div>
                  <FormInput label="Full Address" value={address} onChange={setAddress} placeholder="123 Main St, City, State, ZIP" />
                  {lat && lng && (
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>Coordinates saved: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</p>
                  )}
                  <SaveButton onSave={handleSaveLocation} status={locationSaveStatus} />
                </SectionCard>

                {/* CONTACT EMAIL */}
                <SectionCard title="Contact Email">
                  <FormInput label="Shop Email Address" type="email" value={email} onChange={setEmail} placeholder="vendor@example.com" />
                  <SaveButton onSave={handleSaveEmail} status={emailSaveStatus} />
                </SectionCard>

                {/* BANK DETAILS */}
                <SectionCard title="Bank Details (For Payouts)">
                  <FormInput label="Account Holder Name" value={accountName} onChange={setAccountName} placeholder="John Doe" />
                  <div style={{ display: 'flex', gap: 16 }}>
                    <FormInput label="Account Number" value={accountNumber} onChange={setAccountNumber} placeholder="1234567890" />
                    <FormInput label="IFSC Code" value={ifsc} onChange={setIfsc} placeholder="SBIN0001234" />
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <FormInput label="Bank Name" value={bankName} onChange={setBankName} placeholder="State Bank of India" />
                    <FormInput label="UPI ID (Optional)" value={upiId} onChange={setUpiId} placeholder="shop@upi" />
                  </div>
                  <SaveButton onSave={handleSaveBank} status={bankSaveStatus} />
                </SectionCard>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
