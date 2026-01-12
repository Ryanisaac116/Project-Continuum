import apiClient from './client';

export const profileApi = {
    // User Profile
    getMe: () => apiClient.get('/users/me'),
    updateMe: (data) => apiClient.put('/users/me', data),

    // Detailed Profile (inc. stats if any)
    getProfile: () => apiClient.get('/profile'),
    updateProfile: (data) => apiClient.put('/profile', data),

    // Skills
    getAllSkills: () => apiClient.get('/skills'), // System skills

    // User Skills
    getUserSkills: () => apiClient.get('/user-skills'),
    addUserSkill: (data) => apiClient.post('/user-skills', data),
    updateUserSkill: (id, data) => apiClient.put(`/user-skills/${id}`, data),
    deleteUserSkill: (id) => apiClient.delete(`/user-skills/${id}`),
};
