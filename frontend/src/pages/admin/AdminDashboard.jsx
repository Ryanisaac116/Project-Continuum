import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Users, ArrowLeftRight, AlertCircle, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await adminApi.getDashboardStats();
                setStats(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: Users,
            gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        },
        {
            label: 'Exchange Requests',
            value: stats?.totalExchangeRequests ?? 0,
            icon: ArrowLeftRight,
            gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
        },
    ];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-black/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
                        >
                            <div className={`absolute -top-6 -right-6 w-32 h-32 ${card.gradient} opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                            <div className="relative flex items-center gap-4">
                                <div
                                    className={`w-12 h-12 ${card.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{card.value.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
