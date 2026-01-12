import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PresenceBadge from '../components/ui/PresenceBadge';
import { useAuth } from '../auth/AuthContext';
import chatApi from '../api/chat';
import friendsApi from '../api/friends';
import apiClient from '../api/client';
import {
    connectChatSocket,
    sendChatMessage,
    isChatConnected,
    subscribeToPresence,
    updateMessageCallback
} from '../ws/chatSocket';


// Icons
const BackIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const SendIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CopyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const ReplyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
);

const MoreIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

/**
 * ChatPage - Platform-aligned chat with tap-to-select
 */
const ChatPage = () => {
    const { friendId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [friend, setFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Reply state
    const [replyingTo, setReplyingTo] = useState(null);

    // Long-press state
    const longPressTimerRef = useRef(null);
    const LONG_PRESS_DURATION = 600; // ms

    // 3-dot menu state
    const [showChatMenu, setShowChatMenu] = useState(false);
    const chatMenuRef = useRef(null);

    // Swipe-to-reply state
    const swipeStartRef = useRef({ x: 0, y: 0, msgId: null, msg: null });
    const [swipeOffset, setSwipeOffset] = useState({}); // { msgId: offsetX }
    const SWIPE_THRESHOLD = 60; // px to trigger reply

    // Scroll-to-message highlight state
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const messagesContainerRef = useRef(null);

    const messagesEndRef = useRef(null);
    const deleteMenuRef = useRef(null);

    // Close delete menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (deleteMenuRef.current && !deleteMenuRef.current.contains(e.target)) {
                setShowDeleteMenu(false);
            }
            if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
                setShowChatMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleIncomingMessage = useCallback((msg) => {
        // Only process messages for this chat
        if (
            msg.senderId === Number(friendId) ||
            msg.recipientId === Number(friendId)
        ) {
            setMessages((prev) => {
                const existingIndex = prev.findIndex((m) => m.id === msg.id);

                if (existingIndex >= 0) {
                    // Update existing message (edit or delete)
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...prev[existingIndex],
                        ...msg, // Merge all fields from the update
                    };
                    return updated;
                }

                // New message - add to end
                return [...prev, msg];
            });
        }
    }, [friendId]);

    // Fetch friend info and chat history
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setError(null);

            try {
                const friendsRes = await friendsApi.getFriends();
                const friendData = friendsRes.data.find(
                    (f) => f.friendUserId === Number(friendId)
                );

                if (!friendData) {
                    setError('Friend not found');
                    setLoading(false);
                    return;
                }

                setFriend(friendData);

                // Fetch fresh presence directly
                try {
                    const presenceRes = await apiClient.get(`/presence/${friendId}`);
                    setFriend(prev => ({
                        ...prev,
                        presenceStatus: presenceRes.data.status,
                        lastSeenAt: presenceRes.data.lastSeenAt
                    }));
                } catch (err) {
                    console.log('Could not fetch presence:', err);
                }

                const historyRes = await chatApi.getChatHistory(friendId);
                setMessages(historyRes.data);

                const token = localStorage.getItem('token');
                if (token && !isChatConnected()) {
                    connectChatSocket(
                        token,
                        handleIncomingMessage,
                        () => setSocketConnected(true),
                        (err) => console.error('Chat socket error:', err)
                    );
                } else if (isChatConnected()) {
                    setSocketConnected(true);
                }
            } catch (err) {
                console.error('Failed to load chat:', err);
                setError('Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [friendId, handleIncomingMessage]);

    // Keep WebSocket callback in sync when friendId changes
    useEffect(() => {
        if (socketConnected) {
            updateMessageCallback(handleIncomingMessage);
        }
    }, [handleIncomingMessage, socketConnected]);

    // Subscribe to presence updates
    useEffect(() => {

        if (!friendId || !socketConnected) return;

        const unsubscribe = subscribeToPresence(Number(friendId), (presenceUpdate) => {
            setFriend((prev) => prev ? {
                ...prev,
                presenceStatus: presenceUpdate.status,
                lastSeenAt: presenceUpdate.lastSeenAt
            } : prev);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [friendId, socketConnected]);

    // Refresh presence every 15 seconds
    useEffect(() => {
        if (!friendId) return;

        const refreshPresence = async () => {
            try {
                const res = await apiClient.get(`/presence/${friendId}`);
                setFriend((prev) => prev ? {
                    ...prev,
                    presenceStatus: res.data.status,
                    lastSeenAt: res.data.lastSeenAt
                } : prev);
            } catch (err) {
                // Ignore
            }
        };

        const interval = setInterval(refreshPresence, 15000);
        return () => clearInterval(interval);
    }, [friendId]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketConnected) return;

        sendChatMessage(Number(friendId), newMessage.trim(), replyingTo?.id);
        setNewMessage('');
        setReplyingTo(null);
    };

    // Long-press handlers for selection
    const handlePressStart = (msgId, isDeletedForBoth) => {
        if (isDeletedForBoth || editingId) return;

        longPressTimerRef.current = setTimeout(() => {
            // Vibrate on mobile if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(msgId)) {
                    next.delete(msgId);
                } else {
                    next.add(msgId);
                }
                return next;
            });
            setShowDeleteMenu(false);
        }, LONG_PRESS_DURATION);
    };

    const handlePressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    // Cancel long-press on scroll/move
    const handlePressCancel = () => {
        handlePressEnd();
    };

    // Quick tap in selection mode toggles selection
    const handleQuickTap = (e, msgId, isDeletedForBoth) => {
        e.stopPropagation();
        if (isDeletedForBoth || editingId) return;

        // Only toggle if already in selection mode
        if (selectedIds.size > 0) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(msgId)) {
                    next.delete(msgId);
                } else {
                    next.add(msgId);
                }
                return next;
            });
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setShowDeleteMenu(false);
        setReplyingTo(null);
    };

    // Reply handler - select single message to reply
    const handleReply = () => {
        if (selectedIds.size !== 1) return;
        const msgId = [...selectedIds][0];
        const msg = messages.find(m => m.id === msgId);
        if (msg) {
            setReplyingTo(msg);
            clearSelection();
        }
    };

    // Swipe-to-reply handlers
    const handleSwipeStart = (e, msg) => {
        if (selectedIds.size > 0 || editingId) return;
        const touch = e.touches?.[0] || e;
        swipeStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            msgId: msg.id,
            msg: msg
        };
    };

    const handleSwipeMove = (e) => {
        const start = swipeStartRef.current;
        if (!start.msgId) return;

        const touch = e.touches?.[0] || e;
        const deltaX = touch.clientX - start.x;
        const deltaY = Math.abs(touch.clientY - start.y);

        // Cancel if scrolling vertically
        if (deltaY > 30) {
            swipeStartRef.current = { x: 0, y: 0, msgId: null, msg: null };
            setSwipeOffset({});
            return;
        }

        // Only allow right swipe (positive deltaX) - max 80px
        const offset = Math.max(0, Math.min(deltaX, 80));
        if (offset > 0) {
            e.preventDefault(); // Prevent scroll
        }
        setSwipeOffset({ [start.msgId]: offset });
    };

    const handleSwipeEnd = () => {
        const start = swipeStartRef.current;
        if (!start.msgId) return;

        const offset = swipeOffset[start.msgId] || 0;

        // Trigger reply if swipe exceeds threshold
        if (offset >= SWIPE_THRESHOLD && start.msg) {
            setReplyingTo(start.msg);
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        }

        // Reset
        swipeStartRef.current = { x: 0, y: 0, msgId: null, msg: null };
        setSwipeOffset({});
    };

    // Scroll to a specific message (for reply quote clicks)
    const scrollToMessage = (messageId) => {
        if (!messageId || !messagesContainerRef.current) return;

        const messageEl = messagesContainerRef.current.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight briefly
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
    };

    // Get selected messages info
    const selectedMessages = messages.filter((m) => selectedIds.has(m.id));
    const allSelectedAreMine = selectedMessages.every((m) => m.senderId === user?.id);
    const canEdit = selectedIds.size === 1 && allSelectedAreMine;
    const canDelete = selectedIds.size > 0;

    // Edit handlers
    const startEdit = () => {
        if (!canEdit) return;
        const msg = selectedMessages[0];
        setEditingId(msg.id);
        setEditContent(msg.content);
        clearSelection();
    };

    const handleEdit = async () => {
        if (!editContent.trim() || !editingId) return;

        try {
            await chatApi.editMessage(editingId, editContent.trim());
            setEditingId(null);
            setEditContent('');
        } catch (err) {
            console.error('Failed to edit message:', err);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    // Delete handlers
    const handleDelete = async (mode) => {
        setShowDeleteMenu(false);

        // Optimistic update - immediately update UI
        const idsToDelete = [...selectedIds];
        setMessages((prev) => prev.map((msg) => {
            if (idsToDelete.includes(msg.id)) {
                const isSender = msg.senderId === user?.id;
                if (mode === 'BOTH') {
                    return { ...msg, isDeletedForSender: true, isDeletedForReceiver: true };
                } else {
                    return isSender
                        ? { ...msg, isDeletedForSender: true }
                        : { ...msg, isDeletedForReceiver: true };
                }
            }
            return msg;
        }));

        // Make API calls
        for (const msgId of idsToDelete) {
            try {
                await chatApi.deleteMessage(msgId, mode);
            } catch (err) {
                console.error('Failed to delete message:', err);
                // Could revert optimistic update here if needed
            }
        }

        clearSelection();
    };

    const copySelected = async () => {
        const text = selectedMessages.map((m) => m.content).join('\n');
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        clearSelection();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading chat...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="text-red-500 mb-4 text-center">{error}</div>
                <button
                    onClick={() => navigate('/friends')}
                    className="text-gray-900 hover:underline flex items-center gap-2"
                >
                    <BackIcon /> Back to Friends
                </button>
            </div>
        );
    }

    const isSelectionMode = selectedIds.size > 0;

    return (
        <div className="h-screen flex flex-col bg-gray-100" style={{ height: '100dvh' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black text-white shadow-md">
                {isSelectionMode ? (
                    // Selection Action Bar
                    <div className="px-2 sm:px-3 py-2 sm:py-3 flex items-center gap-1 sm:gap-3">
                        <button
                            onClick={clearSelection}
                            className="p-3 sm:p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                        >
                            <CloseIcon />
                        </button>
                        <span className="font-medium flex-1 text-base sm:text-lg">
                            {selectedIds.size} selected
                        </span>

                        <button
                            onClick={copySelected}
                            className="p-3 sm:p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                            title="Copy"
                        >
                            <CopyIcon />
                        </button>

                        {/* Reply - only for single message selection */}
                        {selectedIds.size === 1 && (
                            <button
                                onClick={handleReply}
                                className="p-3 sm:p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                                title="Reply"
                            >
                                <ReplyIcon />
                            </button>
                        )}

                        {canEdit && (
                            <button
                                onClick={startEdit}
                                className="p-3 sm:p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                                title="Edit"
                            >
                                <EditIcon />
                            </button>
                        )}

                        {canDelete && (
                            <div className="relative" ref={deleteMenuRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteMenu(!showDeleteMenu);
                                    }}
                                    className="p-3 sm:p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                                    title="Delete"
                                >
                                    <TrashIcon />
                                </button>

                                {showDeleteMenu && (
                                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl py-1 min-w-[200px] z-20 text-gray-900">
                                        <button
                                            onClick={() => handleDelete('SELF')}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-100 active:bg-gray-200 text-sm"
                                        >
                                            Delete for me
                                        </button>
                                        {allSelectedAreMine && (
                                            <button
                                                onClick={() => handleDelete('BOTH')}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 active:bg-gray-200 text-sm text-red-600"
                                            >
                                                Delete for everyone
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // Normal Header
                    <div className="px-3 py-3 flex items-center gap-3">
                        <button
                            onClick={() => navigate('/friends')}
                            className="p-2 -ml-1 rounded-full hover:bg-white/10 active:bg-white/20"
                        >
                            <BackIcon />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                            {friend?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{friend?.name}</div>
                            <PresenceBadge
                                status={friend?.presenceStatus}
                                lastSeenAt={friend?.lastSeenAt}
                            />
                        </div>

                        {/* 3-dot Menu */}
                        <div className="relative" ref={chatMenuRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowChatMenu(!showChatMenu);
                                }}
                                className="p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                            >
                                <MoreIcon />
                            </button>

                            {showChatMenu && (
                                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl py-1 min-w-[180px] z-20 text-gray-900">
                                    <button
                                        onClick={async () => {
                                            setShowChatMenu(false);
                                            if (confirm('Clear all messages for you? This cannot be undone.')) {
                                                try {
                                                    await chatApi.clearChat(friendId);
                                                    setMessages([]);
                                                } catch (err) {
                                                    console.error('Failed to clear chat:', err);
                                                    alert('Failed to clear chat');
                                                }
                                            }
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-100 active:bg-gray-200 text-sm text-red-600"
                                    >
                                        Clear chat for me
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 py-3"
                onClick={() => {
                    if (selectedIds.size > 0) clearSelection();
                }}
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-white rounded-xl mt-4 shadow-sm">
                        No messages yet. Say hello! 👋
                    </div>
                ) : (() => {
                    // Filter to only visible messages for empty state check
                    const visibleMessages = messages.filter((m) => {
                        const isMe = m.senderId === user?.id;
                        const isDeleted = isMe ? m.isDeletedForSender : m.isDeletedForReceiver;
                        const isDeletedForBoth = m.isDeletedForSender && m.isDeletedForReceiver;
                        return !isDeleted || isDeletedForBoth;
                    });

                    if (visibleMessages.length === 0) {
                        return (
                            <div className="text-center text-gray-500 py-10 bg-white rounded-xl mt-4 shadow-sm">
                                No messages yet. Say hello! 👋
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-2">
                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === user?.id;
                                const isDeleted = isMe ? msg.isDeletedForSender : msg.isDeletedForReceiver;
                                const isDeletedForBoth = msg.isDeletedForSender && msg.isDeletedForReceiver;
                                const isSelected = selectedIds.has(msg.id);
                                const isEditing = editingId === msg.id;
                                const isHighlighted = highlightedMessageId === msg.id;

                                if (isDeleted && !isDeletedForBoth) {
                                    return null;
                                }

                                // Check if we need a day separator
                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                const showDateSeparator = !prevMsg || !isSameDay(msg.sentAt, prevMsg.sentAt);

                                const currentSwipeOffset = swipeOffset[msg.id] || 0;

                                return (
                                    <div key={msg.id}>
                                        {/* Day separator */}
                                        {showDateSeparator && (
                                            <div className="flex justify-center my-3">
                                                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full shadow-sm">
                                                    {formatDateSeparator(msg.sentAt)}
                                                </span>
                                            </div>
                                        )}
                                        <div
                                            data-message-id={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative transition-colors duration-300 ${isHighlighted
                                                ? 'bg-yellow-200/80 -mx-3 px-3 py-1.5 rounded-lg'
                                                : isSelected
                                                    ? 'bg-blue-200/80 -mx-3 px-3 py-1.5 rounded-lg ring-2 ring-blue-400'
                                                    : ''
                                                }`}
                                            style={{
                                                transform: currentSwipeOffset ? `translateX(${currentSwipeOffset}px)` : undefined,
                                                transition: currentSwipeOffset ? 'none' : 'transform 0.2s ease-out'
                                            }}
                                            // Swipe-to-reply (touch)
                                            onTouchStart={(e) => {
                                                handleSwipeStart(e, msg);
                                                handlePressStart(msg.id, isDeletedForBoth);
                                            }}
                                            onTouchMove={(e) => {
                                                handleSwipeMove(e);
                                                handlePressCancel();
                                            }}
                                            onTouchEnd={() => {
                                                handleSwipeEnd();
                                                handlePressEnd();
                                            }}
                                            onTouchCancel={() => {
                                                handleSwipeEnd();
                                                handlePressCancel();
                                            }}
                                            // Long-press for selection (mouse/desktop)
                                            onMouseDown={() => handlePressStart(msg.id, isDeletedForBoth)}
                                            onMouseUp={handlePressEnd}
                                            onMouseLeave={handlePressEnd}
                                            // Quick tap in selection mode
                                            onClick={(e) => handleQuickTap(e, msg.id, isDeletedForBoth)}
                                        >
                                            {/* Reply indicator on swipe */}
                                            {currentSwipeOffset > 20 && (
                                                <div
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 text-gray-400"
                                                    style={{ opacity: Math.min(currentSwipeOffset / SWIPE_THRESHOLD, 1) }}
                                                >
                                                    <ReplyIcon />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] px-4 py-2 rounded-2xl select-none transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''
                                                    } ${isDeletedForBoth
                                                        ? 'bg-gray-200 text-gray-500 italic'
                                                        : isMe
                                                            ? 'bg-black text-white'
                                                            : 'bg-white text-gray-900 shadow-sm'
                                                    }`}
                                            >
                                                {/* Reply quote if this is a reply - click to scroll to original */}
                                                {msg.replyToContent && !isDeletedForBoth && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            scrollToMessage(msg.replyToMessageId);
                                                        }}
                                                        className={`text-xs mb-2 pb-2 border-l-2 pl-2 cursor-pointer hover:opacity-80 ${isMe ? 'border-gray-400 text-gray-300' : 'border-blue-400 text-gray-500'
                                                            }`}
                                                    >
                                                        <div className="font-medium text-[10px] opacity-75">
                                                            {msg.replyToSenderId === user?.id ? 'You' : friend?.name}
                                                        </div>
                                                        <div className="truncate">{msg.replyToContent}</div>
                                                    </div>
                                                )}
                                                {isDeletedForBoth ? (
                                                    <div className="text-sm">🚫 This message was deleted</div>
                                                ) : isEditing ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border text-black text-sm"
                                                            autoFocus
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleEdit();
                                                                if (e.key === 'Escape') cancelEdit();
                                                            }}
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                                                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                                                                className="px-3 py-1.5 text-xs bg-black text-white rounded-full hover:bg-gray-800"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm break-words whitespace-pre-wrap">{msg.content}</div>
                                                        <div className={`text-xs mt-1 flex items-center gap-1 justify-end ${isMe ? 'text-gray-400' : 'text-gray-500'
                                                            }`}>
                                                            {msg.editedAt && <span className="italic">edited</span>}
                                                            <span>{formatTime(msg.sentAt)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {
                replyingTo && (
                    <div className="px-3 py-2 bg-gray-100 border-t border-l-4 border-l-blue-500 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-blue-600 font-medium">
                                Replying to {replyingTo.senderId === user?.id ? 'yourself' : friend?.name}
                            </div>
                            <div className="text-sm text-gray-600 truncate">{replyingTo.content}</div>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 rounded-full hover:bg-gray-200"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                )
            }

            {/* Input */}
            <form onSubmit={handleSend} className="sticky bottom-0 p-3 bg-white border-t">
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-black text-sm"
                        disabled={!socketConnected}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !socketConnected}
                        className="p-3 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition active:bg-gray-900"
                    >
                        <SendIcon />
                    </button>
                </div>
                {!socketConnected && (
                    <div className="text-xs text-orange-600 mt-1 text-center">Connecting...</div>
                )}
            </form>
        </div>
    );
};

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDateSeparator(timestamp) {
    if (!timestamp) return '';
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = msgDate.toDateString() === today.toDateString();
    const isYesterday = msgDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return msgDate.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
}

function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
}

export default ChatPage;
