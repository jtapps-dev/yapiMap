import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false });
  }

  // Aktuellen User holen um Selbst-Einladung zu verhindern
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("referral_code", code.toUpperCase().trim())
    .eq("status", "active")
    .single();

  if (!data) return NextResponse.json({ valid: false });

  // Eigener Code → ungültig
  if (user && data.id === user.id) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, name: data.full_name });
}
