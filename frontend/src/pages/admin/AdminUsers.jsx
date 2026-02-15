import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { useDialog } from '../../context/DialogContext';
import { Button } from '@/components/ui/button';
import { UserX, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const StatusBadge = ({ active }) => (
    <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${active
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            }`}
    >
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
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

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [actionLoading, setActionLoading] = useState(null);
    const dialog = useDialog();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminApi.getUsers(page, 20);
            setUsers(data.content);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeactivate = async (userId, userName) => {
        const ok = await dialog.confirm('Deactivate User', `Deactivate user "${userName}"? They won't be able to login.`, 'Deactivate', 'destructive');
        if (!ok) return;

        setActionLoading(userId);
        try {
            await adminApi.deactivateUser(userId);
            fetchUsers(); // Refresh the list
            setActionLoading(null);
        } catch (err) {
            setActionLoading(null);
            await dialog.alert('Error', err.response?.data?.message || 'Failed to deactivate user');
        }
    };

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

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                                    <td className="px-6 py-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge active={user.active} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <PresenceBadge status={user.presenceStatus} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
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
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
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
        </div>
    );
};

export default AdminUsers;
