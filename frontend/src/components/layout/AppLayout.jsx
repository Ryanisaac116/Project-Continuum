import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '../NotificationCenter';
import UserMenu from './UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Home, ArrowLeftRight, Users, ShieldCheck } from 'lucide-react';

// Mobile Navigation Icon wrapper
const NavIcon = ({ icon: Icon, active }) => (
    <Icon className={`w-6 h-6 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
);

export const AppLayout = ({ children }) => {
    const { user, isAdmin } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: 'Home', path: '/app', icon: Home },
        { label: 'Exchanges', path: '/exchanges', icon: ArrowLeftRight },
        { label: 'Friends', path: '/friends', icon: Users },
        ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div
            className="flex min-h-dvh flex-col bg-gray-50 dark:bg-black font-sans transition-colors duration-300"
            style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
        >


            {/* Desktop Navbar */}
            <header
                className="bg-white/80 dark:bg-black/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex h-14 sm:h-16 justify-between items-center">
                        <div className="flex min-w-0 items-center gap-3 sm:gap-8">
                            <Link to="/" className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Continuum
                            </Link>

                            <nav className="hidden md:flex gap-6">
                                {navItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`text-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-white ${isActive(item.path) ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {user && (
                            <div className="flex items-center gap-1.5 sm:gap-3">
                                <ThemeToggle />
                                <NotificationCenter />
                                <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-slate-800 mx-1"></div>
                                <UserMenu />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-20 transition-colors"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex justify-around items-center h-16 px-1.5">
                    {navItems.map(item => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center flex-1 py-2 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                <NavIcon icon={item.icon} active={active} />
                                <span className={`text-[11px] mt-1 ${active ? 'font-medium' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

        </div>
    );
};
