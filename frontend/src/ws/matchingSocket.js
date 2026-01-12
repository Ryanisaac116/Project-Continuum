import { Client } from '@stomp/stompjs';

let client = null;
let connected = false;

export const connectMatchingSocket = (
  token,
  onEvent,
  onConnected,
  onError
) => {
  if (client) return;

  client = new Client({
    brokerURL: `ws://192.168.29.57:8080/ws?token=${token}`,
    reconnectDelay: 5000,
    debug: () => { },
  });

  client.onConnect = () => {
    connected = true;

    // Subscribe to MATCH events (MATCH_FOUND, WAITING)
    client.subscribe('/user/queue/match', (message) => {
      const event = JSON.parse(message.body);
      onEvent(event);
    });

    // Subscribe to SESSION events (SESSION_ENDED)
    client.subscribe('/user/queue/session', (message) => {
      const event = JSON.parse(message.body);
      onEvent(event);
    });

    onConnected?.();
  };

  client.onWebSocketClose = () => {
    connected = false;
    onError?.("Disconnected");
  };

  client.activate();
};

export const joinMatching = (intent) => {
  if (!client || !connected) return;

  client.publish({
    destination: '/app/matching.join',
    body: JSON.stringify(intent),
  });
};

export const disconnectMatchingSocket = () => {
  if (!client) return;
  client.deactivate();
  client = null;
  connected = false;
};
