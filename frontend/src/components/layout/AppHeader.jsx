import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import NotificationCenter from '../NotificationCenter';

/**
 * AppHeader - Global header with navigation and notification center
 */
const AppHeader = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/exchanges', label: 'Exchanges' },
        { path: '/friends', label: 'Friends' },
        { path: '/profile', label: 'Profile' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <header className="bg-black border-b border-gray-800 sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link to="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
                        Continuum
                    </Link>

                    {/* Navigation - Hidden on mobile */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3 py-2 text-sm rounded-lg transition ${isActive(link.path)
                                    ? 'bg-blue-500/10 text-blue-400 font-medium'
                                    : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <NotificationCenter />
                        <button
                            onClick={logout}
                            className="text-sm text-gray-400 hover:text-white px-3 py-2 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="sm:hidden border-t border-gray-800 overflow-x-auto bg-gray-900">
                <div className="flex px-2 py-2 gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${isActive(link.path)
                                ? 'bg-blue-500/10 text-blue-400 font-medium'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </header>
    );
};

export default AppHeader;
