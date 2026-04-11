import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/pending");

  // Pending → Warte-Seite
  if (profile.status === "pending" || profile.status === "approved") {
    redirect("/pending");
  }

  // Weiterleitung je nach Rolle
  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "developer") redirect("/developer");
  redirect("/broker/map");
}
