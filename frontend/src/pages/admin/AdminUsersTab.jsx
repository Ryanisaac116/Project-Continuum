import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import AdminActivityPanel from '../../components/admin/AdminActivityPanel';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { useDialog } from '../../context/DialogContext';
import { Button } from '@/components/ui/button';
import { X, UserX, UserCheck, Activity, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

const StatusBadge = ({ active }) => (
    <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${active
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            }`}
    >
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
        {active ? 'Active' : 'Inactive'}
    </span>
);

const RoleBadge = ({ role }) => (
    <span
        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${role === 'ADMIN'
            ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-md shadow-purple-500/20 border border-white/10'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
    >
        {role}
    </span>
);

const PresenceBadge = ({ status }) => {
    const styles = {
        ONLINE: 'bg-emerald-500',
        AWAY: 'bg-yellow-500',
        OFFLINE: 'bg-gray-400',
    };

    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className={`w-2 h-2 rounded-full ${styles[status] || styles.OFFLINE}`} />
            {status}
        </span>
    );
};

const AdminUsersTab = () => {
    const navigate = useNavigate();
    const dialog = useDialog();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [actionLoading, setActionLoading] = useState(null);
    const [viewingActivityUser, setViewingActivityUser] = useState(null);

    const fetchUsers = useCallback(async ({ showLoader = false, showError = true } = {}) => {
        if (showLoader) {
            setLoading(true);
        }

        try {
            const { data } = await adminApi.getUsers(page, 20);
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            if (showError) {
                setError(err.response?.data?.message || 'Failed to load users');
            } else {
                console.error('Failed to silently refresh users:', err);
            }
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, [page]);

    useEffect(() => {
        fetchUsers({ showLoader: true });
    }, [fetchUsers]);

    useLiveRefresh({
        refresh: () => fetchUsers({ showLoader: false, showError: false }),
        events: ['all', 'friend', 'session', 'match', 'connection'],
        runOnMount: false,
        minIntervalMs: 2500,
        pollIntervalMs: 10000,
    });

    const handleDeactivate = async (userId, userName) => {
        const ok = await dialog.confirm('Deactivate User', `Deactivate user "${userName}"? They won't be able to login.`, 'Deactivate', 'destructive');
        if (!ok) return;

        setActionLoading(userId);
        try {
            await adminApi.deactivateUser(userId);
            fetchUsers({ showLoader: false });
            setActionLoading(null);
        } catch (err) {
            setActionLoading(null);
            await dialog.alert('Error', err.response?.data?.message || 'Failed to deactivate user');
        }
    };

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {users.length} users on this page
                </span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Presence
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4" colSpan={5}>
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge active={user.active} />
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <PresenceBadge status={user.presenceStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {user.active && user.role !== 'ADMIN' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeactivate(user.id, user.name)}
                                                        disabled={actionLoading === user.id}
                                                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <UserX className="w-4 h-4 mr-1.5" />
                                                        {actionLoading === user.id ? 'Processing...' : 'Deactivate'}
                                                    </Button>
                                                )}
                                                {!user.active && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            const ok = await dialog.confirm('Reactivate User', `Reactivate user "${user.name}"?`);
                                                            if (!ok) return;
                                                            setActionLoading(user.id);
                                                            try {
                                                                await adminApi.reactivateUser(user.id);
                                                                fetchUsers({ showLoader: false });
                                                                setActionLoading(null);
                                                            } catch (err) {
                                                                setActionLoading(null);
                                                                await dialog.alert('Error', 'Failed to reactivate user');
                                                            }
                                                        }}
                                                        disabled={actionLoading === user.id}
                                                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-1.5" />
                                                        {actionLoading === user.id ? 'Processing...' : 'Reactivate'}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setViewingActivityUser(user.id)}
                                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                    <Activity className="w-4 h-4 mr-1.5" />
                                                    Activity
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/chat/${user.id}`)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-1.5" />
                                                    Message
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page {page + 1} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>

            {viewingActivityUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Activity</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Detailed logs and statistics</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingActivityUser(null)}
                                className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar">
                            <AdminActivityPanel userId={viewingActivityUser} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersTab;
