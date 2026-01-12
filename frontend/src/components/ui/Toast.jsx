import { useState, useEffect } from 'react';

export const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    const bgColor = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-500',
        error: 'bg-red-600',
    }[type] || 'bg-gray-800';

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in`}>
            <span className="text-sm font-medium">{message}</span>
            <button
                onClick={() => { setVisible(false); onClose?.(); }}
                className="text-white/80 hover:text-white text-lg leading-none"
            >
                ×
            </button>
        </div>
    );
};
