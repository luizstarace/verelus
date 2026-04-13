import { NextResponse } from "next/server";

export const runtime = "edge";

const startTime = Date.now();

interface ServiceStatus {
  status: string;
  latency_ms?: number;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { status: "down", latency_ms: 0 };
  }

  const start = performance.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    const latency_ms = Math.round(performance.now() - start);
    return { status: res.ok ? "up" : "down", latency_ms };
  } catch {
    const latency_ms = Math.round(performance.now() - start);
    return { status: "down", latency_ms };
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { status: "down", latency_ms: 0 };
  }

  const start = performance.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    const latency_ms = Math.round(performance.now() - start);
    return { status: res.ok ? "up" : "down", latency_ms };
  } catch {
    const latency_ms = Math.round(performance.now() - start);
    return { status: "down", latency_ms };
  }
}

function checkEnvKey(envVar: string): ServiceStatus {
  return { status: process.env[envVar] ? "configured" : "missing" };
}

export async function GET() {
  const [supabase, stripe] = await Promise.all([
    checkSupabase(),
    checkStripe(),
  ]);

  const anthropic = checkEnvKey("ANTHROPIC_API_KEY");
  const resend = checkEnvKey("RESEND_API_KEY");

  const services = { supabase, stripe, anthropic, resend };

  const critical = [supabase.status, stripe.status];
  const allUp = critical.every((s) => s === "up");
  const allDown = critical.every((s) => s === "down");

  let status: "healthy" | "degraded" | "unhealthy";
  if (allUp) {
    status = "healthy";
  } else if (allDown) {
    status = "unhealthy";
  } else {
    status = "degraded";
  }

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - startTime) / 1000),
      services,
      version: "1.0.0",
    },
    {
      status: status === "unhealthy" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
