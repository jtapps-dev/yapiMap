"use client";
import { useState } from "react";
import Link from "next/link";

import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const tFP = {
    tr: {
      title: "Şifremi Unuttum",
      subtitle: "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.",
      email: "E-posta",
      submit: "Sıfırlama Bağlantısı Gönder",
      loading: "Gönderiliyor...",
      sentTitle: "E-posta Gönderildi!",
      sentText: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.",
      back: "← Giriş sayfasına dön",
    },
    en: {
      title: "Forgot Password",
      subtitle: "Enter your email address and we'll send you a reset link.",
      email: "Email",
      submit: "Send Reset Link",
      loading: "Sending...",
      sentTitle: "Email Sent!",
      sentText: "A password reset link has been sent to your email address. Please check your inbox.",
      back: "← Back to login",
    },
    ru: {
      title: "Забыл пароль",
      subtitle: "Введите ваш email, и мы отправим ссылку для сброса пароля.",
      email: "Эл. почта",
      submit: "Отправить ссылку",
      loading: "Отправка...",
      sentTitle: "Письмо отправлено!",
      sentText: "Ссылка для сброса пароля отправлена на ваш email. Проверьте входящие.",
      back: "← Вернуться ко входу",
    },
  } as const;
  const t = (tFP as any)[lang] ?? tFP.en;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.error === "not_active") {
      setError(lang === "tr" ? "Bu hesap henüz aktive edilmemiş." : "This account has not been activated yet.");
      return;
    }
    if (json.error) { setError(json.error); return; }
    setSent(true);
  }

  const inputStyle = {
    width: "100%", padding: "12px 16px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 10, color: "#F1F5F9",
    fontSize: 15, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 40, maxWidth: 440, width: "100%" }}>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <Link href="/login" style={{ color: textMuted, fontSize: 22, lineHeight: 1 }}>←</Link>
          <Link href="/" style={{ flex: 1, textAlign: "center" }}>
            <span style={{ color: accent, fontSize: 28, fontWeight: 800 }}>YapıMap</span>
          </Link>
          <span style={{ width: 22 }} />
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{t.sentTitle}</h2>
            <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{t.sentText}</p>
            <Link href="/login" style={{ color: accent, fontSize: 14, fontWeight: 600 }}>{t.back}</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, textAlign: "center" }}>{t.title}</h1>
            <p style={{ color: textMuted, fontSize: 14, textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>{t.subtitle}</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.email}</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              {error && (
                <div style={{ backgroundColor: "#EF444420", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#EF4444" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "14px", backgroundColor: loading ? borderColor : accent,
                color: "#0F1923", fontWeight: 700, fontSize: 16, borderRadius: 10,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? t.loading : t.submit}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20 }}>
              <Link href="/login" style={{ fontSize: 13, color: textMuted }}>{t.back}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
