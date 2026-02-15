import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminDashboardTab from './admin/AdminDashboardTab';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminMessagesTab from './admin/AdminMessagesTab';

const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
    { id: 'users', label: 'Users', icon: 'US' },
    { id: 'messages', label: 'Messages', icon: 'MSG' },
];

const AdminPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(
        tabs.some(t => t.id === tabFromUrl) ? tabFromUrl : 'dashboard'
    );

    // Sync tab from URL when navigating here (e.g. from notification click)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tabs.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams(tabId === 'dashboard' ? {} : { tab: tabId }, { replace: true });
    };

    return (
        <div className="min-h-screen bg-red-50/30 dark:bg-red-950/20">
            {/* Sticky header: banner + tabs */}
            <div className="sticky top-0 z-10">
                <div className="bg-gradient-to-r from-red-600 to-purple-700 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur text-sm font-bold">
                                AD
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Admin Panel</h1>
                                <p className="text-xs text-white/70">Manage users and monitor platform activity</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex gap-1 py-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold tracking-wider">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeTab === 'dashboard' && <AdminDashboardTab />}
                {activeTab === 'users' && <AdminUsersTab />}
                {activeTab === 'messages' && <AdminMessagesTab />}
            </div>
        </div>
    );
};

export default AdminPage;
