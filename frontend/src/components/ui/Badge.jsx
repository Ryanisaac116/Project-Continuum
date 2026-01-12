import React from 'react';

const statusColors = {
    ONLINE: 'bg-green-100 text-green-700 border-green-200',
    BUSY: 'bg-red-100 text-red-700 border-red-200',
    OFFLINE: 'bg-gray-100 text-gray-600 border-gray-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const Badge = ({ status, children, className = '' }) => {
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`
      inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
      ${colorClass}
      ${className}
    `}>
            {children || status}
        </span>
    );
};
