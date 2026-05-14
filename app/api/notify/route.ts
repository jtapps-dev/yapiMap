import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, company, role, city, country } = await req.json()

    const roleLabel = role === 'developer' ? '🏗️ Developer' : '🏢 Broker/Agent'
    const text = `🆕 <b>Neue Registrierung!</b>\n\n` +
      `${roleLabel}\n` +
      `👤 <b>${name}</b>\n` +
      `🏢 ${company || '—'}\n` +
      `📧 ${email}\n` +
      `📱 ${phone || '—'}\n` +
      `📍 ${city || '—'}, ${country || '—'}\n\n` +
      `👉 <a href="https://yapimap.com/admin">Admin Panel öffnen</a>`

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
