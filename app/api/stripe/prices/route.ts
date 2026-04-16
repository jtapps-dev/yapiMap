import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!;
    const price = await stripe.prices.retrieve(priceId);
    const amountEur = (price.unit_amount || 0) / 100;
    return NextResponse.json({ amountEur });
  } catch {
    return NextResponse.json({ amountEur: null }, { status: 500 });
  }
}
