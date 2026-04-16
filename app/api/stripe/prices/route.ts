import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const productId = process.env.STRIPE_PRODUCT_ID!;
    const product = await stripe.products.retrieve(productId);
    const defaultPriceId = product.default_price as string;
    const price = await stripe.prices.retrieve(defaultPriceId);
    const amountEur = (price.unit_amount || 0) / 100;
    return NextResponse.json({ amountEur, priceId: defaultPriceId });
  } catch {
    return NextResponse.json({ amountEur: null }, { status: 500 });
  }
}
