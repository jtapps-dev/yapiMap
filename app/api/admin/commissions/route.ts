import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function isAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

export async function GET() {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("commissions")
    .select("id, amount, status, created_at, referrer:referrer_id(full_name, email, iban), referred:referred_id(full_name, email)")
    .order("created_at", { ascending: false });

  return NextResponse.json({ commissions: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const admin = createAdminClient();
  await admin.from("commissions").update({ status: "paid" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
