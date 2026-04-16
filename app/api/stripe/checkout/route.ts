import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, referralCode } = await req.json();

  // Validate: priceId must belong to our product
  const stripePrice = await stripe.prices.retrieve(priceId).catch(() => null);
  if (!stripePrice || stripePrice.product !== process.env.STRIPE_PRODUCT_ID) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  // Referral Code validieren
  let validatedReferralCode: string | null = null;
  if (referralCode) {
    const admin = createAdminClient();
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase().trim())
      .eq("status", "active")
      .neq("id", user.id) // darf nicht sich selbst einladen
      .single();
    if (referrer) validatedReferralCode = referralCode.toUpperCase().trim();
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
    metadata: {
      userId: user.id,
      ...(validatedReferralCode && { referral_code: validatedReferralCode }),
    },
    customer_email: user.email,
  };

  // Rabatt anwenden wenn Code gültig
  if (validatedReferralCode && process.env.STRIPE_REFERRAL_COUPON_ID) {
    sessionParams.discounts = [{ coupon: process.env.STRIPE_REFERRAL_COUPON_ID }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url });
}
