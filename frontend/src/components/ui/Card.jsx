import React from 'react';

export const Card = ({ children, className = '', padding = 'p-6' }) => {
    return (
        <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${padding} ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, description }) => (
    <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
);
