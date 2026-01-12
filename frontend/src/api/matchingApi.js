import apiClient from './client';

// Join matching queue
export const joinMatching = async (intent) => {
  const response = await apiClient.post('/matching/join', null, {
    params: { intent },
  });
  return response.data;
};

// Cancel matching (only if you implemented backend endpoint)
export const cancelMatching = async () => {
  await apiClient.post('/matching/cancel');
};
