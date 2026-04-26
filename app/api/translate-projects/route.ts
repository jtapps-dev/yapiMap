import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

async function translateText(text: string, from: string, to: string): Promise<string> {
  const langMap: Record<string, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU" };
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langMap[from]}|${langMap[to]}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const t = data.responseData?.translatedText;
    if (t && t !== "QUERY LENGTH LIMIT EXCEDEED") return t;
  } catch {}
  return text;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Alle Projekte des Developers holen
  const { data: projects } = await admin
    .from("projects")
    .select("id, description, description_en, description_ru, payment_plan, payment_plan_en, payment_plan_ru")
    .eq("developer_id", user.id);

  if (!projects?.length) return Response.json({ updated: 0 });

  let updated = 0;
  for (const p of projects) {
    const patch: Record<string, string> = {};

    // Description übersetzen wenn TR vorhanden
    if (p.description?.trim()) {
      if (!p.description_en) patch.description_en = await translateText(p.description, "tr", "en");
      if (!p.description_ru) patch.description_ru = await translateText(p.description, "tr", "ru");
    }

    // Payment Plan übersetzen wenn TR vorhanden
    if (p.payment_plan?.trim()) {
      if (!p.payment_plan_en) patch.payment_plan_en = await translateText(p.payment_plan, "tr", "en");
      if (!p.payment_plan_ru) patch.payment_plan_ru = await translateText(p.payment_plan, "tr", "ru");
    }

    if (Object.keys(patch).length > 0) {
      await admin.from("projects").update(patch).eq("id", p.id);
      updated++;
    }
  }

  return Response.json({ updated });
}
