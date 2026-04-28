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

    // Convert to EUR if needed
    let amountEur = amount;
    if (currency === "USD") {
      // approximate: 1 USD ≈ 0.92 EUR
      amountEur = Math.round(amount * 0.92);
    }

    return NextResponse.json({ amount, amountEur, currency, priceId });
  } catch {
    const fallback = parseInt(process.env.PADDLE_PRICE_AMOUNT || "249");
    return NextResponse.json({ amount: fallback, amountEur: fallback, currency: "EUR", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID });
  }
}
