import React from 'react';
import StaticContentLayout from '../components/StaticContentLayout';

function Section({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-700/60 bg-slate-950/40 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <StaticContentLayout
      title="Chính sách bảo mật"
      subtitle="Chính sách này mô tả cách EduApp thu thập, sử dụng và bảo vệ thông tin cá nhân của người dùng khi sử dụng nền tảng."
    >
      <Section title="1. Thông tin thu thập">
        <p>
          EduApp có thể thu thập thông tin đăng ký tài khoản (họ tên, email), dữ liệu học tập (lịch sử học, kết quả bài kiểm tra),
          và thông tin kỹ thuật cần thiết để vận hành hệ thống an toàn và ổn định.
        </p>
      </Section>

      <Section title="2. Cách sử dụng dữ liệu">
        <p>
          Dữ liệu được sử dụng để xác thực tài khoản, cá nhân hóa trải nghiệm học tập, thống kê tiến độ, cải thiện chất lượng sản phẩm
          và hỗ trợ giải quyết sự cố phát sinh trong quá trình sử dụng.
        </p>
        <p>
          EduApp không bán dữ liệu cá nhân cho bên thứ ba. Việc chia sẻ dữ liệu (nếu có) chỉ phục vụ vận hành kỹ thuật hoặc theo yêu cầu pháp lý.
        </p>
      </Section>

      <Section title="3. Bảo mật thông tin">
        <p>
          EduApp áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu khỏi truy cập trái phép, thất thoát hoặc thay đổi ngoài ý muốn.
          Người dùng cần bảo mật mật khẩu và đăng xuất khỏi thiết bị công cộng sau khi sử dụng.
        </p>
      </Section>

      <Section title="4. Quyền của người dùng">
        <p>
          Người dùng có quyền xem, cập nhật thông tin cá nhân trong phạm vi hệ thống cho phép, yêu cầu hỗ trợ khi phát hiện dữ liệu sai,
          và phản hồi về vấn đề bảo mật thông qua kênh liên hệ chính thức.
        </p>
      </Section>

      <Section title="5. Cookies và công nghệ tương tự">
        <p>
          EduApp có thể sử dụng cookies hoặc cơ chế lưu trữ tương đương để duy trì phiên đăng nhập, ghi nhớ tùy chọn người dùng,
          và cải thiện hiệu năng hiển thị. Bạn có thể điều chỉnh trình duyệt để quản lý cookies theo nhu cầu.
        </p>
      </Section>
    </StaticContentLayout>
  );
}
