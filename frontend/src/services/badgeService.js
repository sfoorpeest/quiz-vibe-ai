import api from '../api/axiosClient';
import { unwrapData } from '../utils/apiHelper';

/**
 * Badge Service — API client cho hệ thống Thẻ Thành Tích
 */
export const badgeService = {
  /**
   * Lấy danh sách toàn bộ badges + trạng thái đã nhận/chưa nhận + tiến trình
   */
  getAllBadges: async () => {
    const res = await api.get('/api/badges');
    return unwrapData(res, 'Get all badges');
  },

  /**
   * Lấy thống kê tích lũy (UserStats) của user
   */
  getUserStats: async () => {
    const res = await api.get('/api/badges/user-stats');
    return unwrapData(res, 'Get user stats');
  },

  /**
   * Lấy thẻ mới nhận gần đây (tối đa 5)
   */
  getRecentBadges: async () => {
    const res = await api.get('/api/badges/recent');
    return unwrapData(res, 'Get recent badges');
  },

  /**
   * Trang bị 1 thẻ đại diện cho Bảng xếp hạng
   * @param {number|null} badgeId - ID badge hoặc null để tháo
   */
  equipBadge: async (badgeId) => {
    const res = await api.post('/api/badges/equip', { badgeId });
    return unwrapData(res, 'Equip badge');
  },

  /**
   * Ghim tối đa 3 thẻ lên Profile Header
   * @param {number[]} badgeIds - Mảng tối đa 3 badge IDs
   */
  featureBadges: async (badgeIds) => {
    const res = await api.post('/api/badges/feature', { badgeIds });
    return unwrapData(res, 'Feature badges');
  },
};
