import { NextResponse } from "next/server";

export const runtime = 'edge';

// Kiwify webhook handler deprecated - moved to Stripe
export async function POST() {
  try {
  return NextResponse.json(
    {
      error: "This webhook endpoint is deprecated. Please use the Stripe webhook at /api/webhook/stripe instead.",
      deprecated: true,
      migratedTo: "/api/webhook/stripe",
    },
    { status: 410 }
  );
  } catch (error) {
    console.error("Kiwify webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
