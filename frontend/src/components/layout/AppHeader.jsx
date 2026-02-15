import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import NotificationCenter from '../NotificationCenter';
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * AppHeader - Global header with navigation and notification center
 */
const AppHeader = () => {
    const { user, isAdmin, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/exchanges', label: 'Exchanges' },
        { path: '/friends', label: 'Friends' },
        { path: '/profile', label: 'Profile' },
    ];

    if (isAdmin) {
        navLinks.push({ path: '/admin', label: 'Admin', admin: true });
    }

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block">Continuum</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    isActive(link.path) ? "text-foreground" : "text-foreground/60",
                                    link.admin && "text-red-500 hover:text-red-600"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Mobile Menu (simplified for now) */}
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search or other items could go here */}
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationCenter />
                        <Button variant="ghost" size="sm" onClick={logout}>
                            Sign out
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
