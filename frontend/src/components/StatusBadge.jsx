import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge';
  let dotColor = '#94A3B8'; // gray default
  
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'pending':
      badgeClass += ' badge-pending';
      dotColor = 'var(--color-pending)';
      break;
    case 'confirmed':
      badgeClass += ' badge-confirmed';
      dotColor = 'var(--color-confirmed)';
      break;
    case 'dispatched':
      badgeClass += ' badge-dispatched';
      dotColor = 'var(--color-dispatched)';
      break;
    case 'delivered':
      badgeClass += ' badge-delivered';
      dotColor = 'var(--color-delivered)';
      break;
    case 'low':
      badgeClass += ' badge-low-stock';
      dotColor = 'var(--color-error)';
      break;
    case 'good':
      badgeClass += ' badge-good-stock';
      dotColor = 'var(--color-delivered)';
      break;
    default:
      break;
  }

  return (
    <span className={badgeClass}>
      <span style={{ color: dotColor, marginRight: '6px', fontSize: '0.65rem' }}>●</span>
      {status}
    </span>
  );
};

export default StatusBadge;
