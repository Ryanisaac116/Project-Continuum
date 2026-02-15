import { useState, useEffect } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [visible, setVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, 300); // Match animation duration
    };

    if (!visible) return null;

    const styles = {
        info: {
            icon: <Info className="w-5 h-5 text-blue-500" />,
            bg: 'bg-white/80 dark:bg-slate-900/80 border-blue-500/30',
            text: 'text-slate-800 dark:text-slate-100'
        },
        success: {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            bg: 'bg-white/80 dark:bg-slate-900/80 border-green-500/30',
            text: 'text-slate-800 dark:text-slate-100'
        },
        warning: {
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            bg: 'bg-white/80 dark:bg-slate-900/80 border-amber-500/30',
            text: 'text-slate-800 dark:text-slate-100'
        },
        error: {
            icon: <XCircle className="w-5 h-5 text-red-500" />,
            bg: 'bg-white/80 dark:bg-slate-900/80 border-red-500/30',
            text: 'text-slate-800 dark:text-slate-100'
        }
    }[type] || {
        icon: <Info className="w-5 h-5" />,
        bg: 'bg-white/80 dark:bg-slate-900/80',
        text: 'text-slate-800 dark:text-slate-100'
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 ${styles.bg} ${styles.text} ${isExiting ? 'opacity-0 translate-x-10' : 'animate-fade-in-up'}`}
            role="alert"
        >
            <div className="flex-shrink-0">
                {styles.icon}
            </div>
            <p className="text-sm font-medium pr-2">
                {message}
            </p>
            <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4 opacity-70" />
            </button>
        </div>
    );
};
