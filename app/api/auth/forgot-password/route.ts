import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const schema = z.object({
  email: z.string().email().max(255),
  redirectTo: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, redirectTo } = result.data;

  // Status prüfen – nur aktive User dürfen Reset-Email erhalten
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("email", email)
    .single();

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "not_active" }, { status: 403 });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
