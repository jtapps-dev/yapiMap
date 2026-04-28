import { NextResponse } from "next/server";

export async function GET() {
  try {
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!;
    const res = await fetch(`https://api.paddle.com/prices/${priceId}`, {
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const json = await res.json();
    const unitPrice = json?.data?.unit_price;
    if (!unitPrice) throw new Error("no price");

    const amount = parseInt(unitPrice.amount) / 100;
    const currency = unitPrice.currency_code as string;

    return NextResponse.json({ amount, currency, priceId });
  } catch {
    const fallback = parseInt(process.env.PADDLE_PRICE_AMOUNT || "250");
    return NextResponse.json({ amount: fallback, currency: "USD", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID });
  }
}
