const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const smtpService = process.env.SMTP_SERVICE || 'gmail';
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const contactReceiver = process.env.CONTACT_RECEIVER || smtpUser;
const blockedTlds = new Set(['example', 'invalid', 'localhost', 'local', 'test', 'fake']);
const trustedMailDomains = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com'
]);
let transportVerifyPromise = null;

const transporter = nodemailer.createTransport({
  service: smtpService,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

const isEmailStructureValid = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return false;
  }

  const email = rawEmail.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) {
    return false;
  }

  const basicRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i;
  if (!basicRegex.test(email)) {
    return false;
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return false;
  }

  if (localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }

  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/i.test(tld) || blockedTlds.has(tld.toLowerCase())) {
    return false;
  }

  // Reject obviously unrealistic domains like single-char second-level domains (e.g. g.com, m.co)
  const secondLevel = labels[labels.length - 2];
  if (!secondLevel || secondLevel.length < 2) {
    return false;
  }

  return labels.every((label) => /^[a-z0-9-]{1,63}$/i.test(label) && !label.startsWith('-') && !label.endsWith('-'));
};

const hasMxRecords = async (domain) => {
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (error) {
    return false;
  }
};

const validateContactEmail = async (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!isEmailStructureValid(normalized)) {
    return { valid: false, normalized, reason: 'INVALID_FORMAT' };
  }

  const domain = normalized.split('@')[1];
  const hasMx = await hasMxRecords(domain);
  if (!hasMx && !trustedMailDomains.has(domain)) {
    return { valid: false, normalized, reason: 'INVALID_DOMAIN' };
  }

  return { valid: true, normalized, reason: null };
};

const ensureTransporterReady = async () => {
  if (!transportVerifyPromise) {
    transportVerifyPromise = transporter.verify().catch((error) => {
      transportVerifyPromise = null;
      throw error;
    });
  }
  return transportVerifyPromise;
};

const normalizeAddress = (value) => String(value || '').trim().toLowerCase();

const assertDeliverySucceeded = (info, expectedRecipient) => {
  const expected = normalizeAddress(expectedRecipient);
  const accepted = Array.isArray(info?.accepted) ? info.accepted.map(normalizeAddress) : [];
  const rejected = Array.isArray(info?.rejected) ? info.rejected.map(normalizeAddress) : [];
  const deliveredToExpected = accepted.some((item) => item === expected);

  if (!deliveredToExpected || rejected.length > 0) {
    const error = new Error('Email delivery was not accepted by SMTP server.');
    error.code = 'EMAIL_DELIVERY_FAILED';
    error.smtp = {
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
      response: info?.response || null
    };
    throw error;
  }
};

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

  await ensureTransporterReady();
  await transporter.sendMail({
    from: '"Quiz Vibe AI - Hỗ Trợ" <noreply@quizvibe.vn>',
    to: email, // <--- THƯ SẼ ĐƯỢC GỬI ĐẾN ĐỊA CHỈ EMAIL DO NGƯỜI DÙNG NHẬP VÀO
    subject: "Hành động yêu cầu: Đặt lại mật khẩu QuizVibe AI",
    html: emailTemplate
  });
};

const sendSupportNotificationToAdmin = async ({ name, email, message }) => {
  const adminEmail = contactReceiver;
  
  const emailTemplate = `
    <h3>Bạn có một yêu cầu hỗ trợ mới từ người dùng</h3>
    <p><strong>Họ tên:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Nội dung:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  await ensureTransporterReady();
  const info = await transporter.sendMail({
    from: '"Quiz Vibe AI - Hệ Thống" <noreply@quizvibe.vn>',
    to: adminEmail,
    replyTo: email,
    subject: "[SUPPORT TICKET] Yêu cầu hỗ trợ từ " + name,
    html: emailTemplate
  });
  assertDeliverySucceeded(info, adminEmail);
};

const sendSupportConfirmationToUser = async (email, name) => {
  const emailTemplate = `
    <p>Xin chào ${name},</p>
    <p>Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn. Đội ngũ kỹ thuật của QuizVibe AI sẽ kiểm tra và phản hồi lại cho bạn thông qua email này trong vòng 24 giờ tới.</p>
    <p>Cảm ơn bạn đã đồng hành cùng QuizVibe AI!</p>
    <br>
    <p>Trân trọng,</p>
    <p>Đội ngũ QuizVibe AI</p>
  `;

  await ensureTransporterReady();
  const info = await transporter.sendMail({
    from: '"Quiz Vibe AI - Hỗ Trợ" <noreply@quizvibe.vn>',
    to: email,
    subject: "Xác nhận: Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn",
    html: emailTemplate
  });
  assertDeliverySucceeded(info, email);
};

module.exports = { sendResetEmail, sendSupportNotificationToAdmin, sendSupportConfirmationToUser, validateContactEmail };