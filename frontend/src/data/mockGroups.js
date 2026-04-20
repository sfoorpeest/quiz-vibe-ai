// ═══════════════════════════════════════════════════════════════
// MOCK DATA — Quản lý Lớp / Nhóm Học Sinh (Giai đoạn 1)
// Sẽ thay bằng API thực khi backend sẵn sàng
// ═══════════════════════════════════════════════════════════════

export const MOCK_GROUPS = [
  {
    id: 'grp-001',
    name: 'Lớp 10A1',
    description: 'Lớp chuyên Toán – Khối 10',
    color: '#06b6d4', // cyan
    memberCount: 5,
    createdAt: '2026-03-01',
  },
  {
    id: 'grp-002',
    name: 'Nhóm Văn Nâng Cao',
    description: 'Ôn thi HSG Ngữ văn 11',
    color: '#f59e0b', // amber
    memberCount: 3,
    createdAt: '2026-03-10',
  },
  {
    id: 'grp-003',
    name: 'Lớp 12B3',
    description: 'Lớp ban Tự nhiên – Ôn thi THPT',
    color: '#8b5cf6', // violet
    memberCount: 4,
    createdAt: '2026-02-15',
  },
];

export const MOCK_STUDENTS = [
  // --- Đã thuộc Lớp 10A1 ---
  { id: 'stu-01', name: 'Nguyễn Minh Anh',   avatar: 'https://i.pravatar.cc/150?u=stu01', email: 'minhanh@school.vn',   groupId: 'grp-001' },
  { id: 'stu-02', name: 'Trần Quốc Bảo',     avatar: 'https://i.pravatar.cc/150?u=stu02', email: 'quocbao@school.vn',   groupId: 'grp-001' },
  { id: 'stu-03', name: 'Lê Thị Cẩm Tú',     avatar: 'https://i.pravatar.cc/150?u=stu03', email: 'camtu@school.vn',     groupId: 'grp-001' },
  { id: 'stu-04', name: 'Phạm Đức Dũng',      avatar: 'https://i.pravatar.cc/150?u=stu04', email: 'ducdung@school.vn',   groupId: 'grp-001' },
  { id: 'stu-05', name: 'Hoàng Thị Hoa',      avatar: 'https://i.pravatar.cc/150?u=stu05', email: 'hoa@school.vn',       groupId: 'grp-001' },

  // --- Đã thuộc Nhóm Văn Nâng Cao ---
  { id: 'stu-06', name: 'Vũ Thanh Lam',       avatar: 'https://i.pravatar.cc/150?u=stu06', email: 'thanhlam@school.vn',  groupId: 'grp-002' },
  { id: 'stu-07', name: 'Đỗ Khánh Linh',      avatar: 'https://i.pravatar.cc/150?u=stu07', email: 'khanhlinh@school.vn', groupId: 'grp-002' },
  { id: 'stu-08', name: 'Bùi Tấn Phát',       avatar: 'https://i.pravatar.cc/150?u=stu08', email: 'tanphat@school.vn',   groupId: 'grp-002' },

  // --- Đã thuộc Lớp 12B3 ---
  { id: 'stu-09', name: 'Ngô Hải Đăng',       avatar: 'https://i.pravatar.cc/150?u=stu09', email: 'haidang@school.vn',   groupId: 'grp-003' },
  { id: 'stu-10', name: 'Lý Bích Ngọc',       avatar: 'https://i.pravatar.cc/150?u=stu10', email: 'bichngoc@school.vn',  groupId: 'grp-003' },
  { id: 'stu-11', name: 'Tô Quang Huy',       avatar: 'https://i.pravatar.cc/150?u=stu11', email: 'quanghuy@school.vn',  groupId: 'grp-003' },
  { id: 'stu-12', name: 'Mai Thị Yến Nhi',    avatar: 'https://i.pravatar.cc/150?u=stu12', email: 'yennhi@school.vn',    groupId: 'grp-003' },

  // --- HỌC SINH TỰ DO (chưa có nhóm) ---
  { id: 'stu-13', name: 'Trương Công Vinh',   avatar: 'https://i.pravatar.cc/150?u=stu13', email: 'congvinh@school.vn',  groupId: null },
  { id: 'stu-14', name: 'Phan Thị Mỹ Duyên', avatar: 'https://i.pravatar.cc/150?u=stu14', email: 'myduyen@school.vn',   groupId: null },
  { id: 'stu-15', name: 'Đặng Hoàng Sơn',    avatar: 'https://i.pravatar.cc/150?u=stu15', email: 'hoangson@school.vn',  groupId: null },
  { id: 'stu-16', name: 'Cao Thị Bích Phương',avatar: 'https://i.pravatar.cc/150?u=stu16', email: 'bichphuong@school.vn',groupId: null },
  { id: 'stu-17', name: 'Lâm Gia Hân',       avatar: 'https://i.pravatar.cc/150?u=stu17', email: 'giahan@school.vn',    groupId: null },
];
