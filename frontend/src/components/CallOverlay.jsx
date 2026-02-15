import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { useCall } from '../context/CallContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Phone, PhoneOff, Mic, MicOff, Monitor, StopCircle, User, Loader2, Video, WifiOff } from 'lucide-react';

/**
 * CallOverlay - Handles incoming call UI and active call screen
 * Phase 6: Now with WebRTC audio + Modern UI
 */
const CallOverlay = ({ userId }) => {
    const { callState, isConnected, acceptCall, rejectCall, endCall } = useCall();

    // Reconnecting Overlay (Global)
    if (!isConnected && callState?.type === 'active') {
        return (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
                <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold mb-2">Network Connection Lost</h2>
                <p className="text-gray-400 flex items-center gap-2">
                    <WifiOff className="w-4 h-4" /> Attempting to reconnect...
                </p>
            </div>
        );
    }

    if (!callState) return null;

    const handleAccept = acceptCall;
    const handleReject = rejectCall;
    const handleEndCall = endCall;
    const handleCancel = endCall; // Cancel is same as end

    // Incoming call overlay
    if (callState.type === 'incoming') {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Phone className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Incoming Call</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">{callState.callerName || 'Unknown User'}</p>

                        <div className="flex gap-6 justify-center">
                            <Button
                                variant="destructive"
                                size="lg"
                                onClick={handleReject}
                                className="w-16 h-16 rounded-full flex items-center justify-center p-0 hover:scale-110 transition-transform shadow-lg shadow-red-500/20"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleAccept}
                                className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center p-0 hover:scale-110 transition-transform shadow-lg shadow-green-500/20"
                            >
                                <Phone className="w-6 h-6" />
                            </Button>
                        </div>
                        <div className="mt-4 flex justify-between px-4 text-sm font-medium text-gray-500">
                            <span>Decline</span>
                            <span>Accept</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Outgoing call (ringing)
    if (callState.type === 'outgoing') {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-indigo-50 dark:ring-indigo-900/20">
                            <Phone className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Calling...</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">{callState.receiverName || 'Partner'}</p>

                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            className="w-16 h-16 rounded-full flex items-center justify-center p-0 mx-auto hover:scale-105 transition-transform"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </Button>
                        <p className="mt-2 text-sm text-gray-500">Cancel</p>
                    </div>
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
    const isCaller = callState.receiverId !== undefined;
    const remoteUserId = isCaller ? callState.receiverId : callState.callerId;
    const remoteName = callState.callerName || callState.receiverName || 'User';

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

    // Start call if we are the caller - minimal delay for React effect cycle
    useEffect(() => {
        if (isCaller) {
            const timer = setTimeout(() => {
                startCall();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isCaller, startCall]);

    // Attach remote stream to audio element
    useEffect(() => {
        if (remoteStream && audioRef.current) {
            audioRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Attach remote screen stream to video element
    useEffect(() => {
        if (remoteScreenStream && screenVideoRef.current) {
            screenVideoRef.current.srcObject = remoteScreenStream;
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
            case 'connected': return 'bg-emerald-500';
            case 'connecting': return 'bg-amber-500';
            case 'disconnected':
            case 'failed': return 'bg-red-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-brand-dark opacity-20" />

            {/* Hidden audio element */}
            <audio ref={audioRef} autoPlay playsInline />

            {/* Error display */}
            {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-fade-in-up flex items-center gap-2">
                    <User className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-screen-sm px-6">

                {/* Avatar */}
                <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-2xl ring-4 ring-white/5 relative">
                    <User className="w-16 h-16 text-slate-400" />
                    <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-slate-950 ${getStatusColor()}`} />
                </div>

                {/* Name */}
                <h2 className="text-3xl font-bold mb-2 tracking-tight">{remoteName}</h2>

                {/* Duration and status */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 font-mono text-lg">{formatDuration(callDuration)}</span>
                </div>

                {/* Connection state text */}
                <p className="text-sm text-slate-500 mb-12 capitalize font-medium tracking-wide">
                    {connectionState === 'connected' ? 'Secure Interaction' : connectionState}
                </p>

                {/* Controls */}
                <div className="flex items-center gap-8">
                    {/* Mute button */}
                    <ControlBtn
                        onClick={toggleMute}
                        isActive={isMuted}
                        activeIcon={<MicOff className="w-6 h-6" />}
                        inactiveIcon={<Mic className="w-6 h-6" />}
                        activeClass="bg-red-500 hover:bg-red-600 text-white border-red-500"
                        inactiveClass="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                    />

                    {/* End call button */}
                    <div className="p-2 bg-red-500/20 rounded-full">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleEnd}
                            className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-xl shadow-red-600/30 bg-red-600 hover:bg-red-700 border-4 border-red-500/50"
                        >
                            <PhoneOff className="w-8 h-8 fill-current" />
                        </Button>
                    </div>

                    {/* Screen Share button */}
                    <ControlBtn
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        isActive={isScreenSharing}
                        activeIcon={<StopCircle className="w-6 h-6" />}
                        inactiveIcon={<Monitor className="w-6 h-6" />}
                        activeClass="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                        inactiveClass="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                    />
                </div>

                {/* Audio indicator */}
                {remoteStream && (
                    <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 animate-fade-in-up">
                        <div className="flex gap-0.5 items-end h-3">
                            <div className="w-0.5 h-1 bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-0.5 h-3 bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-0.5 h-2 bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Audio Active</span>
                    </div>
                )}
            </div>

            {/* Remote screen share display */}
            {remoteScreenStream && (
                <div className="fixed inset-4 top-20 bottom-32 z-20 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-white/10">
                        <Monitor className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{remoteName}'s Screen</span>
                    </div>
                </div>
            )}

            {/* Local Screen sharing indicator */}
            {isScreenSharing && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 animate-pulse">
                    <Monitor className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Sharing your screen</span>
                </div>
            )}
        </div>
    );
};

const ControlBtn = ({ onClick, isActive, activeIcon, inactiveIcon, activeClass, inactiveClass }) => (
    <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isActive ? activeClass : inactiveClass}`}
    >
        {isActive ? activeIcon : inactiveIcon}
    </Button>
);

export default CallOverlay;
