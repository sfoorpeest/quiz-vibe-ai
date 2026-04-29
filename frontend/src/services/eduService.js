import api from '../api/axiosClient';

export const eduService = {
  // Groups / Classes
  getGroups: async () => {
    const response = await api.get('/api/edu/groups');
    return response.data;
  },
  getStudentGroups: async () => {
    const response = await api.get('/api/edu/student/groups');
    return response.data;
  },
  createGroup: async (data) => {
    const response = await api.post('/api/edu/groups', data);
    return response.data;
  },
  updateGroup: async (id, data) => {
    const response = await api.put(`/api/edu/groups/${id}`, data);
    return response.data;
  },
  getGroupDetails: async (id) => {
    const response = await api.get(`/api/edu/groups/${id}`);
    return response.data;
  },
  addMembers: async (groupId, userIds) => {
    const response = await api.post('/api/edu/groups/members', { group_id: groupId, user_ids: userIds });
    return response.data;
  },
  removeMember: async (groupId, studentId) => {
    const response = await api.delete(`/api/edu/groups/${groupId}/members/${studentId}`);
    return response.data;
  },
  deleteGroup: async (id) => {
    const response = await api.delete(`/api/edu/groups/${id}`);
    return response.data;
  },
  assignMaterial: async (groupId, materialId) => {
    const response = await api.post('/api/edu/groups/assign', { group_id: groupId, material_id: materialId });
    return response.data;
  },
  getStudents: async () => {
    const response = await api.get('/api/edu/students');
    return response.data;
  },
  getStudentTimeStats: async () => {
    const response = await api.get('/api/edu/students/time-stats');
    return response.data;
  },
  getTeachers: async () => {
    const response = await api.get('/api/edu/teachers');
    return response.data;
  },
  updateVisibility: async (materialId, visibility) => {
    const response = await api.put(`/api/edu/materials/${materialId}/visibility`, { visibility });
    return response.data;
  },
  shareMaterial: async (materialId, teacherIds) => {
    const response = await api.post(`/api/edu/materials/${materialId}/share`, { teacherIds });
    return response.data;
  },

  // Worksheets
  getAllWorksheets: async () => {
    const response = await api.get('/api/edu/worksheets/all');
    return response.data;
  },
  getAssignedWorksheets: async () => {
    const response = await api.get('/api/edu/worksheets/assigned');
    return response.data;
  },
  getPublicWorksheet: async (id) => {
    const response = await api.get(`/api/edu/worksheets/public/${id}`);
    return response.data;
  },
  generateWorksheet: async (materialId, title) => {
    const response = await api.post('/api/edu/worksheets/generate', { material_id: materialId, title });
    return response.data;
  },
  submitWorksheet: async (worksheetId, answers) => {
    const response = await api.post('/api/edu/worksheets/submit', { worksheet_id: worksheetId, answers });
    return response.data;
  },
  getWorksheetsByMaterial: async (materialId) => {
    const response = await api.get(`/api/edu/worksheets/material/${materialId}`);
    return response.data;
  },
  getTags: async () => {
    const response = await api.get('/api/edu/tags');
    return response.data;
  }
};
