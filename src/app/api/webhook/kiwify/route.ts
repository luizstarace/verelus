import { NextResponse } from "next/server";

export const runtime = 'edge';

// Kiwify webhook handler deprecated - moved to Stripe
export async function POST() {
  return NextResponse.json(
    {
      error: "This webhook endpoint is deprecated. Please use the Stripe webhook at /api/webhook/stripe instead.",
      deprecated: true,
      migratedTo: "/api/webhook/stripe",
    },
    { status: 410 }
  );
}
