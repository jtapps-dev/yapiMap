"use client";
import Link from "next/link";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function PendingPage() {
  const { lang } = useLang();

  const t = {
    tr: {
      title: "Hesabınız İnceleniyor",
      text: "Ekibimiz talebinizi inceliyor. En kısa sürede sizi arayacak ve hesabınızı aktive edecek.",
      sub: "Sorularınız için:",
      back: "Ana Sayfaya Dön",
    },
    en: {
      title: "Account Under Review",
      text: "Our team is reviewing your request. We will contact you shortly to activate your account.",
      sub: "Questions?",
      back: "Back to Home",
    },
  }[lang];

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 48, maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>⏳</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{t.title}</h1>
        <p style={{ color: textMuted, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>{t.text}</p>
        <Link href="/" style={{ color: accent, fontSize: 14, fontWeight: 600 }}>{t.back}</Link>
      </div>
    </div>
  );
}
