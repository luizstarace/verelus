export const runtime = "edge";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get authenticated user from Supabase session
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ tier: "free" });
    }

    // Use service role to query subscription
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find user in our users table
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email.toLowerCase().trim())
      .single();

    if (!dbUser) {
      return NextResponse.json({ tier: "free" });
    }

    // Check active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("product, status")
      .eq("user_id", dbUser.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({ tier: "free" });
    }

    const tier = subscription.product === "business" ? "business" : subscription.product === "pro" ? "pro" : "free";
    return NextResponse.json({ tier });
  } catch {
    return NextResponse.json({ tier: "free" });
  }
}
