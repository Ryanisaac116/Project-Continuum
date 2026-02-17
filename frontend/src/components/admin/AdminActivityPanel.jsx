import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const AdminActivityPanel = ({ userId }) => {
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchActivity = useCallback(async ({ background = false } = {}) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const { data } = await adminApi.getUserActivity(userId);
            setActivity(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load user activity:', err);
            setError(err.response?.data?.message || 'Failed to load user activity');
        } finally {
            if (background) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, [userId]);

    useEffect(() => {
        setActivity(null);
        setError(null);
        setLoading(true);
        fetchActivity();
    }, [fetchActivity]);

    useLiveRefresh({
        refresh: () => fetchActivity({ background: true }),
        events: ['all', 'session', 'match', 'friend', 'connection'],
        runOnMount: false,
        minIntervalMs: 2500,
        pollIntervalMs: 12000,
    });

    return (
        <div className="mt-6 border border-red-200 dark:border-red-900/30 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg shadow-red-900/5">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-purple-700 text-white font-medium">
                <div className="flex items-center gap-2">
                    <span className="bg-white/20 p-1 rounded text-xs">ADMIN</span>
                    <span>Admin Activity View</span>
                </div>
                {refreshing && <span className="text-xs opacity-80 animate-pulse">Refreshing...</span>}
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : !activity ? (
                    <p className="text-gray-500 dark:text-gray-400">No data present.</p>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Account Created</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {new Date(activity.accountCreated).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Last Seen</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {activity.lastLogin ? new Date(activity.lastLogin).toLocaleString() : 'Never'}
                                </p>
                            </div>
                        </div>

                        {/* Engagement Stats */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Engagement Stats</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg text-center">
                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{activity.messagesSent}</div>
                                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Messages</div>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg text-center">
                                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{activity.friendsCount}</div>
                                    <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Friends</div>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg text-center">
                                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{activity.sessionsCompleted}</div>
                                    <div className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">Sessions</div>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg text-center">
                                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                        {activity.teachingSkills}<span className="text-sm font-normal opacity-60 mx-1">/</span>{activity.learningSkills}
                                    </div>
                                    <div className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">Teach/Learn</div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivityPanel;
