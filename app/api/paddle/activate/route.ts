import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId, subscriptionId, customerId } = await req.json();

  await supabase.from("profiles").update({
    subscription_status: "active",
    ...(subscriptionId && { paddle_subscription_id: subscriptionId }),
    ...(customerId && { paddle_customer_id: customerId }),
  }).eq("id", user.id);

  return Response.json({ ok: true });
}
