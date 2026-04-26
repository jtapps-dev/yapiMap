import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.text();

  const event = JSON.parse(body);
  const supabase = await createClient();

  if (event.event_type === "transaction.completed") {
    const userId = event.data?.custom_data?.userId;
    const customerId = event.data?.customer_id;
    const subscriptionId = event.data?.subscription_id;

    if (userId) {
      await supabase.from("profiles").update({
        subscription_status: "active",
        paddle_subscription_id: subscriptionId ?? null,
        paddle_customer_id: customerId ?? null,
      }).eq("id", userId);
    }
  }

  if (event.event_type === "subscription.activated" || event.event_type === "subscription.updated") {
    const userId = event.data?.custom_data?.userId;
    const subscriptionId = event.data?.id;
    const customerId = event.data?.customer_id;

    if (userId) {
      await supabase.from("profiles").update({
        subscription_status: "active",
        paddle_subscription_id: subscriptionId,
        paddle_customer_id: customerId,
      }).eq("id", userId);
    }
  }

  if (event.event_type === "subscription.cancelled" || event.event_type === "subscription.paused") {
    const userId = event.data?.custom_data?.userId;
    if (userId) {
      await supabase.from("profiles").update({
        subscription_status: "cancelled",
      }).eq("id", userId);
    }
  }

  return Response.json({ ok: true });
}
