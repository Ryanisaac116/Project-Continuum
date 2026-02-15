import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import SupportModal from '../support/SupportModal';
import {
    User,
    Settings,
    LogOut,
    HelpCircle,
    ChevronDown
} from 'lucide-react';

/**
 * UserMenu - Dropdown menu for user actions
 * Replaces separate buttons for Settings, Logout, etc.
 */
const UserMenu = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
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
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1 pl-2 pr-1 rounded-full transition-all duration-300 border h-auto ${isOpen
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
            >
                <div className="flex flex-col items-end hidden sm:block mr-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight max-w-[100px] truncate">
                        {user.name}
                    </span>
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-950 group-hover:ring-indigo-200 dark:group-hover:ring-indigo-900 transition-all">
                    {getInitials(user.name)}
                </div>

                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 glass-panel rounded-2xl z-50 animate-fade-in-up origin-top-right overflow-hidden shadow-2xl ring-1 ring-black/5">
                    {/* Header (Mobile only really, but good context) */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{user.email}</p>
                    </div>

                    <div className="p-2 space-y-1">
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <User className="w-4 h-4" />
                            </span>
                            Your Profile
                        </Link>

                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                                <Settings className="w-4 h-4" />
                            </span>
                            Settings
                        </Link>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsOpen(false);
                                setIsSupportOpen(true);
                            }}
                            className="flex w-full justify-start items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group h-auto"
                        >
                            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                                <HelpCircle className="w-4 h-4" />
                            </span>
                            Help & Support
                        </Button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/50 p-2 bg-slate-50/30 dark:bg-slate-900/30">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="flex w-full justify-start items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 h-auto group"
                        >
                            <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </span>
                            Sign out
                        </Button>
                    </div>
                </div>
            )}

            <SupportModal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                type="SUPPORT"
            />
        </div>
    );
};

export default UserMenu;
