import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? 'noreply@yourdomain.com';
const BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';

export async function sendVerificationEmail(email: string, token: string, lang: 'en' | 'ru' = 'en') {
  const link = `${BASE_URL}/api/verify-email?token=${token}&lang=${lang}`;

  const subject = lang === 'ru'
    ? 'Подтвердите ваш email'
    : 'Confirm your email';

  const html = lang === 'ru' ? `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 12px">Подтвердите ваш email</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
        Нажмите на кнопку ниже, чтобы подтвердить адрес электронной почты и войти в аккаунт.
      </p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none">
        Подтвердить email
      </a>
      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">
        Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.
      </p>
    </div>
  ` : `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 12px">Confirm your email</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
        Click the button below to confirm your email address and access your account.
      </p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none">
        Confirm email
      </a>
      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">
        This link expires in 24 hours. If you didn't register, please ignore this email.
      </p>
    </div>
  `;

  await resend.emails.send({ from: FROM, to: email, subject, html });
}
