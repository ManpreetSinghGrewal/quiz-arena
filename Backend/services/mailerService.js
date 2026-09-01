import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT) || 465;

  // Check if SMTP is configured correctly
  if (!user || user.includes("your-email") || !pass || pass.includes("your-smtp-app-password")) {
    console.warn("⚠️ SMTP credentials not set or set to placeholders in .env. Mailer will run in DEV console logging mode.");
    return null;
  }

  // Use dedicated Gmail service configuration if Gmail address is detected
  if (host.includes("gmail") || user.endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

// Verify connection on startup
const startupTransporter = createTransporter();
if (startupTransporter) {
  startupTransporter.verify((error) => {
    if (error) {
      console.error("❌ SMTP Connection verification failed:", error.message);
    } else {
      console.log(`✅ SMTP Server is ready to send emails via ${process.env.EMAIL_USER}`);
    }
  });
}

const sendMailAsync = async (options) => {
  // 1. Primary: Use Brevo HTTPS API (Universal delivery to ANY email without custom domain required)
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  if (brevoApiKey && !brevoApiKey.includes("your-brevo-api-key")) {
    try {
      const senderEmail = process.env.EMAIL_USER || "manpreetsgrewal5911@gmail.com";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "QuizArena",
            email: senderEmail,
          },
          to: [
            {
              email: options.to,
            },
          ],
          subject: options.subject,
          textContent: options.text,
          htmlContent: options.html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Brevo Error: ${res.statusText}`);
      }
      console.log(`✉️ [Brevo HTTPS] Email successfully sent to ${options.to}. MessageID: ${data.messageId}`);
      return { messageId: data.messageId, brevo: true };
    } catch (brevoError) {
      console.warn(`⚠️ Brevo dispatch failed for ${options.to}, attempting fallbacks:`, brevoError.message);
    }
  }

  // 2. Secondary: Use Resend HTTPS API (bypasses Render/Cloud SMTP port blocks)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey && !resendApiKey.includes("your-resend-api-key")) {
    try {
      const from = process.env.RESEND_FROM || "QuizArena <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Resend Error: ${res.statusText}`);
      }
      console.log(`✉️ [Resend HTTPS] Email successfully sent to ${options.to}. ID: ${data.id}`);
      return { messageId: data.id, resend: true };
    } catch (resendError) {
      console.warn(`⚠️ Resend dispatch failed for ${options.to}, falling back to SMTP:`, resendError.message);
    }
  }

  // 3. Fallback: Use Nodemailer SMTP
  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_USER || "noreply@quizarena.com";

  if (!transporter) {
    console.log("=========================================");
    console.log(`✉️ [DEV MAIL LOG] To: ${options.to}`);
    console.log(`✉️ Subject: ${options.subject}`);
    console.log(`✉️ Text Content:\n${options.text}`);
    console.log("=========================================");
    return { mock: true, messageId: "mock-id-" + Math.random().toString(36).substr(2, 9) };
  }

  try {
    const info = await transporter.sendMail({
      from: `"QuizArena" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`✉️ Email successfully sent to ${options.to}. MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error.message);
    throw error;
  }
};

/**
 * Sends a 6-digit OTP code for password resets.
 */
export const sendPasswordResetEmail = async (recipientEmail, name, resetCode) => {
  const subject = "QuizArena Password Reset OTP Code";
  const text = `Hello ${name},\n\nYour 6-digit verification code to reset your password is: ${resetCode}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c0a18; color: #f8fafc; padding: 2rem; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e1b4b;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #a855f7; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">QuizArena</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Security Verification</p>
      </div>
      <div style="background-color: #110e2e; padding: 1.5rem; border-radius: 8px; border: 1px solid #2e1065; text-align: center;">
        <p style="font-size: 16px; color: #e2e8f0; margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #94a3b8;">You requested to reset your password. Use the verification code below to authorize this request:</p>
        <div style="font-size: 32px; font-weight: 800; color: #d946ef; letter-spacing: 6px; margin: 1.5rem 0; padding: 0.5rem; background-color: rgba(217, 70, 239, 0.08); border-radius: 6px; display: inline-block;">
          ${resetCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 2rem; font-size: 11px; color: #475569;">
        © 2026 QuizArena. All rights reserved.
      </div>
    </div>
  `;

  return sendMailAsync({ to: recipientEmail, subject, text, html });
};

/**
 * Sends a welcome email upon registration.
 */
export const sendWelcomeEmail = async (recipientEmail, name) => {
  const subject = "Welcome to the QuizArena! 🚀";
  const text = `Hello ${name},\n\nWelcome to QuizArena! You've joined the ultimate quiz arena where you can challenge yourself, track stats, and battle peers in real-time.\n\nLog in now to start your first challenge!`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c0a18; color: #f8fafc; padding: 2rem; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e1b4b;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #a855f7; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">QuizArena</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your quiz journey starts here</p>
      </div>
      <div style="background-color: #110e2e; padding: 2rem; border-radius: 8px; border: 1px solid #2e1065;">
        <h2 style="color: #e2e8f0; font-size: 20px; font-weight: 700; margin-top: 0; text-align: center;">Welcome to the Arena, ${name}! 🎉</h2>
        <p style="font-size: 15px; color: #94a3b8; line-height: 1.6; text-align: center;">
          You've successfully created your account. Get ready to test your knowledge, master complex Computer Science topics, and compete with aspirants worldwide!
        </p>
        <div style="margin: 2rem 0; padding: 1.5rem; background-color: rgba(168, 85, 247, 0.05); border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.15);">
          <h3 style="color: #c084fc; font-size: 15px; margin-top: 0;">Here's what you can do right now:</h3>
          <ul style="color: #e2e8f0; font-size: 13.5px; padding-left: 20px; margin-bottom: 0; line-height: 1.8;">
            <li>📖 <strong>Practice Quizzes:</strong> Test yourself in Operating Systems, Networks, DBMS, and more.</li>
            <li>⚔️ <strong>Battle Mode:</strong> Face off in real-time PVP match-ups or practice against TuringBot.</li>
            <li>🏆 <strong>Leaderboard:</strong> Score points and rank up globally.</li>
            <li>⚡ <strong>Mastery Charts:</strong> Track your stats and review past mistakes dynamically.</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 2rem;">
          <a href="http://localhost:5173/login" style="background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%); color: white; padding: 0.85rem 2rem; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.35);">
            Enter the Arena
          </a>
        </div>
      </div>
      <div style="text-align: center; margin-top: 2rem; font-size: 11px; color: #475569;">
        © 2026 QuizArena. All rights reserved.
      </div>
    </div>
  `;

  return sendMailAsync({ to: recipientEmail, subject, text, html });
};

/**
 * Sends a 6-digit OTP code for sign up email verification.
 */
export const sendVerificationEmail = async (recipientEmail, name, verificationCode) => {
  const subject = "QuizArena Registration Verification OTP Code";
  const text = `Hello ${name},\n\nWelcome to QuizArena! Your 6-digit verification code to activate your account is: ${verificationCode}\n\nThis code expires in 15 minutes.`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c0a18; color: #f8fafc; padding: 2rem; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e1b4b;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #a855f7; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">QuizArena</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Registration Activation</p>
      </div>
      <div style="background-color: #110e2e; padding: 1.5rem; border-radius: 8px; border: 1px solid #2e1065; text-align: center;">
        <p style="font-size: 16px; color: #e2e8f0; margin-top: 0;">Welcome, <strong>${name}</strong>!</p>
        <p style="font-size: 14px; color: #94a3b8;">Use the verification OTP code below to activate your account and start your quiz journey:</p>
        <div style="font-size: 32px; font-weight: 800; color: #3b82f6; letter-spacing: 6px; margin: 1.5rem 0; padding: 0.5rem; background-color: rgba(59, 130, 246, 0.08); border-radius: 6px; display: inline-block;">
          ${verificationCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">This OTP code is valid for <strong>15 minutes</strong>. Enter this code on the verification screen to activate your account.</p>
      </div>
      <div style="text-align: center; margin-top: 2rem; font-size: 11px; color: #475569;">
        © 2026 QuizArena. All rights reserved.
      </div>
    </div>
  `;

  return sendMailAsync({ to: recipientEmail, subject, text, html });
};
