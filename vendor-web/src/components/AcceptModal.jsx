'use client';

import { useState } from 'react';

export default function AcceptModal({ order, onConfirm, onCancel, loading }) {
  const [minutes, setMinutes] = useState(15);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
        onClick={!loading ? onCancel : undefined} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 400,
        background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB',
        padding: 28, margin: '0 16px',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: '#111111' }}>
          Accept order #{order.orderNumber || order.id?.slice(0, 8)}?
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, lineHeight: 1.6 }}>
          Please select the estimated time required to complete this order. The customer will be notified accordingly.
        </p>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setMinutes(m => Math.max(5, m - 5))} disabled={loading || minutes <= 5}
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              fontSize: 16, color: '#6B7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (loading || minutes <= 5) ? 0.3 : 1,
            }}>−</button>
          <input type="number" value={minutes}
            onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 0))}
            disabled={loading}
            style={{
              width: 64, height: 32, textAlign: 'center',
              border: '1px solid #E5E7EB', borderRadius: 6,
              fontSize: 15, fontWeight: 500, color: '#111111',
              outline: 'none', background: '#FFFFFF',
            }} />
          <button onClick={() => setMinutes(m => m + 5)} disabled={loading}
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              fontSize: 16, color: '#6B7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: loading ? 0.3 : 1,
            }}>+</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>minutes</p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
          <button onClick={onCancel} disabled={loading}
            style={{
              padding: '8px 12px', fontSize: 13, fontWeight: 500,
              color: '#6B7280', background: 'none', border: 'none',
              cursor: 'pointer', borderRadius: 6,
            }}>Cancel</button>
          <button onClick={() => onConfirm(minutes)} disabled={loading}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              color: '#FFFFFF', background: '#0D9488', border: 'none',
              borderRadius: 6, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
            Accept Order
          </button>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
