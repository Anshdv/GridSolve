import { createClient } from "@/lib/supabase/server";
import { PLAN_CAPABILITIES, planForEmail } from "@/lib/plans";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { authenticated: false, plan: PLAN_CAPABILITIES.free },
      { status: 401 }
    );
  }

  return Response.json({
    authenticated: true,
    plan: planForEmail(user.email),
  });
}
