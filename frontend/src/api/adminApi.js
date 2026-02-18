import apiClient from './client';

export const adminApi = {
    getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),

    getUsers: (page = 0, size = 20) =>
        apiClient.get('/admin/users', { params: { page, size } }),

    deactivateUser: (userId) => apiClient.put(`/admin/users/${userId}/deactivate`),
    reactivateUser: (userId) => apiClient.put(`/admin/users/${userId}/reactivate`),
    getUserActivity: (userId) => apiClient.get(`/admin/users/${userId}/activity`),

    // Skill management
    getSkills: () => apiClient.get('/admin/skills'),
    createSkill: (payload) => apiClient.post('/admin/skills', payload),
    updateSkill: (skillId, payload) => apiClient.put(`/admin/skills/${skillId}`, payload),
    deleteSkill: (skillId) => apiClient.delete(`/admin/skills/${skillId}`),

    // Category management
    getSkillCategories: () => apiClient.get('/admin/skills/categories'),
};

export default adminApi;
