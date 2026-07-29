import { Webhook } from "standardwebhooks";
import { sendAuthEmail, type AuthEmailData, type AuthEmailUser } from "@/lib/auth-emails";

type HookPayload = {
  user: AuthEmailUser;
  email_data: AuthEmailData;
};

export async function POST(request: Request) {
  const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  if (!hookSecret) {
    console.error("SEND_EMAIL_HOOK_SECRET is not configured");
    return Response.json({ error: "Email hook not configured" }, { status: 500 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const secret = hookSecret.replace(/^v1,whsec_/, "");
  const wh = new Webhook(secret);

  try {
    const { user, email_data } = wh.verify(payload, headers) as HookPayload;
    await sendAuthEmail(user, email_data);
    return Response.json({});
  } catch (err) {
    console.error("Auth send-email hook failed:", err);
    return Response.json(
      {
        error: {
          message: err instanceof Error ? err.message : "Failed to send email",
        },
      },
      { status: 401 }
    );
  }
}
