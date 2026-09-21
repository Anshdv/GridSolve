import { getResend, getResendFromAddress } from "@/lib/resend";
import {
  emailComplianceFooterHtml,
  emailComplianceFooterText,
  getUnsubscribeUrl,
  PRIVACY_EMAIL,
} from "@/lib/legal";
import { authConfirmationUrl } from "@/lib/site";

export type AuthEmailUser = {
  email: string;
  user_metadata?: Record<string, unknown>;
  new_email?: string;
};

export type AuthEmailData = {
  token: string;
  token_hash: string;
  token_new: string;
  token_hash_new: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  old_email?: string;
};

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

const SUBJECTS: Record<string, string> = {
  signup: "Confirm your GridSolve account",
  recovery: "Reset your GridSolve password",
  magiclink: "Your GridSolve sign-in link",
  invite: "You're invited to GridSolve",
  email_change: "Confirm your new email address",
  email_change_new: "Confirm your new email address",
  reauthentication: "Your GridSolve verification code",
  email: "Confirm your email address",
};

function buildConfirmationUrl(emailData: AuthEmailData): string {
  if (!emailData.token_hash) {
    throw new Error("Auth email is missing token_hash");
  }
  return authConfirmationUrl(
    emailData.token_hash,
    emailData.email_action_type,
    emailData.redirect_to
  );
}

function isEmailOtp(token: string | undefined): boolean {
  return Boolean(token && /^\d{6,8}$/.test(token));
}

function wrapEmailHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GridSolve</title>
  </head>
  <body style="margin:0;padding:0;background:#07080a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07080a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#0f1115;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px 28px;">
            <tr>
              <td style="color:#ffffff;font-size:18px;font-weight:600;padding-bottom:8px;">GridSolve</td>
            </tr>
            <tr>
              <td style="color:#a3a3a3;font-size:15px;line-height:1.6;">${body}</td>
            </tr>
            <tr>
              <td style="color:#525252;font-size:12px;line-height:1.5;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
                If you did not request this email, you can safely ignore it.
                ${emailComplianceFooterHtml()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buttonHtml(label: string, href: string): string {
  return `<p style="margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#3d7bff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">
      ${label}
    </a>
  </p>
  <p style="margin:0;color:#737373;font-size:12px;word-break:break-all;">Or copy this link:<br /><a href="${href}" style="color:#5b93ff;">${href}</a></p>`;
}

function buildEmailContent(
  user: AuthEmailUser,
  emailData: AuthEmailData
): EmailContent | null {
  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
  const greeting = name ? `Hi ${name},` : "Hi,";
  const action = emailData.email_action_type;

  if (action === "reauthentication") {
    const subject = SUBJECTS.reauthentication;
    const html = wrapEmailHtml(
      `<p style="margin:0 0 12px;color:#e5e5e5;">${greeting}</p>
       <p style="margin:0 0 16px;">Use this verification code to continue:</p>
       <p style="margin:0;font-size:28px;letter-spacing:0.2em;color:#ffffff;font-weight:700;">${emailData.token}</p>`
    );
    const text = `${greeting}\n\nYour verification code is: ${emailData.token}\n\nThis code expires shortly.${emailComplianceFooterText()}`;
    return { subject, html, text };
  }

  const linkActions = new Set([
    "signup",
    "recovery",
    "magiclink",
    "invite",
    "email_change",
    "email_change_new",
    "email",
  ]);

  if (!linkActions.has(action)) {
    return null;
  }

  const confirmationUrl = buildConfirmationUrl(emailData);
  const subject = SUBJECTS[action] ?? "GridSolve notification";
  const showOtp =
    isEmailOtp(emailData.token) &&
    (action === "magiclink" || action === "email");

  const copy: Record<string, { title: string; body: string; cta: string }> = {
    signup: {
      title: "Confirm your email",
      body: "Thanks for signing up. Confirm your email address to activate your GridSolve account.",
      cta: "Confirm email",
    },
    recovery: {
      title: "Reset your password",
      body: "We received a request to reset your password. Choose a new one using the button below.",
      cta: "Reset password",
    },
    magiclink: {
      title: "Sign in to GridSolve",
      body: "Use the secure link below to sign in. It expires shortly and can only be used once.",
      cta: "Sign in",
    },
    invite: {
      title: "You're invited",
      body: "You've been invited to create a GridSolve account.",
      cta: "Accept invitation",
    },
    email_change: {
      title: "Confirm email change",
      body: "Confirm this change to the email address on your GridSolve account.",
      cta: "Confirm email change",
    },
    email_change_new: {
      title: "Confirm new email",
      body: "Confirm this address as the new email for your GridSolve account.",
      cta: "Confirm new email",
    },
    email: {
      title: "Confirm your email",
      body: "Confirm your email address to continue using GridSolve.",
      cta: "Confirm email",
    },
  };

  const content = copy[action] ?? copy.signup;
  const otpBlock = showOtp
    ? `<p style="margin:16px 0 8px;">Or enter this 6-digit code on the sign-in page:</p>
       <p style="margin:0 0 16px;font-size:28px;letter-spacing:0.2em;color:#ffffff;font-weight:700;">${emailData.token}</p>`
    : "";
  const html = wrapEmailHtml(
    `<p style="margin:0 0 12px;color:#e5e5e5;">${greeting}</p>
     <p style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:600;">${content.title}</p>
     <p style="margin:0 0 4px;">${content.body}</p>
     ${buttonHtml(content.cta, confirmationUrl)}
     ${otpBlock}`
  );
  const text = showOtp
    ? `${greeting}\n\n${content.title}\n${content.body}\n\nCode: ${emailData.token}\n\nOr sign in: ${confirmationUrl}${emailComplianceFooterText()}`
    : `${greeting}\n\n${content.title}\n${content.body}\n\n${confirmationUrl}${emailComplianceFooterText()}`;

  return { subject, html, text };
}

export async function sendAuthEmail(
  user: AuthEmailUser,
  emailData: AuthEmailData
): Promise<void> {
  const content = buildEmailContent(user, emailData);

  // Notification-only events don't need a user-facing email from us.
  if (!content) {
    return;
  }

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: [user.email],
    subject: content.subject,
    html: content.html,
    text: content.text,
    headers: {
      "List-Unsubscribe": `<${getUnsubscribeUrl()}>, <mailto:${PRIVACY_EMAIL}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}
