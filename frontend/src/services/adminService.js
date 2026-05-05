import api from '../api/axiosClient';
import { unwrapData } from '../utils/apiHelper';

export const adminService = {
  /** Tổng quan: số user, quiz, materials, sessions */
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return unwrapData(res, 'Get stats');
  },

  /** Danh sách toàn bộ user có số bài đã làm */
  getUsers: async () => {
    const res = await api.get('/api/admin/users');
    return unwrapData(res, 'Get users');
  },

  /** Xoá user theo id */
  deleteUser: async (id) => {
    const res = await api.delete(`/api/admin/users/${id}`);
    return unwrapData(res, 'Delete user');
  },

  /** Top 5 quiz theo lượt làm */
  getTopQuizzes: async () => {
    const res = await api.get('/api/admin/top-quizzes');
    return unwrapData(res, 'Get top quizzes');
  },

  /** Thống kê chủ đề */
  getSubjectStats: async () => {
    const res = await api.get('/api/admin/subject-stats');
    return unwrapData(res, 'Get subject stats');
  },

  /** Hoạt động gần đây */
  getActivity: async () => {
    const res = await api.get('/api/admin/activity');
    return unwrapData(res, 'Get activity');
  },

  /** Danh sách tất cả quiz (admin) */
  getQuizzes: async () => {
    const res = await api.get('/api/admin/quizzes');
    return unwrapData(res, 'Get quizzes');
  },

  /** Danh sách tất cả học liệu (admin) */
  getMaterials: async () => {
    const res = await api.get('/api/admin/materials');
    return unwrapData(res, 'Get materials');
  },

  /** Xoá học liệu */
  deleteMaterial: async (id) => {
    const res = await api.delete(`/api/admin/materials/${id}`);
    return unwrapData(res, 'Delete material');
  },

  /** Danh sách toàn bộ lớp học kèm sĩ số (admin only) */
  getAllGroups: async () => {
    const res = await api.get('/api/admin/groups');
    return unwrapData(res, 'Get all groups');
  },

  /** Cập nhật sĩ số tối đa của lớp (admin only) */
  updateGroupCapacity: async (id, capacity) => {
    const res = await api.put(`/api/admin/groups/${id}/capacity`, { capacity });
    return unwrapData(res, 'Update group capacity');
  },
};
