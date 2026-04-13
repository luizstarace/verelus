import { getServerSupabase } from "./auth";

type EventCategory =
  | "page_view"
  | "feature_use"
  | "ai_generation"
  | "payment"
  | "auth"
  | "error";

type ErrorType = "api_error" | "client_error" | "webhook_error" | "auth_error";

type Severity = "low" | "medium" | "high" | "critical";

type OnboardingField =
  | "profile_completed"
  | "first_generation"
  | "first_export"
  | "spotify_connected"
  | "first_pitch"
  | "welcome_email_sent"
  | "onboarding_completed";

/**
 * Track an analytics event (server-side).
 */
export async function trackEvent(
  eventName: string,
  category: EventCategory,
  properties: Record<string, unknown> = {},
  userId?: string,
  meta?: { sessionId?: string; ipAddress?: string; userAgent?: string }
) {
  const supabase = getServerSupabase();

  const { error } = await supabase.from("events").insert({
    event_name: eventName,
    event_category: category,
    properties,
    user_id: userId ?? null,
    session_id: meta?.sessionId ?? null,
    ip_address: meta?.ipAddress ?? null,
    user_agent: meta?.userAgent ?? null,
  });

  if (error) {
    console.error("[tracking] Failed to insert event:", error.message);
  }
}

/**
 * Log an error for monitoring and debugging (server-side).
 */
export async function trackError(
  errorType: ErrorType,
  message: string,
  stack?: string,
  endpoint?: string,
  userId?: string,
  severity: Severity = "medium",
  meta?: { ipAddress?: string; requestBody?: Record<string, unknown> }
) {
  const supabase = getServerSupabase();

  const { error } = await supabase.from("error_logs").insert({
    error_type: errorType,
    error_message: message,
    error_stack: stack ?? null,
    endpoint: endpoint ?? null,
    user_id: userId ?? null,
    severity,
    ip_address: meta?.ipAddress ?? null,
    request_body: meta?.requestBody ?? null,
  });

  if (error) {
    console.error("[tracking] Failed to insert error log:", error.message);
  }
}

/**
 * Update a single onboarding progress field for a user.
 * Creates the row on first call (upsert).
 */
export async function updateOnboarding(
  userId: string,
  field: OnboardingField,
  value: boolean
) {
  const supabase = getServerSupabase();

  const { error } = await supabase
    .from("onboarding_progress")
    .upsert(
      {
        user_id: userId,
        [field]: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[tracking] Failed to update onboarding:", error.message);
  }
}

/**
 * Get current onboarding progress for a user.
 * Returns null if the user has no onboarding row yet.
 */
export async function getOnboardingProgress(userId: string) {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned — that's fine, just means no progress yet
    console.error(
      "[tracking] Failed to fetch onboarding progress:",
      error.message
    );
  }

  return data ?? null;
}
