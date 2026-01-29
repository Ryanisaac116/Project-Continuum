import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui/Button';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '../NotificationCenter';
import UserMenu from './UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';

// Mobile Navigation Icons
const HomeIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const ExchangeIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);

const FriendsIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const ProfileIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-black' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const AppLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: 'Home', path: '/app', icon: HomeIcon },
        { label: 'Exchanges', path: '/exchanges', icon: ExchangeIcon },
        { label: 'Friends', path: '/friends', icon: FriendsIcon },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-black font-sans transition-colors duration-300"
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>


            {/* Desktop Navbar */}
            <header className="bg-white/80 dark:bg-black/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors">
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex h-14 sm:h-16 justify-between items-center">
                        <div className="flex items-center gap-4 sm:gap-8">
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
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                <NotificationCenter />
                                <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-1"></div>
                                <UserMenu />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-16">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-20 transition-colors">
                <div className="flex justify-around items-center h-16 px-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center flex-1 py-2 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'
                                    }`}
                            >
                                <Icon active={active} />
                                <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
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
