// ═══════════════════════════════════════════════════════════════
// MOCK DATA — Phiếu Học Tập Động (Giai đoạn 2)
// Schema dạng "Blocks" — Giả lập đầu ra từ AI
// Mỗi phiếu gồm metadata + mảng blocks linh hoạt
// ═══════════════════════════════════════════════════════════════

export const MOCK_WORKSHEETS = [
  {
    id: 'ws-001',
    title: 'Phiếu Học Tập 1',
    subtitle: 'Bài 1. Một số tính chất và vai trò của nước',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 4',
    createdAt: '2026-04-10',
    assignedTo: ['grp-001'], // Gán cho Lớp 10A1
    blocks: [
      {
        id: 'blk-01',
        type: 'header',
        data: {
          schoolName: '',
          className: '',
          studentName: '',
          phone: '',
        },
      },
      {
        id: 'blk-02',
        type: 'table',
        data: {
          question: '1. Vai trò của nước đối với:',
          columns: null, // Dạng bảng key-value (1 cột label + nhiều dòng trả lời)
          rows: [
            { label: 'Động vật', lines: 3 },
            { label: 'Thực vật', lines: 3 },
            { label: 'Sản xuất', lines: 3 },
            { label: 'Dịch vụ', lines: 3 },
          ],
        },
      },
      {
        id: 'blk-03',
        type: 'open_question',
        data: {
          question: '2. Hàng ngày, em sử dụng nước vào những việc gì?',
          lines: 4,
        },
      },
      {
        id: 'blk-04',
        type: 'open_question',
        data: {
          question: '3. Vì sao mái nhà lại được làm dốc?',
          lines: 4,
        },
      },
    ],
  },
  {
    id: 'ws-002',
    title: 'Phiếu Học Tập 2',
    subtitle: 'Bài 5. Tìm từ đồng nghĩa và trái nghĩa',
    subject: 'Ngữ văn',
    grade: 'Lớp 5',
    createdAt: '2026-04-12',
    assignedTo: ['grp-002'],
    blocks: [
      {
        id: 'blk-05',
        type: 'header',
        data: {
          schoolName: '',
          className: '',
          studentName: '',
          phone: '',
        },
      },
      {
        id: 'blk-06',
        type: 'two_column_table',
        data: {
          question: 'Bài 1: Tìm những từ cùng nghĩa và những từ trái nghĩa với trung thực.',
          columns: [
            { header: 'Từ cùng nghĩa với trung thực', sample: 'Mẫu: Thật thà ;' },
            { header: 'Từ trái nghĩa với trung thực', sample: 'Mẫu: gian dối ;' },
          ],
          rows: 6,
        },
      },
      {
        id: 'blk-07',
        type: 'open_question',
        data: {
          question: 'Bài 2: Đặt câu với một từ cùng nghĩa và một từ trái nghĩa với "trung thực".',
          lines: 5,
        },
      },
    ],
  },
  {
    id: 'ws-003',
    title: 'Phiếu Học Tập 3',
    subtitle: 'Bài 2. Giải bài toán bằng cách lập phương trình',
    subject: 'Toán học',
    grade: 'Lớp 8',
    createdAt: '2026-04-14',
    assignedTo: [],
    blocks: [
      {
        id: 'blk-08',
        type: 'header',
        data: {
          schoolName: '',
          className: '',
          studentName: '',
          phone: '',
        },
      },
      {
        id: 'blk-09',
        type: 'open_question',
        data: {
          question: 'Bài 1: Một hình chữ nhật có chiều dài hơn chiều rộng 5m. Nếu tăng chiều dài thêm 3m và giảm chiều rộng 2m thì diện tích tăng 20m². Tìm các kích thước ban đầu của hình chữ nhật.',
          lines: 8,
        },
      },
      {
        id: 'blk-10',
        type: 'open_question',
        data: {
          question: 'Bài 2: Hai vòi nước cùng chảy vào một bể thì sau 6 giờ đầy bể. Nếu chỉ mở vòi thứ nhất thì sau 10 giờ đầy bể. Hỏi nếu chỉ mở vòi thứ hai thì sau bao lâu đầy bể?',
          lines: 8,
        },
      },
      {
        id: 'blk-11',
        type: 'fill_in_blank',
        data: {
          question: 'Bài 3: Điền vào chỗ trống.',
          items: [
            { prompt: 'Phương trình bậc nhất một ẩn có dạng tổng quát là:', answer: '' },
            { prompt: 'Điều kiện của phương trình bậc nhất là:', answer: '' },
            { prompt: 'Phương trình bậc nhất một ẩn luôn có:', answer: '' },
          ],
        },
      },
    ],
  },
];
