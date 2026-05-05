import api from '../api/axiosClient';

class ApiError extends Error {
  constructor(message, action, payload) {
    super(message);
    this.name = 'ApiError';
    this.action = action;
    this.payload = payload;
  }
}

const unwrapData = (response, action = 'Request') => {
  const payload = response.data;

  if (!payload || typeof payload !== 'object') {
    throw new ApiError(`${action} invalid response`, action, payload);
  }

  if (!('success' in payload)) {
    throw new ApiError(`${action} malformed response`, action, payload);
  }

  if (payload.success === false) {
    throw new ApiError(payload.message || `${action} failed`, action, payload);
  }

  if (!('data' in payload)) {
    throw new ApiError(`${action} missing data field`, action, payload);
  }

  if (payload.data === undefined) {
    throw new ApiError(`${action} data is undefined`, action, payload);
  }

  return payload.data;
};

export const eduService = {
  // Groups / Classes
  getGroups: async () => {
    const response = await api.get('/api/edu/groups');
    return unwrapData(response, 'Get groups');
  },
  getStudentGroups: async () => {
    const response = await api.get('/api/edu/student/groups');
    return unwrapData(response, 'Get student groups');
  },
  createGroup: async (data) => {
    const response = await api.post('/api/edu/groups', data);
    return unwrapData(response, 'Create group');
  },
  updateGroup: async (id, data) => {
    const response = await api.put(`/api/edu/groups/${id}`, data);
    return unwrapData(response, 'Update group');
  },
  getGroupDetails: async (id) => {
    const response = await api.get(`/api/edu/groups/${id}`);
    return unwrapData(response, 'Get group details');
  },
  addMembers: async (groupId, userIds) => {
    const response = await api.post('/api/edu/groups/members', { group_id: groupId, user_ids: userIds });
    return unwrapData(response, 'Add members');
  },
  removeMember: async (groupId, studentId) => {
    const response = await api.delete(`/api/edu/groups/${groupId}/members/${studentId}`);
    return unwrapData(response, 'Remove member');
  },
  deleteGroup: async (id) => {
    const response = await api.delete(`/api/edu/groups/${id}`);
    return unwrapData(response, 'Delete group');
  },
  assignMaterial: async (groupId, materialId) => {
    const response = await api.post('/api/edu/groups/assign', { group_id: groupId, material_id: materialId });
    return unwrapData(response, 'Assign material');
  },
  getStudents: async () => {
    const response = await api.get('/api/edu/students');
    return unwrapData(response, 'Get students');
  },
  getStudentTimeStats: async () => {
    const response = await api.get('/api/edu/students/time-stats');
    return unwrapData(response, 'Get student time stats');
  },
  getTeachers: async () => {
    const response = await api.get('/api/edu/teachers');
    return unwrapData(response, 'Get teachers');
  },
  updateVisibility: async (materialId, visibility) => {
    const response = await api.put(`/api/edu/materials/${materialId}/visibility`, { visibility });
    return unwrapData(response, 'Update visibility');
  },
  shareMaterial: async (materialId, teacherIds) => {
    const response = await api.post(`/api/edu/materials/${materialId}/share`, { teacherIds });
    return unwrapData(response, 'Share material');
  },

  // Worksheets
  getAllWorksheets: async () => {
    const response = await api.get('/api/edu/worksheets/all');
    return unwrapData(response, 'Get all worksheets');
  },
  getAssignedWorksheets: async () => {
    const response = await api.get('/api/edu/worksheets/assigned');
    return unwrapData(response, 'Get assigned worksheets');
  },
  getPublicWorksheet: async (id) => {
    const response = await api.get(`/api/edu/worksheets/public/${id}`);
    return unwrapData(response, 'Get public worksheet');
  },
  generateWorksheet: async (materialId, title) => {
    const response = await api.post('/api/edu/worksheets/generate', { material_id: materialId, title });
    return unwrapData(response, 'Generate worksheet');
  },
  submitWorksheet: async (worksheetId, answers) => {
    const response = await api.post('/api/edu/worksheets/submit', { worksheet_id: worksheetId, answers });
    return unwrapData(response, 'Submit worksheet');
  },
  deleteWorksheet: async (id) => {
    const response = await api.delete(`/api/edu/worksheets/${id}`);
    return unwrapData(response, 'Delete worksheet');
  },
  getWorksheetsByMaterial: async (materialId) => {
    const response = await api.get(`/api/edu/worksheets/material/${materialId}`);
    return unwrapData(response, 'Get worksheets by material');
  },
  generateQuiz: async ({ topic, limit }) => {
    const response = await api.post('/api/quiz/generate', { topic, limit });
    return unwrapData(response, 'Generate quiz');
  },
  getTags: async () => {
    const response = await api.get('/api/edu/tags');
    return unwrapData(response, 'Get tags');
  }
};
