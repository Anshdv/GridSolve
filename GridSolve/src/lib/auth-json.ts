import { NextResponse } from "next/server";

export function jsonError(message: string, status: number, retryAfterSec?: number) {
  const res = NextResponse.json({ error: message }, { status });
  if (retryAfterSec) {
    res.headers.set("Retry-After", String(retryAfterSec));
  }
  return res;
}

export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
