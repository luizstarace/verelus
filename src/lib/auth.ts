import { createClient } from "@supabase/supabase-js";

// Server-side auth helper using service role key
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Validate access token (simple email-based auth for MVP)
export async function validateAccess(email: string): Promise<{
  valid: boolean;
  user?: any;
  subscription?: any;
  tier?: "free" | "starter" | "pro";
}> {
  const supabase = getServerSupabase();

  // Look up user
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user) {
    return { valid: false };
  }

  // Check active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return { valid: false, user };
  }

  // Determine tier
  let tier: "free" | "starter" | "pro" = "free";
  if (subscription.product === "bandbrain_pro") tier = "pro";
  else if (subscription.product === "bandbrain_starter") tier = "starter";
  else if (subscription.product === "tunesignal") tier = "starter";

  return { valid: true, user, subscription, tier };
}

// Module access control per tier
export const MODULE_ACCESS: Record<string, string[]> = {
  starter: ["social_calendar", "press_release", "playlist_pitch"],
  pro: ["social_calendar", "press_release", "setlist", "playlist_pitch", "monthly_report"],
};

export function canAccessModule(tier: string, moduleType: string): boolean {
  const allowed = MODULE_ACCESS[tier] || [];
  return allowed.includes(moduleType);
}
