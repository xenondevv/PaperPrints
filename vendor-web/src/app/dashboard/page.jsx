'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Sidebar from '../../components/Sidebar';
import OrdersTable from '../../components/OrdersTable';
import AcceptModal from '../../components/AcceptModal';
import StatusBadge from '../../components/StatusBadge';
import NotificationToast, { useNotifications } from '../../components/NotificationToast';
import useOrders from '../../hooks/useOrders';
import useSocket from '../../hooks/useSocket';
import { acceptOrder as apiAcceptOrder, rejectOrder as apiRejectOrder, updateOrderStatus, fetchVendorOrderById } from '../../lib/api';

function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

const FILTER_MAP = {
  pending:   ['PENDING'],
  accepted:  ['ACCEPTED'],
  completed: ['COMPLETED'],
  rejected:  ['REJECTED'],
  history:   ['COMPLETED', 'REJECTED', 'CANCELLED'],
};

const FILTER_TITLES = {
  pending:   'Pending Orders',
  accepted:  'Accepted Orders',
  completed: 'Completed Orders',
  rejected:  'Rejected Orders',
  history:   'Order History',
};

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFFFF' }} />}>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const { user, signOut } = useAuth();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const { orders, loading, error, prependOrder, updateOrder } = useOrders();
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const [acceptModalOrder, setAcceptModalOrder] = useState(null);
  const [completeModalOrder, setCompleteModalOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewOrder = useCallback((order) => {
    prependOrder(order); addNotification(order); playNewOrderSound();
  }, [prependOrder, addNotification]);

  const handleOrderUpdate = useCallback((orderId, updates) => {
    updateOrder(orderId, updates);
  }, [updateOrder]);

  useSocket({ onNewOrder: handleNewOrder, onOrderUpdate: handleOrderUpdate });

  // Accept
  const handleAccept = useCallback(async (estimatedMinutes) => {
    if (!acceptModalOrder) return;
    const orderId = acceptModalOrder.id;
    setActionLoading(p => ({ ...p, [orderId]: 'accept' }));
    try {
      await apiAcceptOrder(orderId, estimatedMinutes);
      updateOrder(orderId, { status: 'ACCEPTED', estimatedTime: String(estimatedMinutes) });
      setAcceptModalOrder(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed to accept order'); }
    finally { setActionLoading(p => ({ ...p, [orderId]: null })); }
  }, [acceptModalOrder, updateOrder]);

  // Reject
  const handleReject = useCallback(async (order) => {
    if (!confirm(`Reject order ${order.orderNumber || order.id.slice(0, 8)}?`)) return;
    setActionLoading(p => ({ ...p, [order.id]: 'reject' }));
    try {
      await apiRejectOrder(order.id);
      updateOrder(order.id, { status: 'REJECTED' });
    } catch (err) { alert(err.response?.data?.message || 'Failed to reject order'); }
    finally { setActionLoading(p => ({ ...p, [order.id]: null })); }
  }, [updateOrder]);

  // Complete Order → READY
  const handleCompleteOrder = useCallback(async (slotNo) => {
    if (!completeModalOrder) return;
    const orderId = completeModalOrder.id;
    setActionLoading(p => ({ ...p, [orderId]: 'complete' }));
    try {
      await updateOrderStatus(orderId, 'READY');
      updateOrder(orderId, { status: 'READY', slotNo: slotNo || null });
      setCompleteModalOrder(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(p => ({ ...p, [orderId]: null })); }
  }, [completeModalOrder, updateOrder]);

  // Picked Up → COMPLETED
  const handlePickedUp = useCallback(async (order) => {
    setActionLoading(p => ({ ...p, [order.id]: 'pickup' }));
    try {
      await updateOrderStatus(order.id, 'COMPLETED');
      updateOrder(order.id, { status: 'COMPLETED' });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(p => ({ ...p, [order.id]: null })); }
  }, [updateOrder]);

  // View Order → open inline modal
  const handleViewOrder = useCallback(async (order) => {
    setViewLoading(true);
    try {
      const detail = await fetchVendorOrderById(order.id);
      setViewOrder(detail);
    } catch {
      setViewOrder(order);
    }
    setViewLoading(false);
  }, []);

  // Filtering
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filter && FILTER_MAP[filter]) {
      result = result.filter(o => FILTER_MAP[filter].includes(o.status));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        (o.orderNumber || '').toLowerCase().includes(q)
        || (o.customerName || o.userName || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filter, searchQuery]);

  const pageTitle = filter ? (FILTER_TITLES[filter] || 'All Orders') : 'All Orders';

  const renderActionButtons = (order) => {
    const ld = actionLoading[order.id];

    if (order.status === 'PENDING') {
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionBtn onClick={() => handleReject(order)} disabled={!!ld} variant="red">
            {ld === 'reject' ? '…' : 'REJECT'}
          </ActionBtn>
          <ActionBtn onClick={() => setAcceptModalOrder(order)} disabled={!!ld} variant="dark">
            {ld === 'accept' ? '…' : 'ACCEPT'}
          </ActionBtn>
        </div>
      );
    }

    if (order.status === 'ACCEPTED' || order.status === 'PROCESSING') {
      return (
        <ActionBtn onClick={() => setCompleteModalOrder(order)} disabled={!!ld} variant="yellow">
          <svg style={{ width: 12, height: 12, marginRight: 4 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {ld === 'complete' ? '…' : 'COMPLETE ORDER'}
        </ActionBtn>
      );
    }

    if (order.status === 'READY') {
      return (
        <ActionBtn onClick={() => handlePickedUp(order)} disabled={!!ld} variant="green">
          <svg style={{ width: 12, height: 12, marginRight: 4 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {ld === 'pickup' ? '…' : 'PICKED UP'}
        </ActionBtn>
      );
    }

    return null;
  };

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF' }}>
        <Sidebar user={user} onSignOut={signOut} />
        <NotificationToast notifications={notifications} onDismiss={dismissNotification} />

        {acceptModalOrder && (
          <AcceptModal order={acceptModalOrder} onConfirm={handleAccept}
            onCancel={() => setAcceptModalOrder(null)}
            loading={actionLoading[acceptModalOrder.id] === 'accept'} />
        )}

        {completeModalOrder && (
          <CompleteOrderModal
            order={completeModalOrder}
            onConfirm={handleCompleteOrder}
            onCancel={() => setCompleteModalOrder(null)}
            loading={actionLoading[completeModalOrder.id] === 'complete'}
          />
        )}

        {viewOrder && (
          <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
        )}

        {viewLoading && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #E5E7EB', borderTopColor: '#0D9488', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <main style={{ flex: 1, marginLeft: 220 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px 14px', borderBottom: '1px solid #E5E7EB',
          }}>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: '#111111' }}>{pageTitle}</h1>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
              padding: '0 12px', height: 32,
            }}>
              <svg style={{ width: 14, height: 14, color: '#9CA3AF' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#111111', width: 180 }} />
            </div>
          </div>

          <OrdersTable orders={filteredOrders} loading={loading} error={error}
            onViewOrder={handleViewOrder} actionButtons={renderActionButtons} />
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ── Action Button ─────────────────────────────────────────────────────────── */

function ActionBtn({ children, onClick, disabled, variant }) {
  const styles = {
    yellow: { bg: '#FEF9C3', color: '#854D0E', border: '#FDE68A', hoverBg: '#FEF08A' },
    green:  { bg: '#16A34A', color: '#FFFFFF', border: '#16A34A', hoverBg: '#15803D' },
    red:    { bg: '#FFFFFF', color: '#B91C1C', border: '#FECACA', hoverBg: '#FEF2F2' },
    dark:   { bg: '#FFFFFF', color: '#111111', border: '#D1D5DB', hoverBg: '#F9FAFB' },
    muted:  { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB', hoverBg: '#E5E7EB' },
  };
  const c = styles[variant] || styles.dark;

  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '6px 14px', borderRadius: 6,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.3px',
        background: c.bg, color: c.color,
        border: `1px solid ${c.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'background 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = c.hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = c.bg; }}
    >
      {children}
    </button>
  );
}

/* ── Complete Order Confirmation Modal ─────────────────────────────────────── */

function CompleteOrderModal({ order, onConfirm, onCancel, loading }) {
  const [slotNo, setSlotNo] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} onClick={onCancel} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: 28, margin: '0 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#111111', marginBottom: 4 }}>Complete Order</p>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
          Mark <strong>#{order.orderNumber || order.id?.slice(0, 8)}</strong> as ready for pickup? The customer will be notified.
        </p>

        <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 6 }}>
          Slot No. <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
        </label>
        <input type="text" value={slotNo} onChange={(e) => setSlotNo(e.target.value)}
          placeholder="e.g. A-12"
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            border: '1px solid #E5E7EB', fontSize: 13, color: '#111111',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = '#0D9488'}
          onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button onClick={onCancel}
            style={{ padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(slotNo)} disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              color: '#FFFFFF', background: '#0D9488', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Completing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Order Detail Modal (inline dialog) ────────────────────────────────────── */

function OrderDetailModal({ order, onClose }) {
  const handlePrint = async (url) => {
    if (!url) return;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;';
      document.body.appendChild(iframe);
      iframe.src = blobUrl;
      iframe.onload = () => {
        try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch { window.open(url, '_blank'); }
        setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(blobUrl); }, 2000);
      };
    } catch { window.open(url, '_blank'); }
  };

  const handleDownload = (url, fileName) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = fileName || 'document.pdf'; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 620,
        background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB',
        margin: '40px 16px', zIndex: 56,
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111111' }}>
            Order #{order.orderNumber || order.id?.slice(0, 8)}
          </p>
          <StatusBadge status={order.status} />
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Customer */}
          <Section title="Customer">
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>{order.customerName || order.userName || 'Customer'}</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{order.customerEmail || order.customerPhone || '—'}</p>
          </Section>

          {/* Remark */}
          <Section title="Remark">
            <p style={{ fontSize: 13, color: order.remark ? '#111111' : '#0D9488', fontStyle: order.remark ? 'normal' : 'italic' }}>
              {order.remark || 'No remark.'}
            </p>
          </Section>

          {/* Files to Print */}
          <Section title="Files to Print">
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, background: '#FAFAFA' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#111111' }}>
                {order.fileName || 'Standard Documents'}
                <span style={{ color: '#B91C1C', fontWeight: 500, marginLeft: 8 }}>x {order.copies || 1} Copies</span>
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                Total Pages: {order.totalPages || '—'}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                  <FileCard label="B&W FILE" url={order.bwFile || order.fileUrl} fileName={order.fileName} variant="solid" onPrint={handlePrint} onDownload={handleDownload} />
                  <FileCard label="COLOR FILE" url={order.colorFile || order.fileUrl} fileName={order.fileName} variant="solid" onPrint={handlePrint} onDownload={handleDownload} />
                </div>
                <FileCard label="ORIGINAL FILE" url={order.fileUrl} fileName={order.fileName} variant="outline" onPrint={handlePrint} onDownload={handleDownload} />
              </div>
            </div>
          </Section>

          {/* Order Summary */}
          <Section title="Order Summary">
            <div style={{ fontSize: 13, color: '#111111', lineHeight: 1.8 }}>
              <p>1. Paper Printing - {order.fileName || 'Standard Documents'} (No. of Copies: {order.copies || 1})</p>
              {order.isDoubleSided && <p style={{ fontSize: 12, color: '#6B7280' }}>• Double-sided printing</p>}
              {order.estimatedTime && <p style={{ fontSize: 12, color: '#6B7280' }}>• Estimated time: {order.estimatedTime} min</p>}
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment" noBorder>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>Total: ₹{parseFloat(order.totalPrice || 0).toFixed(2)}</p>
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
              }}>PAID</span>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose}
            style={{
              padding: '8px 24px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              color: '#FFFFFF', background: '#0D9488', border: 'none', cursor: 'pointer',
            }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */

function Section({ title, children, noBorder }) {
  return (
    <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: noBorder ? 'none' : '1px solid #E5E7EB' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#111111', marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );
}

/* ── File Card ─────────────────────────────────────────────────────────────── */

function FileCard({ label, url, fileName, variant, onPrint, onDownload }) {
  const isSolid = variant === 'solid';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button onClick={() => url && window.open(url, '_blank')} disabled={!url}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 6,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.3px',
          background: isSolid ? '#0D9488' : '#FFFFFF',
          color: isSolid ? '#FFFFFF' : '#0F766E',
          border: isSolid ? '1px solid #0D9488' : '1.5px solid #0D9488',
          cursor: url ? 'pointer' : 'default', opacity: url ? 1 : 0.4, whiteSpace: 'nowrap',
        }}>
        <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {label}
      </button>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onPrint(url)} disabled={!url}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 4,
            fontSize: 10, fontWeight: 500, color: '#6B7280',
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            cursor: url ? 'pointer' : 'default', opacity: url ? 1 : 0.4,
          }}>
          <svg style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          PRINT
        </button>
        <button onClick={() => onDownload(url, fileName)} disabled={!url}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '4px 8px', borderRadius: 4,
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            color: '#6B7280', cursor: url ? 'pointer' : 'default', opacity: url ? 1 : 0.4,
          }}>
          <svg style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
