import { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/Badge';
import chatApi from '../../api/chat';
import { getToken } from '../../api/client';
import {
    connectChatSocket,
    sendChatMessage,
    disconnectChatSocket,
    isChatConnected
} from '../../ws/chatSocket';
import { formatTime } from '../../utils/dateUtils';

// ... (component code)


/**
 * ChatWindow - Modal-style chat interface
 * 
 * Features:
 * - Fetches chat history on open
 * - Real-time message delivery via WebSocket
 * - Sender-aligned message bubbles
 * - Timestamps
 * 
 * Props:
 * - friend: { friendUserId, name, presenceStatus } (matches backend FriendResponse)
 * - currentUserId: number
 * - onClose: () => void
 */
const ChatWindow = ({ friend, currentUserId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch chat history and connect WebSocket
    useEffect(() => {
        const initChat = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch chat history
                const response = await chatApi.getChatHistory(friend.friendUserId);
                setMessages(response.data);

                // Connect WebSocket for real-time messages
                const token = getToken();
                if (token && !isChatConnected()) {
                    connectChatSocket(
                        token,
                        (msg) => {
                            // Only add messages from/to this friend
                            if (msg.senderId === friend.friendUserId || msg.recipientId === friend.friendUserId) {
                                setMessages((prev) => {
                                    // Avoid duplicates
                                    if (prev.some((m) => m.id === msg.id)) return prev;
                                    return [...prev, msg];
                                });
                            }
                        },
                        () => setSocketConnected(true),
                        (err) => console.error('Chat socket error:', err)
                    );
                } else if (isChatConnected()) {
                    setSocketConnected(true);
                }
            } catch (err) {
                console.error('Failed to load chat:', err);
                setError('Failed to load chat history');
            } finally {
                setLoading(false);
            }
        };

        initChat();

        // Cleanup on unmount
        return () => {
            // Don't disconnect socket on close - other components may need it
            // disconnectChatSocket();
        };
    }, [friend.friendUserId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketConnected) return;

        sendChatMessage(friend.friendUserId, newMessage.trim());
        setNewMessage('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col border border-gray-200 dark:border-slate-800 transition-colors">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-500 font-medium border border-green-200 dark:border-green-500/20">
                            {friend.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{friend.name}</div>
                            <Badge status={friend.presenceStatus}>{friend.presenceStatus || 'OFFLINE'}</Badge>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-2xl font-light"
                    >
                        ×
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-black/30 transition-colors">
                    {loading ? (
                        <div className="text-center text-gray-500 dark:text-slate-500">Loading messages...</div>
                    ) : error ? (
                        <div className="text-center text-red-500 dark:text-red-400">{error}</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-slate-500 py-10">
                            No messages yet. Say hello! 👋
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            const isDeleted = isMe ? msg.deletedForSender : msg.deletedForReceiver;
                            const isDeletedGlobally = msg.deletedGlobally;
                            if (isDeleted && !isDeletedGlobally) return null;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 rounded-bl-md shadow-sm border border-gray-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <div className="text-sm">{msg.content}</div>
                                        <div
                                            className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'
                                                }`}
                                        >
                                            {formatTime(msg.sentAt)}
                                            {/* Status Ticks */}
                                            {isMe && !isDeleted && (
                                                <span className="ml-1 inline-flex">
                                                    {msg.seenAt ? (
                                                        // Seen: Bright Cyan
                                                        <span className="text-cyan-300 drop-shadow-sm" title={`Seen at ${formatTime(msg.seenAt)}`}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M17 6L9.5 13.5L7 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M22 6L14.5 13.5L12 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </span>
                                                    ) : msg.deliveredAt ? (
                                                        // Delivered: Pure White
                                                        <span className="text-white drop-shadow-sm" title={`Delivered at ${formatTime(msg.deliveredAt)}`}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M17 6L9.5 13.5L7 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M22 6L14.5 13.5L12 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </span>
                                                    ) : (
                                                        // Sent: Faded Blue-White
                                                        <span className="text-blue-200/60" title="Sent">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-slate-800 transition-colors">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 dark:placeholder:text-slate-500 transition-colors"
                            disabled={!socketConnected}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !socketConnected}
                            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition transform active:scale-95"
                        >
                            Send
                        </button>
                    </div>
                    {!socketConnected && (
                        <div className="text-xs text-orange-500 dark:text-orange-500 mt-1">Connecting...</div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
