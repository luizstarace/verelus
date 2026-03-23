import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROMPTS: Record<string, (band: string, genre: string, ctx: string) => string> = {
  social_calendar: (band, genre, ctx) => `
You are a social media manager for independent bands. Create a 30-day social media content calendar for "${band}" (genre: ${genre}).

${ctx ? `Additional context: ${ctx}` : ""}

For each day, provide:
- Day number and suggested day of week
- Platform (Instagram, TikTok, Twitter/X)
- Content type (Reel, Story, Post, Thread, etc.)
- Caption/description (ready to use)
- Hashtags (5-8 relevant ones)

Make it varied, engaging, and authentic to the band's genre. Include a mix of: behind-the-scenes, music teasers, fan engagement, storytelling, and promotional content. Write in a natural, non-corporate tone.
  `.trim(),

  press_release: (band, genre, ctx) => `
You are a professional music publicist. Write a press release for "${band}" (genre: ${genre}).

${ctx ? `Context: ${ctx}` : "The band is releasing new music."}

Include:
- Headline (attention-grabbing)
- Subheadline
- Dateline (use today's date)
- Opening paragraph (who, what, when, where, why)
- Quote from the band (make it authentic and personal)
- Background/bio paragraph
- Closing details (availability, links section)
- Boilerplate/About section

Write it professionally but with personality. Format it as a real press release ready to send to media outlets.
  `.trim(),

  setlist: (band, genre, ctx) => `
You are a live music consultant. Suggest an optimal setlist for "${band}" (genre: ${genre}).

${ctx ? `Context: ${ctx}` : "A typical 60-minute headline set."}

Provide:
- A structured setlist with song slots (12-15 songs for 60 min)
- For each slot: position rationale, energy level (1-10), suggested tempo
- Opening strategy (how to grab attention)
- Mid-set dynamics (when to slow down, speed up)
- Encore strategy
- General tips for stage presence and transitions

Since I don't know their actual songs, create placeholder slots like "High-energy opener", "Fan favorite", "New single", etc. with specific guidance for each position.
  `.trim(),

  playlist_pitch: (band, genre, ctx) => `
You are a music marketing specialist. Write a personalized pitch email for "${band}" (genre: ${genre}) to send to playlist curators.

${ctx ? `Context: ${ctx}` : "Pitching their latest release."}

Write 3 versions:
1. SHORT (for busy curators) - 3-4 sentences max
2. MEDIUM (for engaged curators) - 1 paragraph + key details
3. DETAILED (for blog/editorial curators) - full pitch with story

Each version should:
- Have a compelling subject line
- Be personal, not template-y
- Highlight what makes the music unique
- Include a clear call-to-action
- Feel human and authentic

Also provide tips on: when to send, follow-up timing, and what NOT to do.
  `.trim(),

  monthly_report: (band, genre, ctx) => `
You are a music business analyst. Create a monthly strategy report template for "${band}" (genre: ${genre}).

${ctx ? `Additional context: ${ctx}` : ""}

Create a comprehensive report with:

1. EXECUTIVE SUMMARY
   - Key metrics to track (Spotify streams, social followers, engagement rate, email list growth)
   - Month-over-month comparison framework

2. CONTENT PERFORMANCE
   - Which types of content to analyze
   - Benchmarks for the ${genre} genre
   - What "good" looks like at their stage

3. AUDIENCE INSIGHTS
   - Demographics to monitor
   - Engagement patterns to watch
   - Fan sentiment analysis approach

4. OPPORTUNITIES
   - Playlist pitching targets for this month
   - Collaboration opportunities
   - Sync licensing angles for ${genre}

5. ACTION ITEMS
   - Top 5 priorities for next month
   - Quick wins (things they can do this week)
   - Long-term goals check-in

Make it practical and actionable, not just theoretical.
  `.trim(),
};

export async function POST(req: NextRequest) {
  try {
    const { type, bandName, genre, context: ctx } = await req.json();

    if (!type || !bandName || !genre) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const promptFn = PROMPTS[type];
    if (!promptFn) {
      return NextResponse.json({ error: "Invalid module type" }, { status: 400 });
    }

    const prompt = promptFn(bandName, genre, ctx || "");

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const content2 = data.content?.[0]?.text || "No content generated";
    const tokensUsed = data.usage?.output_tokens || 0;

    // Log to Supabase
    await supabase.from("ai_outputs").insert({
      type,
      status: "completed",
      input_data: { bandName, genre, context: ctx },
      output_content: content2,
      tokens_used: tokensUsed,
    });

    return NextResponse.json({ content: content2, tokensUsed });
  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
