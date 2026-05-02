'use client';

import StatusBadge from './StatusBadge';

export default function OrdersTable({ orders, loading, error, onViewOrder, actionButtons }) {
  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ width: 20, height: 20, border: '2px solid #E5E7EB', borderTopColor: '#0D9488', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.6s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>Loading orders…</p>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#B91C1C' }}>{error}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No orders found</p>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Orders matching this filter will appear here</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
          <Th style={{ width: 80 }}></Th>
          <Th>Order</Th>
          <Th>Date</Th>
          <Th>Total Amount</Th>
          {actionButtons && <Th style={{ textAlign: 'right' }}>Actions</Th>}
        </tr>
      </thead>
      <tbody>
        {orders.map((order, idx) => (
          <tr key={order.id}
            style={{
              borderBottom: idx === orders.length - 1 ? 'none' : '1px solid #E5E7EB',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {/* VIEW button */}
            <td style={{ padding: '12px 12px 12px 24px', verticalAlign: 'middle' }}>
              <button
                onClick={() => onViewOrder?.(order)}
                style={{
                  padding: '5px 14px', borderRadius: 4,
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.3px',
                  color: '#0F766E', background: '#FFFFFF',
                  border: '1.5px solid #0D9488',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F0FDFA'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                VIEW
              </button>
            </td>
            {/* Order info: Name large, ID small */}
            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111111', lineHeight: 1.4 }}>
                {order.customerName || order.userName || 'Customer'}
              </p>
              <p style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                # {order.orderNumber || order.id?.slice(0, 8)}
                {order.customerPhone ? ` | ${order.customerPhone}` : ''}
              </p>
            </td>
            {/* Date */}
            <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', verticalAlign: 'middle' }}>
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
            </td>
            {/* Amount */}
            <td style={{ padding: '12px 16px', fontSize: 13, color: '#111111', verticalAlign: 'middle' }}>
              ₹ {parseFloat(order.totalPrice || 0).toFixed(2)}
            </td>
            {/* Actions */}
            {actionButtons && (
              <td style={{ padding: '12px 24px 12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                {actionButtons(order)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, style }) {
  return (
    <th style={{
      textAlign: 'left', padding: '10px 16px',
      fontSize: 11, fontWeight: 500, color: '#9CA3AF',
      background: '#F9FAFB', ...style,
    }}>{children}</th>
  );
}
