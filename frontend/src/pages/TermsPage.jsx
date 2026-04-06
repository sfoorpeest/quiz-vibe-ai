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

export default function TermsPage() {
  return (
    <StaticContentLayout
      title="Điều khoản sử dụng"
      subtitle="Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng EduApp. Việc tiếp tục truy cập hoặc sử dụng nền tảng đồng nghĩa với việc bạn đồng ý tuân thủ các điều khoản này."
    >
      <Section title="1. Giới thiệu">
        <p>
          EduApp là nền tảng học tập trực tuyến hỗ trợ người học, giảng viên và quản trị viên trong việc quản lý nội dung, bài kiểm tra và tiến độ học tập.
          Các điều khoản này quy định quyền và trách nhiệm của tất cả bên tham gia khi sử dụng hệ thống.
        </p>
      </Section>

      <Section title="2. Quyền và nghĩa vụ người dùng">
        <p>
          Người dùng có quyền truy cập các tính năng phù hợp với vai trò tài khoản đã được cấp phát, đồng thời có nghĩa vụ cung cấp thông tin trung thực,
          bảo mật thông tin đăng nhập và chịu trách nhiệm cho mọi hoạt động phát sinh từ tài khoản của mình.
        </p>
        <p>
          Người dùng không được chia sẻ trái phép tài khoản, can thiệp hệ thống hoặc sử dụng nền tảng để thực hiện hành vi vi phạm pháp luật.
        </p>
      </Section>

      <Section title="3. Nội dung sử dụng">
        <p>
          Nội dung học liệu, câu hỏi, kết quả và tài nguyên liên quan trên EduApp chỉ được sử dụng cho mục đích học tập và giảng dạy hợp pháp.
          Người dùng không được sao chép, phát tán hoặc khai thác nội dung vì mục đích thương mại khi chưa có sự đồng ý của chủ sở hữu.
        </p>
        <p>
          EduApp có quyền tạm khóa hoặc xóa nội dung không phù hợp với chính sách vận hành, bao gồm nội dung sai sự thật, độc hại hoặc xâm phạm bản quyền.
        </p>
      </Section>

      <Section title="4. Giới hạn trách nhiệm">
        <p>
          EduApp nỗ lực đảm bảo tính sẵn sàng và độ chính xác của hệ thống, tuy nhiên không cam kết vận hành liên tục tuyệt đối trong mọi tình huống
          (bao gồm sự cố kỹ thuật, bảo trì, lỗi kết nối từ bên thứ ba).
        </p>
        <p>
          EduApp không chịu trách nhiệm đối với các thiệt hại gián tiếp hoặc mất mát dữ liệu do người dùng không thực hiện biện pháp bảo mật cần thiết.
        </p>
      </Section>

      <Section title="5. Điều khoản chung">
        <p>
          Các điều khoản có thể được cập nhật để phù hợp với tình hình vận hành và quy định pháp lý. Phiên bản mới sẽ có hiệu lực kể từ thời điểm được công bố trên hệ thống.
        </p>
        <p>
          Nếu bạn tiếp tục sử dụng EduApp sau khi điều khoản được cập nhật, điều đó được xem là sự chấp thuận đối với nội dung điều chỉnh.
        </p>
      </Section>
    </StaticContentLayout>
  );
}
