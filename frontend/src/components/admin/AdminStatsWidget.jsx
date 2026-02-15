import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const AdminStatsWidget = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await adminApi.getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load admin stats:', err);
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

    if (loading) return null;

    return (
        <div className="bg-gradient-to-r from-red-600 to-purple-700 rounded-2xl p-4 sm:p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">Admin Overview</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur">
                    Visible only to Admins
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <p className="text-sm text-white/70">Total Users</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalUsers?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <p className="text-sm text-white/70">Pending Requests</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalExchangeRequests?.toLocaleString() || '0'}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminStatsWidget;
