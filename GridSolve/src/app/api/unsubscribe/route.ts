import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    /* empty body is fine — Gmail one-click POST may send no JSON */
  }
  return new NextResponse(null, { status: 202 });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/unsubscribe", request.url));
}
