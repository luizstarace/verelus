import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("email_subscribers")
      .select("id, status")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      if (existing.status === "unsubscribed") {
        // Re-subscribe
        await supabase
          .from("email_subscribers")
          .update({
            status: "active",
            full_name: name.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        return NextResponse.json({ success: true, resubscribed: true });
      }
      // Already active
      return NextResponse.json({ success: true, already: true });
    }

    // New subscriber
    const { error } = await supabase.from("email_subscribers").insert({
      email: email.toLowerCase().trim(),
      full_name: name.trim(),
      status: "active",
      source: "landing_page",
    });

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
