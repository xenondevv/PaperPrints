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

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal state
  const [activeModal, setActiveModal] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchVendorProfile();
      setProfile(data);
    } catch {
      showToast('Could not load profile', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Toggle shop status
  const handleToggle = async () => {
    if (!profile) return;
    const newStatus = !profile.isActive;
    try {
      await toggleShopStatus(newStatus);
      setProfile(p => ({ ...p, isActive: newStatus }));
      showToast(newStatus ? 'Shop is now Open' : 'Shop is now Closed');
    } catch { showToast('Failed to update status', false); }
  };

  // Save business hours
  const handleSaveHours = async (open, close) => {
    try {
      await updateBusinessHours(open, close);
      setProfile(p => ({ ...p, settings: { ...p.settings, openingTime: open, closingTime: close } }));
      setActiveModal(null);
      showToast('Business hours updated');
    } catch { showToast('Failed to update hours', false); }
  };

  // Save location
  const handleSaveLocation = async (lat, lng, address) => {
    try {
      await updateVendorLocation(lat, lng, address);
      setProfile(p => ({ ...p, lat, lng, address }));
      setActiveModal(null);
      showToast('Location updated');
    } catch { showToast('Failed to update location', false); }
  };

  // Save email
  const handleSaveEmail = async (email) => {
    try {
      await updateVendorEmail(email);
      setProfile(p => ({ ...p, email }));
      setActiveModal(null);
      showToast('Email updated');
    } catch { showToast('Failed to update email', false); }
  };

  // Save bank details
  const handleSaveBank = async (details) => {
    try {
      const res = await updateBankDetails(details);
      setProfile(p => ({ ...p, bankDetails: res.bankDetails }));
      setActiveModal(null);
      showToast('Bank details updated');
    } catch { showToast('Failed to update bank details', false); }
  };

  // Save pricing
  const handleSavePricing = async (pricing) => {
    try {
      await updateVendorPricing(pricing);
      setProfile(p => ({ ...p, settings: { ...p.settings, ...pricing } }));
      setActiveModal(null);
      showToast('Pricing updated');
    } catch { showToast('Failed to update pricing', false); }
  };

  const menuItems = [
    {
      icon: <svg style={{width:18,height:18}} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      label: 'Shop Open/Closing Time',
      desc: profile?.settings?.openingTime && profile?.settings?.closingTime
        ? `${profile.settings.openingTime} – ${profile.settings.closingTime}`
        : 'Not set',
      onClick: () => setActiveModal('hours'),
    },
    {
      icon: <svg style={{width:18,height:18}} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
      label: 'Update Location',
      desc: profile?.address || 'Not set',
      onClick: () => setActiveModal('location'),
    },
    {
      icon: <svg style={{width:18,height:18}} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
      label: 'Update Email',
      desc: profile?.email || 'Not set',
      onClick: () => setActiveModal('email'),
    },
    {
      icon: <svg style={{width:18,height:18}} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      label: 'Bank Details',
      desc: profile?.bankDetails?.accountNumber ? `••••${profile.bankDetails.accountNumber.slice(-4)}` : 'Not set',
      onClick: () => setActiveModal('bank'),
    },
    {
      icon: <svg style={{width:18,height:18}} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>,
      label: 'Pricing',
      desc: profile?.settings?.priceBw != null ? `B&W ₹${profile.settings.priceBw} / Color ₹${profile.settings.priceColor}` : 'Not set',
      onClick: () => setActiveModal('pricing'),
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF' }}>
        <Sidebar user={user} onSignOut={signOut} />
        <main style={{ flex: 1, marginLeft: 220 }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #E5E7EB' }}>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: '#111111' }}>Settings</h1>
          </div>

          <div style={{ padding: 24, maxWidth: 640 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading...</div>
            ) : (
              <>
                {/* Account Card */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 20px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ color: '#0D9488', display: 'flex' }}>
                      <svg style={{width:16,height:16}} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </span>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>Account Details</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDFA', border: '2px solid #0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#0D9488', overflow: 'hidden' }}>
                      {user?.photoUrl
                        ? <Image src={user.photoUrl} alt="" width={48} height={48} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (user?.name || 'V').charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#111111' }}>{profile?.shopName || user?.name || 'Vendor'}</p>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>{profile?.email || user?.email || ''}</p>
                    </div>
                  </div>
                  {[
                    { label: 'Owner', value: profile?.ownerName || '—' },
                    { label: 'Shop Name', value: profile?.shopName || '—' },
                    { label: 'Phone', value: profile?.phone || '—' },
                    { label: 'Address', value: profile?.address || '—' },
                  ].map((item, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: item.value === '—' ? '#D1D5DB' : '#111111', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Shop Status Toggle */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>Shop Status</p>
                    <p style={{ fontSize: 12, color: profile?.isActive ? '#16A34A' : '#B91C1C', fontWeight: 500, marginTop: 2 }}>
                      {profile?.isActive ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  <button onClick={handleToggle} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: profile?.isActive ? '#16A34A' : '#D1D5DB', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', position: 'absolute', top: 2, left: profile?.isActive ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                {/* Settings Menu */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 16 }}>
                  {menuItems.map((item, i) => (
                    <button key={i} onClick={item.onClick} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 20px', background: 'none', border: 'none', borderBottom: i < menuItems.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ color: '#6B7280', display: 'flex', marginRight: 14 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{item.desc}</p>
                      </div>
                      <svg style={{ width: 16, height: 16, color: '#D1D5DB' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  ))}
                </div>

                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: '#D1D5DB' }}>
                  PaperPrints Vendor Dashboard v1.0.0
                </div>
              </>
            )}
          </div>
        </main>

        {/* Modals */}
        {activeModal === 'hours' && <HoursModal profile={profile} onSave={handleSaveHours} onClose={() => setActiveModal(null)} />}
        {activeModal === 'location' && <LocationModal profile={profile} onSave={handleSaveLocation} onClose={() => setActiveModal(null)} />}
        {activeModal === 'email' && <EmailModal profile={profile} onSave={handleSaveEmail} onClose={() => setActiveModal(null)} />}
        {activeModal === 'bank' && <BankModal profile={profile} onSave={handleSaveBank} onClose={() => setActiveModal(null)} />}
        {activeModal === 'pricing' && <PricingModal profile={profile} onSave={handleSavePricing} onClose={() => setActiveModal(null)} />}

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#FFFFFF', background: toast.ok ? '#16A34A' : '#B91C1C', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s' }}>
            {toast.msg}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

/* ── Modal Wrapper ─────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: 28, margin: '0 16px' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111111', marginBottom: 20 }}>{title}</p>
        {children}
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13, color: '#111111', outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#0D9488'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  );
}

function ModalActions({ onClose, onSave, saving }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
      <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
      <button onClick={onSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#FFFFFF', background: '#0D9488', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

/* ── Hours Modal ───────────────────────────────────────────────────────────── */
function HoursModal({ profile, onSave, onClose }) {
  const [open, setOpen] = useState(profile?.settings?.openingTime || '09:00');
  const [close, setClose] = useState(profile?.settings?.closingTime || '18:00');
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await onSave(open, close); setSaving(false); };
  return (
    <Modal title="Shop Open/Closing Time" onClose={onClose}>
      <ModalInput label="Opening Time" type="time" value={open} onChange={setOpen} />
      <ModalInput label="Closing Time" type="time" value={close} onChange={setClose} />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ── Location Modal ────────────────────────────────────────────────────────── */
function LocationModal({ profile, onSave, onClose }) {
  const [lat, setLat] = useState(String(profile?.lat || ''));
  const [lng, setLng] = useState(String(profile?.lng || ''));
  const [address, setAddress] = useState(profile?.address || '');
  const [saving, setSaving] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLng(String(pos.coords.longitude)); },
      () => {}
    );
  };

  const save = async () => { setSaving(true); await onSave(parseFloat(lat), parseFloat(lng), address); setSaving(false); };
  return (
    <Modal title="Update Location" onClose={onClose}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><ModalInput label="Latitude" value={lat} onChange={setLat} placeholder="28.6324" /></div>
        <div style={{ flex: 1 }}><ModalInput label="Longitude" value={lng} onChange={setLng} placeholder="77.4438" /></div>
      </div>
      <ModalInput label="Address" value={address} onChange={setAddress} placeholder="Shop address" />
      <button onClick={detectLocation} style={{ fontSize: 12, color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, marginBottom: 8 }}>
        📍 Detect my location
      </button>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ── Email Modal ───────────────────────────────────────────────────────────── */
function EmailModal({ profile, onSave, onClose }) {
  const [email, setEmail] = useState(profile?.email || '');
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await onSave(email); setSaving(false); };
  return (
    <Modal title="Update Email" onClose={onClose}>
      <ModalInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="vendor@example.com" />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ── Bank Modal ────────────────────────────────────────────────────────────── */
function BankModal({ profile, onSave, onClose }) {
  const b = profile?.bankDetails || {};
  const [accountName, setAccountName] = useState(b.accountName || '');
  const [accountNumber, setAccountNumber] = useState(b.accountNumber || '');
  const [ifsc, setIfsc] = useState(b.ifsc || '');
  const [bankName, setBankName] = useState(b.bankName || '');
  const [upiId, setUpiId] = useState(b.upiId || '');
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await onSave({ accountName, accountNumber, ifsc, bankName, upiId }); setSaving(false); };
  return (
    <Modal title="Bank Details" onClose={onClose}>
      <ModalInput label="Account Holder Name" value={accountName} onChange={setAccountName} placeholder="John Doe" />
      <ModalInput label="Account Number" value={accountNumber} onChange={setAccountNumber} placeholder="1234567890" />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><ModalInput label="IFSC Code" value={ifsc} onChange={setIfsc} placeholder="SBIN0001234" /></div>
        <div style={{ flex: 1 }}><ModalInput label="Bank Name" value={bankName} onChange={setBankName} placeholder="SBI" /></div>
      </div>
      <ModalInput label="UPI ID (optional)" value={upiId} onChange={setUpiId} placeholder="vendor@upi" />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ── Pricing Modal ─────────────────────────────────────────────────────────── */
function PricingModal({ profile, onSave, onClose }) {
  const s = profile?.settings || {};
  const [priceBw, setPriceBw] = useState(String(s.priceBw ?? ''));
  const [priceColor, setPriceColor] = useState(String(s.priceColor ?? ''));
  const [priceDoubleSided, setPriceDoubleSided] = useState(String(s.priceDoubleSided ?? ''));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await onSave({
      priceBw: parseFloat(priceBw) || 0,
      priceColor: parseFloat(priceColor) || 0,
      priceDoubleSided: parseFloat(priceDoubleSided) || 0,
    });
    setSaving(false);
  };
  return (
    <Modal title="Pricing" onClose={onClose}>
      <ModalInput label="B&W Price per page (₹)" value={priceBw} onChange={setPriceBw} placeholder="2" />
      <ModalInput label="Color Price per page (₹)" value={priceColor} onChange={setPriceColor} placeholder="10" />
      <ModalInput label="Double-sided extra (₹)" value={priceDoubleSided} onChange={setPriceDoubleSided} placeholder="1" />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}
