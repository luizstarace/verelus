export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/tracking";
import { createClient } from "@supabase/supabase-js";

const VALID_CATEGORIES = [
  "page_view",
  "feature_use",
  "ai_generation",
  "payment",
  "auth",
  "error",
] as const;

// In-memory rate limit store (per-instance; resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Resolve the authenticated Supabase user from the request's
 * Authorization header (Bearer <access_token>).
 */
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return user;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 20 events per minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 }
    );
  }

  // Support both single events and batched arrays
  const events = Array.isArray(body) ? body : [body];

  if (events.length === 0) {
    return NextResponse.json(
      { error: "No events provided" },
      { status: 400 }
    );
  }

  if (events.length > 25) {
    return NextResponse.json(
      { error: "Maximum 25 events per batch" },
      { status: 400 }
    );
  }

  // Validate each event
  for (const event of events) {
    if (!event.event_name || typeof event.event_name !== "string") {
      return NextResponse.json(
        { error: "event_name is required and must be a string" },
        { status: 400 }
      );
    }

    if (
      !event.event_category ||
      !VALID_CATEGORIES.includes(event.event_category)
    ) {
      return NextResponse.json(
        {
          error: `event_category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  // Resolve user from auth token (optional — anonymous events are allowed)
  const user = await getAuthUser(request);
  const userId = user?.id;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  // Insert all events
  const promises = events.map((event) =>
    trackEvent(
      event.event_name,
      event.event_category,
      event.properties ?? {},
      userId,
      {
        sessionId: event.session_id,
        ipAddress: ip,
        userAgent,
      }
    )
  );

  await Promise.all(promises);

  return NextResponse.json({ ok: true, tracked: events.length });
}
