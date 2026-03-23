import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, email, source } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("email_subscribers")
      .upsert({email:email.toLowerCase().trim(),full_name:name.trim(),source:source||"landing_page",status:"active"},{onConflict:"email"}).select().single();

    if(error){console.error("Supabase error:",error);return NextResponse.json({error:"Failed to subscribe"},{status:500});}

    if(process.env.RESEND_API_KEY){try{await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.RESEND_API_KEY}`},body:JSON.stringify({from:"TuneSignal <onboarding@resend.dev>",to:email,subject:"Welcome to TuneSignal!",html:`<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e4e4e7;padding:40px"><h1 style="color:#00ff88;font-size:28px">Welcome to TuneSignal, ${name}!</h1><p style="color:#a1a1aa;line-height:1.7">You're now part of a growing community of independent musicians.</p><p style="color:#00ff88;font-weight:bold">— The TuneSignal Team</p></div>`})});}catch(e){console.error("Email error:",e);}}

    return NextResponse.json({ success: true, subscriber: data });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
