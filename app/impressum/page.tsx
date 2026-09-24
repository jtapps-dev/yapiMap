"use client";
import Link from "next/link";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

const t = {
  tr: {
    title: "Künye",
    subtitle: "Yasal Bilgiler",
    operator: "İşletici / Firma",
    pendingCompany: "[Şirket bilgisi — kuruluş sonrası eklenecektir]",
    office: "Türkiye Merkez Ofis",
    pendingAddress: "[Adres — kuruluş sonrası eklenecektir]",
    contact: "İletişim",
    pendingContact: "[İletişim bilgileri — kuruluş sonrası eklenecektir]",
    platform: "Platform Hakkında",
    platformText: "YapıMap, Türkiye, Kıbrıs ve Rusya'daki inşaat firmalarını ve emlak danışmanlarını birbirine bağlayan bir B2B platformdur. Platformda gösterilen tüm projeler ve bilgiler ilgili inşaat firmaları tarafından sağlanmaktadır.",
    back: "← Ana Sayfaya Dön",
  },
  en: {
    title: "Imprint",
    subtitle: "Legal Notice",
    operator: "Operator / Company",
    pendingCompany: "[Company details — to be added upon incorporation]",
    office: "Central Office in Turkey",
    pendingAddress: "[Address — to be added upon incorporation]",
    contact: "Contact",
    pendingContact: "[Contact details — to be added upon incorporation]",
    platform: "About Platform",
    platformText: "YapıMap is a B2B platform connecting real estate developers and brokers in Turkey, Cyprus and Russia. All projects and information displayed on the platform are provided by the respective developers.",
    back: "← Back to Home",
  },
  ru: {
    title: "Импрессум",
    subtitle: "Правовая информация",
    operator: "Оператор / Компания",
    pendingCompany: "[Данные компании — будут добавлены после регистрации]",
    office: "Центральный офис в Турции",
    pendingAddress: "[Адрес — будет добавлен после регистрации]",
    contact: "Контакты",
    pendingContact: "[Контактные данные — будут добавлены после регистрации]",
    platform: "О платформе",
    platformText: "YapıMap — B2B-платформа, соединяющая застройщиков и агентов по недвижимости в Турции, на Кипре и в России. Все проекты и информация на платформе предоставлены соответствующими застройщиками.",
    back: "← На главную",
  },
};

export default function ImpressumPage() {
  const { lang } = useLang();
  const tx = t[lang as keyof typeof t] ?? t.en;

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>

      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "16px 40px", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ color: accent, fontSize: 22, fontWeight: 800, textDecoration: "none" }}>YapıMap</Link>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{tx.title}</h1>
        <p style={{ color: textMuted, fontSize: 14, marginBottom: 48 }}>{tx.subtitle}</p>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 20 }}>{tx.operator}</h2>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8 }}>{tx.pendingCompany}</p>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 20 }}>{tx.office}</h2>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8 }}>{tx.pendingAddress}</p>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 20 }}>{tx.contact}</h2>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8 }}>{tx.pendingContact}</p>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 12 }}>{tx.platform}</h2>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8 }}>{tx.platformText}</p>
        </div>

        <p style={{ color: textMuted, fontSize: 13, marginTop: 40, textAlign: "center" }}>
          <Link href="/" style={{ color: textMuted }}>{tx.back}</Link>
        </p>
      </div>
    </div>
  );
}
