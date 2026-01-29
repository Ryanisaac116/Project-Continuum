import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

/**
 * UserMenu - Dropdown menu for user actions
 * Replaces separate buttons for Settings, Logout, etc.
 */
const UserMenu = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!user) return null;

    // Generate initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
            >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[100px] truncate">
                    {user.name}
                </span>

                <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-950">
                    {getInitials(user.name)}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* Header (Mobile only really, but good context) */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 sm:hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Your Profile
                        </Link>

                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.356a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.356 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.356a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </Link>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-800 py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-left"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
