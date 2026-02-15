/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

/**
 * DialogContext - Global custom dialog system replacing native alert() and confirm().
 * 
 * Usage:
 *   const { alert, confirm } = useDialog();
 *   
 *   // Alert (just a message, user clicks OK)
 *   await alert('Something happened');
 *   await alert('Error title', 'Detailed message');
 *   
 *   // Confirm (returns true/false)
 *   const ok = await confirm('Are you sure?');
 *   const ok = await confirm('Delete item', 'This cannot be undone.', 'Delete', 'destructive');
 */

const DialogContext = createContext(null);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within DialogProvider');
    }
    return context;
};

export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null);
    const resolveRef = useRef(null);

    const showDialog = useCallback((options) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setDialog(options);
        });
    }, []);

    const handleClose = useCallback((result) => {
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
        setDialog(null);
    }, []);

    // alert(message) or alert(title, message)
    const alert = useCallback((titleOrMessage, message) => {
        const title = message ? titleOrMessage : '';
        const body = message || titleOrMessage;
        return showDialog({
            type: 'alert',
            title,
            message: body,
            confirmLabel: 'OK',
            variant: 'default',
        });
    }, [showDialog]);

    // confirm(message) or confirm(title, message, confirmLabel, variant)
    const confirm = useCallback((titleOrMessage, message, confirmLabel = 'Confirm', variant = 'default') => {
        const title = message ? titleOrMessage : '';
        const body = message || titleOrMessage;
        return showDialog({
            type: 'confirm',
            title,
            message: body,
            confirmLabel,
            variant, // 'default' | 'destructive' | 'warning'
        });
    }, [showDialog]);

    return (
        <DialogContext.Provider value={{ alert, confirm }}>
            {children}
            {dialog && (
                <DialogOverlay dialog={dialog} onClose={handleClose} />
            )}
        </DialogContext.Provider>
    );
};

/**
 * DialogOverlay - The actual modal UI
 */
const DialogOverlay = ({ dialog, onClose }) => {
    const { type, title, message, confirmLabel, variant } = dialog;

    const getConfirmClasses = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25';
            case 'warning':
                return 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25';
            default:
                return 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25';
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'destructive':
                return (
                    <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                );
            default:
                return (
                    <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onClose(type === 'alert' ? undefined : false)}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md animate-scale-in overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {getIcon()}
                        <div className="flex-1 min-w-0 pt-1">
                            {title && (
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                    {title}
                                </h3>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-5 flex items-center justify-end gap-3">
                    {type === 'confirm' && (
                        <button
                            onClick={() => onClose(false)}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => onClose(type === 'alert' ? undefined : true)}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getConfirmClasses()}`}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
