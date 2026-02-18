/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../api/client';
import { addListener, onConnectionChange } from '../ws/chatSocket';
import { useNotifications } from './NotificationContext';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
    // callState: { type: 'incoming' | 'outgoing' | 'active', callId, sessionId?, callerId?, callerName?, receiverId?, receiverName? }
    const [callState, setCallState] = useState(null);
    const [isConnected, setIsConnected] = useState(true);
    const { addToast } = useNotifications();

    // Derived state
    const isCallActive = callState?.type === 'active';
    const isInCall = !!callState; // Any state (ringing, incoming, active)

    // Handle incoming socket events
    const handleCallEvent = useCallback((data) => {
        switch (data.event) {
            case 'CALL_INITIATE':
                setCallState({
                    type: 'incoming',
                    callId: data.callId,
                    sessionId: data.exchangeSessionId ?? data.sessionId ?? null,
                    callerId: data.callerId,
                    callerName: data.callerName
                });
                break;

            case 'CALL_RINGING':
                setCallState({
                    type: 'outgoing',
                    callId: data.callId,
                    sessionId: data.exchangeSessionId ?? data.sessionId ?? null,
                    receiverId: data.receiverId,
                    receiverName: data.receiverName
                });
                break;

            case 'CALL_ACCEPT':
                setCallState((prev) => prev ? {
                    ...prev,
                    type: 'active'
                } : null);
                break;

            case 'CALL_REJECT':
                addToast('Call Declined', 'User declined the call', 'ERROR');
                setCallState(null);
                break;

            case 'CALL_END':
                if (data.endReason === 'DISCONNECTED') {
                    addToast('Call Disconnected', 'Connection lost', 'ERROR');
                } else if (data.endReason === 'BUSY') {
                    addToast('User Busy', 'User is currently in another call', 'WARNING');
                } else {
                    // Only show normal end toast if it wasn't a standard "Hang up" by us?
                    // Actually getting a CALL_END usually implies valid termination.
                    // addToast('Call Ended', 'Call finished', 'INFO');
                }
                setCallState(null);
                break;

            default:
                break;
        }
    }, [addToast]);

    // Subscribe to socket events
    useEffect(() => {
        const unsubscribe = addListener('call', handleCallEvent);
        return () => unsubscribe();
    }, [handleCallEvent]);

    const checkActiveCall = useCallback(async () => {
        try {
            const res = await apiClient.get('/calls/active');
            if (res.data) {
                const { isCaller, remoteUserId, remoteUserName, status, callId, exchangeSessionId } = res.data;
                const isIncoming = !isCaller && status === 'RINGING';

                const newState = {
                    callId,
                    status,
                    type: isIncoming ? 'incoming' : (status === 'ACCEPTED' ? 'active' : 'outgoing'),
                    sessionId: exchangeSessionId || null
                };

                if (isCaller) {
                    newState.receiverId = remoteUserId;
                    newState.receiverName = remoteUserName;
                } else {
                    newState.callerId = remoteUserId;
                    newState.callerName = remoteUserName;
                }

                setCallState(newState);
            }
        } catch (err) {
            console.error('[CallContext] Failed to check active call:', err);
        }
    }, []);

    // Monitor connection
    useEffect(() => {
        const unsubscribe = onConnectionChange((connected) => {
            setIsConnected(connected);
            if (!connected && isCallActive) {
                console.warn('[CallContext] Connection lost during active call');
            } else if (connected) {
                // On reconnect, check if we have an active call in backend
                checkActiveCall();
            }
        });

        return () => unsubscribe();
    }, [isCallActive, checkActiveCall]);

    // Actions
    const acceptCall = async () => {
        if (!callState?.callId) return;
        try {
            await apiClient.post(`/calls/${callState.callId}/accept`);
        } catch (err) {
            console.error('Failed to accept call:', err);
            setCallState(null);
        }
    };

    const rejectCall = async () => {
        if (!callState?.callId) return;
        try {
            await apiClient.post(`/calls/${callState.callId}/reject`);
        } catch (err) {
            console.error('Failed to reject call:', err);
        }
        setCallState(null);
    };

    const endCall = async () => {
        if (!callState?.callId) return;
        try {
            await apiClient.post(`/calls/${callState.callId}/end`);
        } catch (err) {
            console.error('Failed to end call:', err);
        }
        setCallState(null);
    };

    const clearCallState = () => setCallState(null);

    return (
        <CallContext.Provider value={{
            callState,
            isCallActive,
            isInCall,
            isConnected,
            acceptCall,
            rejectCall,
            endCall,
            clearCallState
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const ctx = useContext(CallContext);
    if (!ctx) {
        throw new Error('useCall must be used inside CallProvider');
    }
    return ctx;
};
