import { NextRequest, NextResponse } from "next/server";
import { validateAccess } from "@/lib/auth";

export const runtime = 'edge';
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Decode token
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());

    // Check expiration
    if (decoded.exp < Date.now()) {
      return NextResponse.json({ valid: false, error: "Token expired" }, { status: 401 });
    }

    // Re-validate against DB
    const access = await validateAccess(decoded.email);

    if (!access.valid) {
      return NextResponse.json({ valid: false, error: "Subscription inactive" }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: access.user.id,
        email: access.user.email,
        name: access.user.full_name,
        tier: access.tier,
      },
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
