import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;
    const userId = session.metadata?.userId;
    const referralCode = session.metadata?.referral_code;

    if (userId) {
      await supabase.from("profiles").update({
        subscription_status: "active",
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq("id", userId);

      // Commission anlegen wenn Referral Code vorhanden
      if (referralCode) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode)
          .single();

        if (referrer && referrer.id !== userId) {
          await supabase.from("commissions").insert({
            referrer_id: referrer.id,
            referred_id: userId,
            amount: 100,
            status: "pending",
          });
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.paused") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from("profiles")
      .update({ subscription_status: "inactive" })
      .eq("stripe_subscription_id", sub.id);
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const status = sub.status === "active" ? "active" : "inactive";
    await supabase.from("profiles")
      .update({ subscription_status: status })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
