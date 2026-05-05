'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('badges', [
      // === NHÓM CHUYÊN CẦN (Luyện tập mỗi ngày) ===
      {
        name: 'Khởi Bước Đam Mê',
        description: 'Hoàn thành bài Quiz đầu tiên.',
        icon_url: '🚀',
        tier: 'BRONZE',
        condition_type: 'QUIZ_COUNT',
        condition_value: 1,
        created_at: new Date()
      },
      {
        name: 'Học Sinh Chăm Chỉ',
        description: 'Luyện tập 3 ngày liên tiếp.',
        icon_url: '📚',
        tier: 'BRONZE',
        condition_type: 'STREAK_DAYS',
        condition_value: 3,
        created_at: new Date()
      },
      {
        name: 'Tinh Thần Sắt Đá',
        description: 'Luyện tập 7 ngày liên tiếp.',
        icon_url: '🔥',
        tier: 'SILVER',
        condition_type: 'STREAK_DAYS',
        condition_value: 7,
        created_at: new Date()
      },
      {
        name: 'Kỷ Luật Thép',
        description: 'Luyện tập 30 ngày liên tiếp không nghỉ.',
        icon_url: '⚔️',
        tier: 'GOLD',
        condition_type: 'STREAK_DAYS',
        condition_value: 30,
        created_at: new Date()
      },
      {
        name: 'Kiến Tha Lâu Đầy Tổ',
        description: 'Hoàn thành tổng cộng 50 bài Quiz.',
        icon_url: '🐜',
        tier: 'SILVER',
        condition_type: 'QUIZ_COUNT',
        condition_value: 50,
        created_at: new Date()
      },
      {
        name: 'Học Giả Bách Khoa',
        description: 'Hoàn thành tổng cộng 500 bài Quiz.',
        icon_url: '🎓',
        tier: 'DIAMOND',
        condition_type: 'QUIZ_COUNT',
        condition_value: 500,
        created_at: new Date()
      },

      // === NHÓM XUẤT SẮC (Thành tích điểm số) ===
      {
        name: 'Điểm 10 Tròn Trĩnh',
        description: 'Đạt điểm tuyệt đối ở 1 bài Quiz.',
        icon_url: '💯',
        tier: 'SILVER',
        condition_type: 'PERFECT_SCORE',
        condition_value: 1,
        created_at: new Date()
      },
      {
        name: 'Phong Độ Ổn Định',
        description: 'Đạt điểm tuyệt đối ở 10 bài Quiz khác nhau.',
        icon_url: '🏅',
        tier: 'GOLD',
        condition_type: 'PERFECT_SCORE',
        condition_value: 10,
        created_at: new Date()
      },
      {
        name: 'Thần Đồng Bất Bại',
        description: 'Đạt điểm tuyệt đối ở 50 bài Quiz khác nhau.',
        icon_url: '👑',
        tier: 'DIAMOND',
        condition_type: 'PERFECT_SCORE',
        condition_value: 50,
        created_at: new Date()
      },

      // === NHÓM KỸ NĂNG (Liên kết Edu Games) ===
      {
        name: 'Tân Binh Đấu Trường',
        description: 'Chơi 1 ván Live Challenge.',
        icon_url: '🎮',
        tier: 'BRONZE',
        condition_type: 'LIVE_PLAYS',
        condition_value: 1,
        created_at: new Date()
      },
      {
        name: 'Chiến Binh Can Đảm',
        description: 'Chơi 1 ván Solo Adventure.',
        icon_url: '🛡️',
        tier: 'BRONZE',
        condition_type: 'SOLO_PLAYS',
        condition_value: 1,
        created_at: new Date()
      },
      {
        name: 'Kẻ Thống Lĩnh',
        description: 'Đạt Top 1 trong Live Challenge lần đầu tiên.',
        icon_url: '🏆',
        tier: 'SILVER',
        condition_type: 'LIVE_WINS',
        condition_value: 1,
        created_at: new Date()
      },
      {
        name: 'Bậc Thầy Sinh Tồn',
        description: 'Vượt qua thành công 50 câu hỏi trong Thử Thách Sinh Tồn.',
        icon_url: '🛡️',
        tier: 'GOLD',
        condition_type: 'MONSTER_KILLS',
        condition_value: 50,
        created_at: new Date()
      },
      {
        name: 'Vua Sân Khấu',
        description: 'Đạt Top 1 trong Live Challenge tổng cộng 10 lần.',
        icon_url: '👸',
        tier: 'GOLD',
        condition_type: 'LIVE_WINS',
        condition_value: 10,
        created_at: new Date()
      },
      {
        name: 'Huyền Thoại Đấu Trường',
        description: 'Đạt Top 1 trong Live Challenge 5 lần liên tiếp.',
        icon_url: '💎',
        tier: 'DIAMOND',
        condition_type: 'LIVE_WIN_STREAK',
        condition_value: 5,
        created_at: new Date()
      },
      {
        name: 'Tốc Độ Ánh Sáng',
        description: 'Hoàn thành 1 bài Quiz dưới 60 giây.',
        icon_url: '⚡',
        tier: 'SILVER',
        condition_type: 'SPEEDRUN',
        condition_value: 1,
        created_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('badges', null, {});
  }
};
