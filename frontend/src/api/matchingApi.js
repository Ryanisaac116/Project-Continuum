import apiClient from './client';

// Join matching queue (REST fallback; main flow uses WebSocket)
export const joinMatching = async (request) => {
  const response = await apiClient.post('/matching/join', request);
  return response.data;
};

// Cancel matching is handled by WebSocket '/app/matching.leave'
export const cancelMatching = async () => {
  return Promise.resolve();
};
