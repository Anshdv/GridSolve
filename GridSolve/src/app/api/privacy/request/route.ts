import { NextResponse } from "next/server";
import { PRIVACY_EMAIL } from "@/lib/legal";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getResend, getResendFromAddress, isResendConfigured } from "@/lib/resend";

const TYPES = new Set(["access", "correction", "deletion"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const limited = rateLimit(`privacy:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = "email" in body && typeof body.email === "string" ? body.email.trim() : "";
  const type = "type" in body && typeof body.type === "string" ? body.type : "";
  const detail =
    "detail" in body && typeof body.detail === "string" ? body.detail.trim().slice(0, 2000) : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!TYPES.has(type)) {
    return NextResponse.json({ error: "Choose a request type." }, { status: 400 });
  }
  if (!isResendConfigured()) {
    return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
  }

  const safeEmail = escapeHtml(email);
  const safeDetail = escapeHtml(detail || "(none)");

  const { error } = await getResend().emails.send({
    from: getResendFromAddress(),
    to: PRIVACY_EMAIL,
    replyTo: email,
    subject: `GridSolve data request (${type})`,
    text: [`Type: ${type}`, `Email: ${email}`, "", detail || "(none)"].join("\n"),
    html: `<p>Type: ${escapeHtml(type)}</p><p>Email: ${safeEmail}</p><p>${safeDetail}</p>`,
  });

  if (error) {
    return NextResponse.json({ error: "Could not send." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
