const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (email, link) => {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Đặt lại mật khẩu</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .content p { margin: 0 0 15px 0; font-size: 16px; }
        .btn-container { text-align: center; margin: 35px 0; }
        .btn { background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; }
        .btn:hover { background-color: #1d4ed8; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 13px; color: #64748b; }
        .link-text { word-break: break-all; font-size: 13px; color: #94a3b8; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>QuizVibe AI</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này. Để tiếp tục, vui lòng nhấn vào nút bên dưới:</p>
          
          <div class="btn-container">
            <a href="${link}" style="background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Tạo Mật Khẩu Mới</a>
          </div>
          
          <p>Vì lý do bảo mật, nút bấm này sẽ <strong>hết hạn sau 15 phút</strong>. Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua email và mật khẩu của bạn vẫn an toàn.</p>
          
          <p>Hoặc bạn có thể sao chép đường dẫn này và dán vào trình duyệt:</p>
          <p class="link-text">${link}</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} QuizVibe AI Platform. Mọi quyền được bảo lưu.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: '"Quiz Vibe AI - Hỗ Trợ" <noreply@quizvibe.vn>',
    to: email, // <--- THƯ SẼ ĐƯỢC GỬI ĐẾN ĐỊA CHỈ EMAIL DO NGƯỜI DÙNG NHẬP VÀO
    subject: "Hành động yêu cầu: Đặt lại mật khẩu QuizVibe AI",
    html: emailTemplate
  });
};

module.exports = { sendResetEmail };