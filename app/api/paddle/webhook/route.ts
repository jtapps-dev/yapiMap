import { createHmac } from "crypto";
import { createClient } from "@/lib/supabase/server";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const parts = Object.fromEntries(
    signature.split(";").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;
  const signed = `${ts}:${body}`;
  const hmac = createHmac("sha256", secret).update(signed).digest("hex");
  return hmac === h1;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";

  if (secret && !verifySignature(body, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = await createClient();

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
