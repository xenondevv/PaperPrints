'use client';

const statusConfig = {
  PENDING:    { label: 'Pending',    bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  ACCEPTED:   { label: 'accepted',   bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  REJECTED:   { label: 'Rejected',   bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  PROCESSING: { label: 'Processing', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  READY:      { label: 'Ready',      bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  COMPLETED:  { label: 'Completed',  bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  CANCELLED:  { label: 'Cancelled',  bg: '#F3F4F6', color: '#9CA3AF', border: '#E5E7EB' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status?.toUpperCase()] || statusConfig.PENDING;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
      backgroundColor: config.bg, color: config.color,
      border: `0.5px solid ${config.border}`,
      lineHeight: 1,
    }}>
      {config.label}
    </span>
  );
}
