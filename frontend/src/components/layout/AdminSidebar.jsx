import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X, BarChart2, Users, MessageSquare } from 'lucide-react';

const AdminSidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: <BarChart2 className="w-5 h-5" />, end: true },
        { path: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
        { path: '/admin/messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
    ];

    const NavContent = ({ mobile = false }) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 ${mobile ? 'justify-between' : ''}`}>
                <div className="flex items-center">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-500">Continuum</span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded">
                        Admin
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={() => mobile && setOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive
                                ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`
                        }
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-700 dark:text-gray-200">
                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                    Sign Out
                </button>
                <NavLink
                    to="/app"
                    className="block w-full mt-2 px-3 py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    ← Back to App
                </NavLink>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col h-screen sticky top-0">
                <NavContent />
            </aside>

            {/* Mobile Header with Sheet Trigger */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                <div className="flex items-center">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-500">Continuum</span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded">
                        Admin
                    </span>
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                        <NavContent mobile={true} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};

export default AdminSidebar;
