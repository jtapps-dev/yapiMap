import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

const schema = z.object({ userId: z.string().uuid() });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { userId } = result.data;

  const { error } = await supabase
    .from("profiles")
    .update({ status: "rejected" })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ablehnungs-Email senden
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (profile?.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "YapıMap <noreply@yapimap.com>",
      to: profile.email,
      subject: "YapıMap – Başvurunuz Hakkında / About Your Application",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#E8B84B">YapıMap</h2>
          <p>Merhaba ${profile.full_name || ""},</p>
          <p>Üzgünüz, başvurunuz incelendi ve onaylanmadı.</p>
          <p>Daha fazla bilgi için bizimle iletişime geçebilirsiniz.</p>
          <hr style="margin:24px 0;border-color:#eee"/>
          <p>Hi ${profile.full_name || ""},</p>
          <p>We're sorry, your application has been reviewed and was not approved.</p>
          <p>Please contact us for more information.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
