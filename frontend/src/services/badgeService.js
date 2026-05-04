import api from '../api/axiosClient';

/**
 * Badge Service — API client cho hệ thống Thẻ Thành Tích
 */
export const badgeService = {
  /**
   * Lấy danh sách toàn bộ badges + trạng thái đã nhận/chưa nhận + tiến trình
   */
  getAllBadges: async () => {
    const res = await api.get('/api/badges');
    return res.data?.data || res.data;
  },

  /**
   * Lấy thống kê tích lũy (UserStats) của user
   */
  getUserStats: async () => {
    const res = await api.get('/api/badges/user-stats');
    return res.data?.data || res.data;
  },

  /**
   * Lấy thẻ mới nhận gần đây (tối đa 5)
   */
  getRecentBadges: async () => {
    const res = await api.get('/api/badges/recent');
    return res.data?.data || res.data;
  },
};
