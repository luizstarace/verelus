import { createClient } from "@supabase/supabase-js";

// Server-side auth helper using service role key
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Plan types for unified Verelus product
export type PlanTier = "free" | "pro" | "business";

// Validate access token (simple email-based auth for MVP)
export async function validateAccess(email: string): Promise<{
  valid: boolean;
  user?: any;
  subscription?: any;
  tier?: PlanTier;
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
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    // User exists but no active subscription = free tier
    return { valid: true, user, tier: "free" };
  }

  // Determine tier from product
  const tier = mapProductToTier(subscription.product);

  return { valid: true, user, subscription, tier };
}

// Map product names (both old and new) to unified tiers
function mapProductToTier(product: string): PlanTier {
  switch (product) {
    case "business":
      return "business";
    case "pro":
    // Legacy mappings
    case "bandbrain_pro":
    case "bandbrain_essencial":
    case "tunesignal_premium":
      return "pro";
    default:
      return "free";
  }
}

// Module access control per tier
// Based on document master subscription_plans
export const MODULE_ACCESS: Record<PlanTier, string[]> = {
  free: [
    "artist_analysis",
    "playlist_pitch", // limited to 3/month
    "epk",            // basic only
  ],
  pro: [
    "artist_analysis",
    "playlist_pitch",  // unlimited
    "epk",
    "press_release",
    "social_calendar",
    "setlist",
    "budget",
    "rider",
    "contract",
    "monthly_report",
  ],
  business: [
    "artist_analysis",
    "playlist_pitch",  // unlimited + priority matching
    "epk",
    "press_release",
    "social_calendar",
    "setlist",
    "budget",
    "rider",
    "contract",
    "tour_plan",
    "monthly_report",
  ],
};

export function canAccessModule(tier: PlanTier, moduleType: string): boolean {
  const allowed = MODULE_ACCESS[tier] || MODULE_ACCESS.free;
  return allowed.includes(moduleType);
}

// Check pitch limit for free tier
export async function checkPitchLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = getServerSupabase();

  // Count pitches this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("pitch_submissions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  const used = count || 0;
  const limit = 3; // Free tier pitch limit

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
  };
}
