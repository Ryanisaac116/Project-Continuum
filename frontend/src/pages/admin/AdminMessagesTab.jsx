import React, { useEffect, useState } from 'react';
import { supportApi } from '../../api/supportApi';
import { addListener } from '../../ws/chatSocket';
import { useNotifications } from '../../context/NotificationContext';
import { useDialog } from '../../context/DialogContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronLeft, ChevronRight, Inbox, MessageSquare, Loader2 } from 'lucide-react';

const AdminMessagesTab = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const { addToast } = useNotifications();
    const dialog = useDialog();

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data } = await supportApi.getMessages(page);
            setMessages(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error('Failed to load messages', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [page]);

    // Listen for real-time admin messages
    useEffect(() => {
        const handleNewMessage = (msg) => {
            console.log('[AdminMessagesTab] Received real-time message:', msg);
            setMessages(prev => [msg, ...prev]);
            addToast('New Support Message', `${msg.subject} (${msg.sender?.name})`, 'INFO');
        };

        const unsubscribe = addListener('adminMessage', handleNewMessage);
        return () => unsubscribe();
    }, [addToast]);

    const handleResolve = async (id) => {
        try {
            await supportApi.resolveMessage(id);
            fetchMessages(); // Refresh
        } catch (err) {
            await dialog.alert('Error', 'Failed to resolve message');
        }
    };

    const getStatusBadge = (status) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${status === 'OPEN'
            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
            {status}
        </span>
    );

    const getTypeBadge = (type) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${type === 'REPORT'
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            }`}>
            {type}
        </span>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Support & Reports</h2>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sender</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-500">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Loading messages...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : messages.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Inbox className="w-8 h-8" />
                                            <span>No messages found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{getTypeBadge(msg.type)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {msg.sender?.name || `User ${msg.sender?.id}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{msg.subject}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{msg.message}</p>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {msg.status === 'OPEN' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleResolve(msg.id)}
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                                    Resolve
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </Button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Page {page + 1} of {totalPages || 1}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdminMessagesTab;
