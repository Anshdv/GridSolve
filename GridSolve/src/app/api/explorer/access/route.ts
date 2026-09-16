import { createClient } from "@/lib/supabase/server";
import { hasExplorerFullAccess } from "@/lib/explorerAccess";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ authenticated: false, hasFullAccess: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    hasFullAccess: hasExplorerFullAccess(user.email),
  });
}
