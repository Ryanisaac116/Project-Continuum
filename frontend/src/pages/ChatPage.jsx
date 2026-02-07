import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PresenceBadge from '../components/ui/PresenceBadge';
import { useAuth } from '../auth/AuthContext';
import chatApi from '../api/chat';
import friendsApi from '../api/friends';
import apiClient, { getToken } from '../api/client';
import { formatTime, formatDateSeparator, isSameDay } from '../utils/dateUtils';
import {
    connectChatSocket,
    sendChatMessage,
    isChatConnected,
    subscribeToPresence,
    addListener
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

    // Desktop: Hover action bar
    const [hoveredMessageId, setHoveredMessageId] = useState(null);

    // Desktop: Right-click context menu
    const [contextMenu, setContextMenu] = useState(null); // { x, y, message }

    // Copy feedback with position
    const [copyFeedback, setCopyFeedback] = useState(null); // { x, y } or null

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
        // Close context menu on click
        const handleClickAnywhere = () => setContextMenu(null);

        // Escape key to clear selection
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                clearSelection();
                setContextMenu(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('click', handleClickAnywhere);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('click', handleClickAnywhere);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleIncomingMessage = useCallback((msg) => {
        // Handle Delivery/Seen Events
        if (msg.type === 'MESSAGE_DELIVERED' || msg.type === 'MESSAGE_SEEN') {
            setMessages((prev) => prev.map((m) => {
                if (m.id === msg.messageId) {
                    return {
                        ...m,
                        deliveredAt: msg.type === 'MESSAGE_DELIVERED' ? msg.deliveredAt : (m.deliveredAt || msg.seenAt),
                        seenAt: msg.type === 'MESSAGE_SEEN' ? msg.seenAt : m.seenAt
                    };
                }
                return m;
            }));
            return;
        }

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

    // Visibility Tracking (Seen Status)
    const observerRef = useRef(null);
    useEffect(() => {
        if (messages.length === 0 || !user) return;

        // Disconnect previous observer
        if (observerRef.current) observerRef.current.disconnect();

        const pendingUpdates = new Set();
        let timeout = null;

        const processUpdates = () => {
            if (pendingUpdates.size > 0) {
                chatApi.markMessagesSeen(Array.from(pendingUpdates));
                pendingUpdates.clear();
            }
        };

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const msgId = Number(entry.target.dataset.messageId);
                    const msg = messages.find(m => m.id === msgId);

                    // Mark as seen if: NOT me, AND not already seen
                    if (msg && msg.senderId !== user.id && !msg.seenAt) {
                        pendingUpdates.add(msgId);

                        // Debounce updates
                        if (timeout) clearTimeout(timeout);
                        timeout = setTimeout(processUpdates, 1000);
                    }
                }
            });
        }, { threshold: 0.5 }); // 50% visible

        // Observe all message elements
        const messageElements = document.querySelectorAll('[data-message-id]');
        messageElements.forEach(el => observerRef.current.observe(el));

        return () => {
            if (timeout) clearTimeout(timeout);
            processUpdates(); // flush remaining
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [messages, user]);

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

                const token = getToken();
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

    // Keep WebSocket listener in sync using robust addListener pattern
    useEffect(() => {
        if (socketConnected) {
            // Use addListener instead of updateMessageCallback to avoid overwriting other listeners
            const unsubscribe = addListener('message', handleIncomingMessage);
            return () => unsubscribe();
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
                    // Update: set deletedGlobally for optimistic update
                    return { ...msg, isDeletedGlobally: true };
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

        // Get position of first selected message for toast
        const firstMsgId = [...selectedIds][0];
        const msgEl = document.querySelector(`[data-message-id="${firstMsgId}"]`);
        const rect = msgEl?.getBoundingClientRect();
        // Position beside the message: use center of message vertically
        const pos = rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, isRight: rect.left > window.innerWidth / 2 }
            : { x: window.innerWidth / 2, y: 100, isRight: false };

        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback for mobile/older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        setCopyFeedback(pos);
        setTimeout(() => setCopyFeedback(null), 1500);
        clearSelection();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-black transition-colors">
                <div className="text-gray-500 dark:text-slate-500">Loading chat...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-4 transition-colors">
                <div className="text-red-500 dark:text-red-400 mb-4 text-center">{error}</div>
                <button
                    onClick={() => navigate('/friends')}
                    className="text-gray-900 dark:text-white hover:underline flex items-center gap-2"
                >
                    <BackIcon /> Back to Friends
                </button>
            </div>
        );
    }

    const isSelectionMode = selectedIds.size > 0;

    return (
        <div className="flex flex-col h-full min-h-0 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">

            {/* Copy feedback toast - positioned beside message */}
            {copyFeedback && (
                <div
                    className="fixed bg-black text-white px-3 py-1.5 rounded-full shadow-lg z-50 text-sm pointer-events-none animate-pulse"
                    style={{
                        left: copyFeedback.isRight ? copyFeedback.x - 140 : copyFeedback.x + 60,
                        top: copyFeedback.y,
                        transform: 'translateY(-50%)'
                    }}
                >
                    ✓ Copied!
                </div>
            )}
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-black text-gray-900 dark:text-white shadow-md border-b border-gray-200 dark:border-gray-800 transition-colors">
                {isSelectionMode ? (
                    // Selection Action Bar
                    <div className="px-2 sm:px-3 py-2 sm:py-3 flex items-center gap-1 sm:gap-3">
                        <button
                            onClick={clearSelection}
                            className="p-3 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
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
                                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[200px] z-20 text-gray-900 dark:text-white">
                                        <button
                                            onClick={() => handleDelete('SELF')}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 text-sm"
                                        >
                                            Delete for me
                                        </button>
                                        {allSelectedAreMine && (
                                            <button
                                                onClick={() => handleDelete('BOTH')}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 text-sm text-red-500 dark:text-red-400"
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
                            className="p-2 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
                        >
                            <BackIcon />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-white font-medium border border-gray-300 dark:border-slate-600">
                            {friend?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-gray-900 dark:text-white">{friend?.name}</div>
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
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
                            >
                                <MoreIcon />
                            </button>

                            {showChatMenu && (
                                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[180px] z-20 text-gray-900 dark:text-white">
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
                                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 text-sm text-red-500 dark:text-red-400"
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
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3"
                onClick={() => {
                    if (selectedIds.size > 0) clearSelection();
                }}
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-slate-500 py-10 bg-white/50 dark:bg-slate-900/50 rounded-xl mt-4 shadow-sm border border-gray-200 dark:border-slate-800">
                        No messages yet. Say hello! 👋
                    </div>
                ) : (() => {
                    // Filter to only visible messages for empty state check
                    const visibleMessages = messages.filter((m) => {
                        const isMe = m.senderId === user?.id;
                        const isDeleted = isMe ? m.isDeletedForSender : m.isDeletedForReceiver;
                        const isDeletedGlobally = m.isDeletedGlobally;
                        // Show if not deleted for me, OR if deleted globally (tombstone)
                        return !isDeleted || isDeletedGlobally;
                    });

                    if (visibleMessages.length === 0) {
                        return (
                            <div className="text-center text-gray-500 dark:text-slate-500 py-10 bg-white/50 dark:bg-slate-900/50 rounded-xl mt-4 shadow-sm border border-gray-200 dark:border-slate-800">
                                No messages yet. Say hello! 👋
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-2">
                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === user?.id;
                                const isDeleted = isMe ? msg.deletedForSender : msg.deletedForReceiver;
                                const isDeletedGlobally = msg.deletedGlobally;
                                const isSelected = selectedIds.has(msg.id);
                                const isEditing = editingId === msg.id;
                                const isHighlighted = highlightedMessageId === msg.id;

                                if (isDeleted && !isDeletedGlobally) {
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
                                                <span className="px-3 py-1 bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs rounded-full shadow-sm border border-gray-300 dark:border-slate-700 transition-colors">
                                                    {formatDateSeparator(msg.sentAt)}
                                                </span>
                                            </div>
                                        )}
                                        <div
                                            data-message-id={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative transition-colors duration-300 ${isHighlighted
                                                ? 'bg-blue-900/40 -mx-3 px-3 py-1.5 rounded-lg'
                                                : isSelected
                                                    ? 'bg-blue-900/30 -mx-3 px-3 py-1.5 rounded-lg ring-1 ring-blue-500/50'
                                                    : ''
                                                }`}
                                            style={{
                                                transform: currentSwipeOffset ? `translateX(${currentSwipeOffset}px)` : undefined,
                                                transition: currentSwipeOffset ? 'none' : 'transform 0.2s ease-out'
                                            }}
                                            // Swipe-to-reply (touch)
                                            onTouchStart={(e) => {
                                                handleSwipeStart(e, msg);
                                                handlePressStart(msg.id, isDeletedGlobally);
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
                                            // Desktop: Hover for action bar
                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                            onMouseLeave={() => setHoveredMessageId(null)}
                                            // Desktop: Right-click context menu
                                            onContextMenu={(e) => {
                                                if (!isDeletedGlobally) {
                                                    e.preventDefault();
                                                    setContextMenu({ x: e.clientX, y: e.clientY, message: msg, isMe });
                                                }
                                            }}
                                            // Long-press for selection (mouse/desktop)
                                            onMouseDown={() => handlePressStart(msg.id, isDeletedGlobally)}
                                            onMouseUp={handlePressEnd}
                                            // Quick tap in selection mode
                                            onClick={(e) => handleQuickTap(e, msg.id, isDeletedGlobally)}
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

                                            {/* Desktop: Hover action bar (hidden on touch devices) */}
                                            {hoveredMessageId === msg.id && !isDeletedGlobally && !isEditing && (
                                                <div
                                                    className={`absolute top-0 hidden md:flex items-center gap-1 bg-white dark:bg-slate-800 shadow-lg rounded-full px-2 py-1 border border-gray-200 dark:border-slate-700 z-10 transition-colors ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(msg);
                                                            setHoveredMessageId(null);
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                                        title="Reply"
                                                    >
                                                        <ReplyIcon />
                                                    </button>
                                                    {isMe && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(msg.id);
                                                                setEditContent(msg.content);
                                                                setHoveredMessageId(null);
                                                            }}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                                            title="Edit"
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedIds(new Set([msg.id]));
                                                            setShowDeleteMenu(true);
                                                            setHoveredMessageId(null);
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] px-4 py-2 rounded-2xl select-none transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''
                                                    } ${isDeletedGlobally
                                                        ? 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 italic border border-gray-200 dark:border-slate-700/50'
                                                        : isMe
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 shadow-sm border border-gray-200 dark:border-slate-700'
                                                    }`}
                                            >
                                                {/* Reply quote if this is a reply - click to scroll to original */}
                                                {msg.replyToContent && !isDeletedGlobally && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            scrollToMessage(msg.replyToId);
                                                        }}
                                                        className={`text-xs mb-2 pb-2 border-l-2 pl-2 cursor-pointer hover:opacity-80 ${isMe ? 'border-blue-400/50 text-blue-100' : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        <div className="font-medium text-[10px] opacity-75">
                                                            {msg.replyToSenderName || (msg.replyToSenderId === user?.id ? 'You' : friend?.name)}
                                                        </div>
                                                        <div className="truncate">{msg.replyToContent}</div>
                                                    </div>
                                                )}
                                                {isDeletedGlobally ? (
                                                    <div className="text-sm">🚫 This message was deleted</div>
                                                ) : isEditing ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                                                className="px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                                                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-500"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm break-words whitespace-pre-wrap">{msg.content}</div>
                                                        <div className={`text-xs mt-1 flex items-center gap-1 justify-end ${isMe ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'
                                                            }`}>
                                                            {msg.editedAt && <span className="italic">edited</span>}
                                                            <span>{formatTime(msg.sentAt)}</span>
                                                            {isMe && !isDeleted && (
                                                                <div className="flex items-center ml-1">
                                                                    {msg.seenAt ? (
                                                                        <div title={`Seen at ${formatTime(msg.seenAt)}`} className="text-cyan-300 drop-shadow-sm">
                                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M17 6L9.5 13.5L7 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                                <path d="M22 6L14.5 13.5L12 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                    ) : msg.deliveredAt ? (
                                                                        <div title={`Delivered at ${formatTime(msg.deliveredAt)}`} className="text-white drop-shadow-sm">
                                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M17 6L9.5 13.5L7 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                                <path d="M22 6L14.5 13.5L12 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                    ) : (
                                                                        <div title="Sent" className="text-blue-200/60">
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
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

            {/* Bottom Section: Reply Bar + Input - pushed to bottom via mt-auto */}
            <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-colors">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
                        <div className="border-l-2 border-blue-500 pl-2 flex-1 min-w-0">
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Replying to {replyingTo.senderId === user?.id ? 'yourself' : friend?.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-slate-400 truncate">{replyingTo.content}</div>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSend} className="p-2">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-600 border border-gray-200 dark:border-slate-700 placeholder:text-gray-500 dark:placeholder:text-slate-500 text-sm transition-colors"
                            disabled={!socketConnected}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !socketConnected}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition transform active:scale-95"
                        >
                            <SendIcon />
                        </button>
                    </div>
                    {!socketConnected && (
                        <div className="text-xs text-orange-500 dark:text-orange-400 mt-1 text-center">Connecting...</div>
                    )}
                </form>
            </div>

            {/* Desktop: Right-click context menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-2 min-w-[160px] z-50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white"
                    style={{
                        left: Math.min(contextMenu.x, window.innerWidth - 180),
                        top: Math.min(contextMenu.y, window.innerHeight - 200)
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            setReplyingTo(contextMenu.message);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3"
                    >
                        <ReplyIcon /> Reply
                    </button>
                    <button
                        onClick={async () => {
                            const text = contextMenu.message.content;
                            try {
                                await navigator.clipboard.writeText(text);
                            } catch {
                                const textarea = document.createElement('textarea');
                                textarea.value = text;
                                document.body.appendChild(textarea);
                                textarea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textarea);
                            }
                            setCopyFeedback({ x: contextMenu.x, y: contextMenu.y, isRight: contextMenu.x > window.innerWidth / 2 });
                            setTimeout(() => setCopyFeedback(null), 1500);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3"
                    >
                        <CopyIcon /> Copy
                    </button>
                    {contextMenu.isMe && (
                        <button
                            onClick={() => {
                                setEditingId(contextMenu.message.id);
                                setEditContent(contextMenu.message.content);
                                setContextMenu(null);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3"
                        >
                            <EditIcon /> Edit
                        </button>
                    )}
                    <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
                    <button
                        onClick={() => {
                            setSelectedIds(new Set([contextMenu.message.id]));
                            setShowDeleteMenu(true);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-red-500 dark:text-red-400 flex items-center gap-3"
                    >
                        <TrashIcon /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
