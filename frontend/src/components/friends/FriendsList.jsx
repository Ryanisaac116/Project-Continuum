import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PresenceBadge from '../ui/PresenceBadge';
import apiClient from '../../api/client';
import SupportModal from '../support/SupportModal';
import { useDialog } from '../../context/DialogContext';
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertTriangle } from 'lucide-react';

/**
 * FriendsList - Display accepted friends with presence
 * 
 * Mobile-responsive design with touch-friendly buttons
 */
const FriendsList = ({ friends }) => {
    const navigate = useNavigate();
    const [reportUser, setReportUser] = useState(null);
    const dialog = useDialog();

    const handleCall = async (e, friendId) => {
        e.stopPropagation(); // Prevent row click
        try {
            await apiClient.post('/calls/friend/initiate', { receiverId: friendId });
            // CallOverlay will handle the CALL_RINGING event
        } catch (err) {
            console.error('Failed to initiate call:', err);
            await dialog.alert('Error', err.response?.data?.message || 'Failed to start call');
        }
    };

    if (!friends || friends.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
                No friends yet. Complete exchanges and send friend requests!
            </div>
        );
    }

    return (
        <>
            <ul className="divide-y divide-gray-200 dark:divide-slate-800">
                {friends.map((friend) => {
                    const isOnline = friend.presenceStatus === 'ONLINE';
                    const isInSession = friend.presenceStatus === 'IN_SESSION';
                    const canCall = isOnline && !isInSession;

                    return (
                        <li
                            key={friend.friendUserId}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                        >
                            {/* User Info - Tap to chat on mobile */}
                            <div
                                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer group"
                                onClick={() => navigate(`/chat/${friend.friendUserId}`)}
                            >
                                {/* Avatar */}
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-lg group-hover:scale-105 transition-transform">
                                    {friend.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                        <span>{friend.name}</span>
                                        {friend.role === 'ADMIN' && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-sm shrink-0">
                                                ADMIN
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <PresenceBadge
                                            status={friend.presenceStatus}
                                            lastSeenAt={friend.lastSeenAt}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons - Always visible */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                {/* Call Button - Only for ONLINE users */}
                                <Button
                                    size="sm"
                                    onClick={(e) => handleCall(e, friend.friendUserId)}
                                    disabled={!canCall}
                                    className={cn(
                                        "gap-2",
                                        canCall ? "bg-green-600 hover:bg-green-700" : "opacity-50"
                                    )}
                                    title={
                                        isInSession ? 'User is in a session'
                                            : !isOnline ? 'User is offline'
                                                : 'Start a call'
                                    }
                                >
                                    <span>📞</span>
                                    <span className="hidden sm:inline">Call</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/chat/${friend.friendUserId}`);
                                    }}
                                    className="gap-2"
                                >
                                    <span className="sm:hidden">💬</span>
                                    <span className="hidden sm:inline">Chat</span>
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReportUser(friend);
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                    title="Report User"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                </Button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <SupportModal
                isOpen={!!reportUser}
                onClose={() => setReportUser(null)}
                type="REPORT"
                initialSubject={`Reporting user: ${reportUser?.name}`}
                relatedEntity={reportUser ? { type: 'USER', id: reportUser.friendUserId } : null}
            />
        </>
    );
};

export default FriendsList;
