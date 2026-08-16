import { SITE_NAME } from '@/lib/constants'

// Test mode logs messages to console instead of sending.
// Включается, если SMTP не настроен вовсе (иначе живой отправки не будет
// и письма «теряются» молча), либо явно через EMAIL_TEST_MODE=true в dev-окружении.
const TEST_MODE =
  !process.env.SMTP_HOST ||
  (process.env.NODE_ENV !== "production" &&
    process.env.EMAIL_TEST_MODE === "true");

/** Письма «отправляются» мгновенно без реальной SMTP-задержки */
export function isEmailTestMode(): boolean {
  return TEST_MODE;
}

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  if (TEST_MODE) {
    // eslint-disable-next-line no-console
    console.log("--- EMAIL (TEST MODE) ---");
    // eslint-disable-next-line no-console
    console.log(`To: ${msg.to}`);
    // eslint-disable-next-line no-console
    console.log(`Subject: ${msg.subject}`);
    // eslint-disable-next-line no-console
    console.log(`Body: ${msg.text}`);
    // eslint-disable-next-line no-console
    console.log("--- END EMAIL ---");
    return true;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@example.com",
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html || msg.text,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

export function sendPasswordResetEmail(to: string, code: string) {
  return sendEmail({
    to,
    subject: `Восстановление пароля — ${SITE_NAME}`,
    text: `Код для восстановления пароля: ${code}\n\nКод действителен в течение 15 минут.\n\nЕсли вы не запрашивали восстановление пароля, проигнорируйте это письмо.`,
    html: `
      <div style="font-family: 'EB Garamond', Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #faf8f4; border-radius: 8px;">
        <h2 style="font-family: 'Cormorant Garamond', Georgia, serif; color: #5a3e2b;">Восстановление пароля</h2>
        <p style="color: #3a2a1a;">Код для восстановления пароля:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #d4c5b0; color: #5a3e2b;">${code}</div>
        <p style="color: #7a6a5a; font-size: 13px; margin-top: 16px;">Код действителен в течение 15 минут.</p>
        <hr style="border: none; border-top: 1px solid #d4c5b0; margin: 16px 0;" />
        <p style="color: #7a6a5a; font-size: 12px;">Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
        <p style="color: #7a6a5a; font-size: 12px;">— ${SITE_NAME}</p>
      </div>
    `,
  });
}
