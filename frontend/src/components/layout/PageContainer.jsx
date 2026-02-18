import React from 'react';

export const PageContainer = ({ children, className = '' }) => {
    return (
        <div className={`mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8 min-h-full ${className}`}>
            {children}
        </div>
    );
};
