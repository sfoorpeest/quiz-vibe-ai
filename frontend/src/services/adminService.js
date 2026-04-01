import api from '../api/axiosClient';

export const adminService = {
  /** Tổng quan: số user, quiz, materials, sessions */
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data.data;
  },

  /** Danh sách toàn bộ user có số bài đã làm */
  getUsers: async () => {
    const res = await api.get('/api/admin/users');
    return res.data.data;
  },

  /** Xoá user theo id */
  deleteUser: async (id) => {
    const res = await api.delete(`/api/admin/users/${id}`);
    return res.data;
  },

  /** Top 5 quiz theo lượt làm */
  getTopQuizzes: async () => {
    const res = await api.get('/api/admin/top-quizzes');
    return res.data.data;
  },

  /** Thống kê chủ đề */
  getSubjectStats: async () => {
    const res = await api.get('/api/admin/subject-stats');
    return res.data.data;
  },

  /** Hoạt động gần đây */
  getActivity: async () => {
    const res = await api.get('/api/admin/activity');
    return res.data.data;
  },

  /** Danh sách tất cả quiz (admin) */
  getQuizzes: async () => {
    const res = await api.get('/api/admin/quizzes');
    return res.data.data;
  },

  /** Danh sách tất cả học liệu (admin) */
  getMaterials: async () => {
    const res = await api.get('/api/admin/materials');
    return res.data.data;
  },

  /** Xoá học liệu */
  deleteMaterial: async (id) => {
    const res = await api.delete(`/api/admin/materials/${id}`);
    return res.data;
  },
};
