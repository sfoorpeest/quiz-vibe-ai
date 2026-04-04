const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'email-cua-ban@gmail.com',
    pass: 'mat-khau-ung-dung-cua-google' // Không phải mật khẩu gmail bình thường
  }
});

const sendResetEmail = async (email, link) => {
  await transporter.sendMail({
    from: '"Quiz Vibe AI" <noreply@quizvibe.com>',
    to: email,
    subject: "Đặt lại mật khẩu của bạn",
    html: `<p>Bạn nhận được yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link dưới đây để tiếp tục:</p>
           <a href="${link}">${link}</a>
           <p>Link này sẽ hết hạn sau 15 phút.</p>`
  });
};

module.exports = { sendResetEmail };