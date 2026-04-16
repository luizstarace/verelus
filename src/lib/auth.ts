import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type PlanTier = "free" | "pro";

export async function validateAccess(email: string): Promise<{
  valid: boolean;
  user?: any;
  subscription?: any;
  tier?: PlanTier;
}> {
  const supabase = getServerSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user) {
    return { valid: false };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return { valid: true, user, tier: "free" };
  }

  return { valid: true, user, subscription, tier: "pro" };
}
