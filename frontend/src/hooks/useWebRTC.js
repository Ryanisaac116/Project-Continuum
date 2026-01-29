import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToCallSignal, sendCallSignal, isChatConnected } from '../ws/chatSocket';

/**
 * useWebRTC - WebRTC Audio + Screen Share Hook
 * 
 * Key design decisions:
 * 1. Pre-create video transceiver for consistent m-line order
 * 2. Use replaceTrack for screen share to avoid renegotiation issues
 * 3. Robust signaling state guards to prevent errors
 */
const rtcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

export function useWebRTC(callId, isCaller, remoteUserId) {
    const [remoteStream, setRemoteStream] = useState(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionState, setConnectionState] = useState('new');
    const [error, setError] = useState(null);

    // Use refs for everything to prevent re-renders
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const videoTransceiverRef = useRef(null);
    const signalUnsubRef = useRef(null);
    const hasStartedRef = useRef(false);
    const pendingCandidatesRef = useRef([]);
    const cleanedUpRef = useRef(false);
    const callIdRef = useRef(callId);
    const isCallerRef = useRef(isCaller);
    const remoteUserIdRef = useRef(remoteUserId);

    // Keep refs in sync
    useEffect(() => {
        callIdRef.current = callId;
        isCallerRef.current = isCaller;
        remoteUserIdRef.current = remoteUserId;
    }, [callId, isCaller, remoteUserId]);

    const role = isCaller ? 'CALLER' : 'RECEIVER';

    const getAudio = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Microphone requires HTTPS or localhost');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        return stream;
    };

    const createPC = () => {
        if (pcRef.current) return pcRef.current;


        const pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (e) => {
            if (e.candidate && isChatConnected() && !cleanedUpRef.current) {
                sendCallSignal({
                    type: 'ICE_CANDIDATE',
                    sessionId: callIdRef.current,
                    payload: JSON.stringify(e.candidate.toJSON()),
                    recipientId: remoteUserIdRef.current
                });
            }
        };

        pc.onconnectionstatechange = () => {

            setConnectionState(pc.connectionState);
        };

        // Handle incoming tracks (audio and video/screen)
        pc.ontrack = (e) => {


            if (e.track.kind === 'video') {

                const stream = e.streams[0] || new MediaStream([e.track]);
                setRemoteScreenStream(stream);

                e.track.onended = () => {

                    setRemoteScreenStream(null);
                };
            } else {
                setRemoteStream(e.streams[0]);
            }
        };

        pcRef.current = pc;
        return pc;
    };

    // Safely send renegotiation offer
    const sendRenegotiationOffer = useCallback(async () => {
        const pc = pcRef.current;
        if (!pc) {

            return;
        }

        // Wait for stable state
        if (pc.signalingState !== 'stable') {

            await new Promise(resolve => {
                const check = () => {
                    if (pc.signalingState === 'stable') {
                        pc.removeEventListener('signalingstatechange', check);
                        resolve();
                    }
                };
                pc.addEventListener('signalingstatechange', check);
                // Timeout after 5 seconds
                setTimeout(() => {
                    pc.removeEventListener('signalingstatechange', check);
                    resolve();
                }, 5000);
            });
        }

        try {

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendCallSignal({
                type: 'OFFER',
                sessionId: callIdRef.current,
                payload: JSON.stringify(offer),
                recipientId: remoteUserIdRef.current
            });

        } catch (err) {
            console.error(`[${role}] Renegotiation error:`, err);
        }
    }, [role]);

    const handleSignalInternal = async (msg) => {
        if (cleanedUpRef.current) return;
        if (msg.sessionId && msg.sessionId !== callIdRef.current) return;

        const iAmCaller = isCallerRef.current;
        const myRole = iAmCaller ? 'CALLER' : 'RECEIVER';

        // Log everything except ICE candidates to reduce noise
        if (msg.type !== 'ICE_CANDIDATE') {
            console.log(`[useWebRTC][${myRole}] Received signal: ${msg.type}`, msg);
        }

        const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;

        try {
            if (msg.type === 'OFFER') {
                const pc = pcRef.current || createPC();


                // Handle offer collision - rollback if we have a pending local offer
                if (pc.signalingState === 'have-local-offer') {

                    await pc.setLocalDescription({ type: 'rollback' });
                }

                // Only process if we can accept an offer
                if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-remote-offer') {
                    console.warn(`[${myRole}] Cannot accept offer in state: ${pc.signalingState}`);
                    return;
                }

                await pc.setRemoteDescription(new RTCSessionDescription(payload));


                // Process pending candidates
                for (const c of pendingCandidatesRef.current) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(c));
                    } catch (e) {
                        console.warn('Failed to add pending candidate:', e);
                    }
                }
                pendingCandidatesRef.current = [];

                // Only get audio on first offer (initial call setup)
                if (!hasStartedRef.current) {
                    hasStartedRef.current = true;
                    const stream = await getAudio();
                    stream.getTracks().forEach(t => pc.addTrack(t, stream));

                    // Find existing video transceiver created by setRemoteDescription
                    const transceivers = pc.getTransceivers();
                    const videoTransceiver = transceivers.find(t => t.receiver.track.kind === 'video');

                    if (videoTransceiver) {
                        videoTransceiverRef.current = videoTransceiver;
                        // Ensure we are set to recvonly initially (receive screen share)
                        // But we can update direction if we need to send later
                        videoTransceiver.direction = 'recvonly';
                    } else {
                        // Fallback if not found (shouldn't happen if offer contained video m-line)
                        videoTransceiverRef.current = pc.addTransceiver('video', {
                            direction: 'recvonly'
                        });
                    }

                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                sendCallSignal({
                    type: 'ANSWER',
                    sessionId: callIdRef.current,
                    payload: JSON.stringify(answer),
                    recipientId: remoteUserIdRef.current
                });


            } else if (msg.type === 'ANSWER') {
                const pc = pcRef.current;
                if (!pc) {
                    console.warn(`[${myRole}] No PC to accept answer`);
                    return;
                }

                // CRITICAL: Only set answer if we're expecting one
                if (pc.signalingState !== 'have-local-offer') {

                    return;
                }

                await pc.setRemoteDescription(new RTCSessionDescription(payload));


                // Process pending candidates
                for (const c of pendingCandidatesRef.current) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(c));
                    } catch (e) {
                        console.warn('Failed to add pending candidate:', e);
                    }
                }
                pendingCandidatesRef.current = [];

            } else if (msg.type === 'ICE_CANDIDATE') {
                const pc = pcRef.current;
                if (!pc) {
                    pendingCandidatesRef.current.push(payload);
                    return;
                }

                // Can only add candidates after remote description is set
                if (!pc.remoteDescription?.type) {
                    pendingCandidatesRef.current.push(payload);
                } else {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(payload));
                    } catch (e) {
                        console.warn('Failed to add ICE candidate:', e);
                    }
                }
            } else if (msg.type === 'SCREEN_SHARE_START') {

                // Track will arrive via ontrack
            } else if (msg.type === 'SCREEN_SHARE_STOP') {

                setRemoteScreenStream(null);
            }
        } catch (err) {
            console.error(`[${myRole}] Signal error:`, err.message);
            // Don't set error for signaling issues - they're usually recoverable
        }
    };

    const startCall = useCallback(async () => {
        if (!isCallerRef.current) return;
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;



        try {
            const stream = await getAudio();
            const pc = createPC();

            // Add audio track
            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            // Pre-create video transceiver for screen share
            videoTransceiverRef.current = pc.addTransceiver('video', {
                direction: 'recvonly'
            });


            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendCallSignal({
                type: 'OFFER',
                sessionId: callIdRef.current,
                payload: JSON.stringify(offer),
                recipientId: remoteUserIdRef.current
            });

        } catch (err) {
            console.error(`[CALLER] Start error:`, err);
            // More descriptive error for user
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied. Please allow access.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found.');
            } else {
                setError(`Call setup failed: ${err.message}`);
            }
            hasStartedRef.current = false;
        }
    }, []);

    const toggleMute = useCallback(() => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    }, []);

    // ==================== SCREEN SHARING ====================

    const startScreenShare = useCallback(async () => {
        const pc = pcRef.current;
        if (!pc) {
            setError('No active call to share screen');
            return false;
        }

        if (pc.connectionState !== 'connected') {
            setError('Call not fully connected yet');
            return false;
        }

        try {

            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });

            screenStreamRef.current = screenStream;
            const videoTrack = screenStream.getVideoTracks()[0];

            // Replace track on existing transceiver
            const transceiver = videoTransceiverRef.current;
            if (transceiver && transceiver.sender) {
                await transceiver.sender.replaceTrack(videoTrack);
                transceiver.direction = 'sendrecv';

            } else {
                console.warn(`[${role}] No transceiver, adding track directly`);
                pc.addTrack(videoTrack, screenStream);
            }

            // Handle when user stops via browser UI
            videoTrack.onended = () => {

                stopScreenShare();
            };

            setIsScreenSharing(true);

            // Notify remote
            sendCallSignal({
                type: 'SCREEN_SHARE_START',
                sessionId: callIdRef.current,
                payload: '{}',
                recipientId: remoteUserIdRef.current
            });

            // Trigger renegotiation to update remote
            await sendRenegotiationOffer();


            return true;
        } catch (err) {
            console.error('Screen share error:', err);
            if (err.name !== 'NotAllowedError') {
                setError('Failed to start screen share: ' + err.message);
            }
            return false;
        }
    }, [role, sendRenegotiationOffer]);

    const stopScreenShare = useCallback(async () => {
        // Stop local screen stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }

        // Clear track from transceiver
        const transceiver = videoTransceiverRef.current;
        if (transceiver && transceiver.sender) {
            try {
                await transceiver.sender.replaceTrack(null);
                transceiver.direction = 'recvonly';

            } catch (e) {
                console.warn('Error clearing transceiver:', e);
            }
        }

        setIsScreenSharing(false);

        // Notify remote
        if (isChatConnected() && !cleanedUpRef.current) {
            sendCallSignal({
                type: 'SCREEN_SHARE_STOP',
                sessionId: callIdRef.current,
                payload: '{}',
                recipientId: remoteUserIdRef.current
            });

            // Renegotiate
            await sendRenegotiationOffer();
        }


    }, [role, sendRenegotiationOffer]);

    const cleanup = useCallback(() => {
        if (cleanedUpRef.current) return;
        cleanedUpRef.current = true;


        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        signalUnsubRef.current?.();

        screenStreamRef.current = null;
        videoTransceiverRef.current = null;
        localStreamRef.current = null;
        pcRef.current = null;
        signalUnsubRef.current = null;
        hasStartedRef.current = false;
        pendingCandidatesRef.current = [];

        setRemoteStream(null);
        setRemoteScreenStream(null);
        setConnectionState('closed');
        setIsScreenSharing(false);
        setError(null);
    }, []);

    // Subscribe ONCE on mount
    useEffect(() => {
        if (!callId || !remoteUserId) return;

        cleanedUpRef.current = false;


        signalUnsubRef.current = subscribeToCallSignal(handleSignalInternal);

        return () => {
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callId]);

    return {
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
    };
}

export default useWebRTC;
