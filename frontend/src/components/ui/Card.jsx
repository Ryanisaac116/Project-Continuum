import React from 'react';

export const Card = ({ children, className = '', padding = 'p-6' }) => {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:border-gray-300 dark:hover:border-slate-700 transition-colors ${padding} ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, description }) => (
    <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
    </div>
);
