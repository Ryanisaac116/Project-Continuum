import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { Users, Activity, ArrowLeftRight, MessageSquare, Phone, BookOpen } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, gradient }) => (
    <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-black/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
        <div className={`absolute -top-6 -right-6 w-32 h-32 ${gradient} opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
        <div className="relative">
            <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-gray-300/20 dark:shadow-none group-hover:shadow-xl transition-shadow`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
                {typeof value === 'string' ? value : (value?.toLocaleString() ?? '--')}
            </p>
        </div>
    </div>
);

const AdminDashboardTab = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await adminApi.getDashboardStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useLiveRefresh({
        refresh: fetchStats,
        events: ['all', 'session', 'match', 'connection'],
        runOnMount: false,
        minIntervalMs: 2000,
        pollIntervalMs: 10000,
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        label="Total Users"
                        value={stats?.totalUsers}
                        icon={Users}
                        gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        label="Active Users (24h)"
                        value={stats?.activeUsers}
                        icon={Activity}
                        gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                    />
                    <StatCard
                        label="Total Requests"
                        value={stats?.totalExchangeRequests}
                        icon={ArrowLeftRight}
                        gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                    />
                    <StatCard
                        label="Total Messages"
                        value={stats?.totalMessages}
                        icon={MessageSquare}
                        gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
                    />
                    <StatCard
                        label="Completed Sessions"
                        value={stats?.completedSessions}
                        icon={Phone}
                        gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                    />
                    <StatCard
                        label="Skills (Teach / Learn)"
                        value={`${stats?.teachingSkills ?? 0} / ${stats?.learningSkills ?? 0}`}
                        icon={BookOpen}
                        gradient="bg-gradient-to-br from-red-500 to-rose-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardTab;
