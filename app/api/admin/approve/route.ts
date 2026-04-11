import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Nur Admin darf freischalten
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  const admin = createAdminClient();

  // Status auf approved setzen
  await admin.from("profiles").update({ status: "active" }).eq("id", userId);

  // Password-Reset Email schicken (User setzt sein Passwort)
  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  if (targetUser.user?.email) {
    await admin.auth.resetPasswordForEmail(targetUser.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/set-password`,
    });
  }

  return NextResponse.json({ success: true });
}
