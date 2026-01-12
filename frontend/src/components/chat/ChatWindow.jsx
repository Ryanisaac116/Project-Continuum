import { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/Badge';
import chatApi from '../../api/chat';
import {
    connectChatSocket,
    sendChatMessage,
    disconnectChatSocket,
    isChatConnected
} from '../../ws/chatSocket';

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
                const token = localStorage.getItem('token');
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                            {friend.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{friend.name}</div>
                            <Badge status={friend.presenceStatus}>{friend.presenceStatus || 'OFFLINE'}</Badge>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                    >
                        ×
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                        <div className="text-center text-gray-500">Loading messages...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">{error}</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            No messages yet. Say hello! 👋
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe
                                            ? 'bg-black text-white rounded-br-md'
                                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                            }`}
                                    >
                                        <div className="text-sm">{msg.content}</div>
                                        <div
                                            className={`text-xs mt-1 ${isMe ? 'text-gray-300' : 'text-gray-400'
                                                }`}
                                        >
                                            {formatTime(msg.sentAt)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                            disabled={!socketConnected}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !socketConnected}
                            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            Send
                        </button>
                    </div>
                    {!socketConnected && (
                        <div className="text-xs text-orange-500 mt-1">Connecting...</div>
                    )}
                </form>
            </div>
        </div>
    );
};

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default ChatWindow;
