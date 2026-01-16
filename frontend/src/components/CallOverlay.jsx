import { useState, useEffect, useCallback, useRef } from 'react';
import { updateCallEventCallback, onConnectionChange } from '../ws/chatSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import apiClient from '../api/client';

/**
 * CallOverlay - Handles incoming call UI and active call screen
 * Phase 6: Now with WebRTC audio
 */
const CallOverlay = ({ userId }) => {
    const [callState, setCallState] = useState(null);
    // callState: { type: 'incoming' | 'outgoing' | 'active', callId, sessionId?, callerId?, callerName?, receiverId?, receiverName? }

    const handleCallEvent = useCallback((data) => {
        console.log('[CallOverlay] Event:', data);

        switch (data.event) {
            case 'CALL_INITIATE':
                // Incoming call
                setCallState({
                    type: 'incoming',
                    callId: data.callId,
                    sessionId: data.sessionId,
                    callerId: data.callerId,
                    callerName: data.callerName
                });
                break;

            case 'CALL_RINGING':
                // Confirmation of outgoing call
                setCallState({
                    type: 'outgoing',
                    callId: data.callId,
                    sessionId: data.sessionId,
                    receiverId: data.receiverId,
                    receiverName: data.receiverName
                });
                break;

            case 'CALL_ACCEPT':
                // Call accepted - transition to active
                setCallState((prev) => prev ? {
                    ...prev,
                    type: 'active'
                } : null);
                break;

            case 'CALL_REJECT':
            case 'CALL_END':
                // Check if ended due to disconnect
                if (data.endReason === 'DISCONNECTED') {
                    // Show global toast or alert (using alert for now as a simple fallback)
                    // In a real app we'd use a toast context
                    setTimeout(() => alert('Call ended due to connection loss.'), 100);
                }
                setCallState(null);
                break;

            default:
                break;
        }
    }, []);

    // Connection state monitoring
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        // Subscribe to connection changes
        const unsubscribe = onConnectionChange((connected) => {
            setIsConnected(connected);
            if (!connected && callState?.type === 'active') {
                console.warn('[CallOverlay] Connection lost during active call');
            }
        });
        return unsubscribe;
    }, [callState?.type]);

    useEffect(() => {
        updateCallEventCallback(handleCallEvent);
        return () => updateCallEventCallback(null);
    }, [handleCallEvent]);

    // ... handlers ...

    // Reconnecting Overlay (Global)
    if (!isConnected && callState?.type === 'active') {
        return (
            <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold mb-2">Network Connection Lost</h2>
                <p className="text-gray-400">Attempting to reconnect...</p>
            </div>
        );
    }

    if (!callState) return null;

    const handleAccept = async () => {
        if (!callState?.callId) return;
        try {
            await apiClient.post(`/calls/${callState.callId}/accept`);
        } catch (err) {
            console.error('Failed to accept call:', err);
            setCallState(null);
        }
    };

    const handleReject = async () => {
        if (!callState?.callId) return;
        try {
            await apiClient.post(`/calls/${callState.callId}/reject`);
        } catch (err) {
            console.error('Failed to reject call:', err);
        }
        setCallState(null);
    };

    const handleEndCall = async () => {
        if (!callState?.callId) return;
        try {
            await apiClient.post(`/calls/${callState.callId}/end`);
        } catch (err) {
            console.error('Failed to end call:', err);
        }
        setCallState(null);
    };

    const handleCancel = async () => {
        await handleEndCall();
    };

    if (!callState) return null;

    // Incoming call overlay
    if (callState.type === 'incoming') {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center transition-colors">
                    <div className="text-6xl mb-4">📞</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Incoming Call</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">{callState.callerName} is calling you</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handleReject}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition flex items-center gap-2"
                        >
                            <span>✕</span> Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition flex items-center gap-2"
                        >
                            <span>✓</span> Accept
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Outgoing call (ringing)
    if (callState.type === 'outgoing') {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center transition-colors">
                    <div className="text-6xl mb-4 animate-pulse">📱</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Calling...</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">Waiting for {callState.receiverName} to answer</p>
                    <button
                        onClick={handleCancel}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // Active call with WebRTC
    if (callState.type === 'active') {
        return (
            <ActiveCallScreen
                callState={callState}
                userId={userId}
                onEndCall={handleEndCall}
            />
        );
    }

    return null;
};

/**
 * ActiveCallScreen - Full-screen call UI with WebRTC audio + screen share
 */
const ActiveCallScreen = ({ callState, userId, onEndCall }) => {
    const audioRef = useRef(null);
    const screenVideoRef = useRef(null);
    const [callDuration, setCallDuration] = useState(0);

    // Determine if we are the caller (we have receiverId means we initiated the call)
    // Caller sees: { receiverId, receiverName } from CALL_RINGING
    // Receiver sees: { callerId, callerName } from CALL_INITIATE
    const isCaller = callState.receiverId !== undefined;
    const remoteUserId = isCaller ? callState.receiverId : callState.callerId;
    const remoteName = callState.callerName || callState.receiverName || 'User';

    console.log('[ActiveCallScreen] === ROLE CHECK ===');
    console.log('[ActiveCallScreen] My userId:', userId);
    console.log('[ActiveCallScreen] callState.callerId:', callState.callerId);
    console.log('[ActiveCallScreen] callState.receiverId:', callState.receiverId);
    console.log('[ActiveCallScreen] isCaller:', isCaller);
    console.log('[ActiveCallScreen] remoteUserId:', remoteUserId);
    console.log('[ActiveCallScreen] callId:', callState.callId);

    // Initialize WebRTC with callId (used for signaling)
    const {
        remoteStream,
        remoteScreenStream,
        isMuted,
        isScreenSharing,
        connectionState,
        error,
        toggleMute,
        startCall,
        startScreenShare,
        stopScreenShare,
        cleanup
    } = useWebRTC(callState.callId, isCaller, remoteUserId);

    // Start call if we are the caller - with delay to ensure receiver has subscribed
    useEffect(() => {
        if (isCaller) {
            // Delay to ensure receiver has subscribed to signals
            const timer = setTimeout(() => {
                console.log('[ActiveCallScreen] Starting call after delay');
                startCall();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isCaller, startCall]);

    // Attach remote stream to audio element
    useEffect(() => {
        if (remoteStream && audioRef.current) {
            audioRef.current.srcObject = remoteStream;
            console.log('[ActiveCallScreen] Remote audio attached');
        }
    }, [remoteStream]);

    // Attach remote screen stream to video element
    useEffect(() => {
        if (remoteScreenStream && screenVideoRef.current) {
            screenVideoRef.current.srcObject = remoteScreenStream;
            console.log('[ActiveCallScreen] Remote screen attached');
        }
    }, [remoteScreenStream]);

    // Call duration timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCallDuration(d => d + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle end call with cleanup
    const handleEnd = useCallback(() => {
        cleanup();
        onEndCall();
    }, [cleanup, onEndCall]);

    // Connection status indicator
    const getStatusColor = () => {
        switch (connectionState) {
            case 'connected': return 'bg-green-500';
            case 'connecting': return 'bg-yellow-500';
            case 'disconnected':
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
            {/* Hidden audio element */}
            <audio ref={audioRef} autoPlay playsInline />

            {/* Error display */}
            {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Avatar */}
            <div className="w-28 h-28 bg-gray-700 rounded-full flex items-center justify-center text-5xl mb-6">
                👤
            </div>

            {/* Name */}
            <h2 className="text-2xl font-bold mb-2">{remoteName}</h2>

            {/* Duration and status */}
            <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></span>
                <p className="text-gray-400">{formatDuration(callDuration)}</p>
            </div>

            {/* Connection state */}
            <p className="text-sm text-gray-500 mb-8 capitalize">{connectionState}</p>

            {/* Controls */}
            <div className="flex items-center gap-6">
                {/* Mute button */}
                <button
                    onClick={toggleMute}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition text-2xl ${isMuted
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                {/* End call button */}
                <button
                    onClick={handleEnd}
                    className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition text-3xl"
                >
                    📞
                </button>

                {/* Screen Share button */}
                <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition text-2xl ${isScreenSharing
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                    {isScreenSharing ? '📺' : '💻'}
                </button>
            </div>

            {/* Audio indicator */}
            {remoteStream && (
                <div className="mt-8 flex items-center gap-2 text-green-400">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-sm">Audio connected</span>
                </div>
            )}

            {/* Remote screen share display */}
            {remoteScreenStream && (
                <div className="fixed inset-4 top-20 bottom-40 z-10 bg-black rounded-lg overflow-hidden">
                    <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                        💻 {remoteName} is sharing screen
                    </div>
                </div>
            )}

            {/* Screen sharing indicator */}
            {isScreenSharing && (
                <div className="mt-4 flex items-center gap-2 text-blue-400">
                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    <span className="text-sm">You are sharing your screen</span>
                </div>
            )}
        </div>
    );
};

export default CallOverlay;
