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
    office: "Türkiye Merkez Ofis",
    contact: "İletişim",
    platform: "Platform Hakkında",
    platformText: "YapıMap, Türkiye'deki inşaat firmalarını ve emlak danışmanlarını birbirine bağlayan bir B2B platformdur. Platformda gösterilen tüm projeler ve bilgiler ilgili inşaat firmaları tarafından sağlanmaktadır.",
    back: "← Ana Sayfaya Dön",
  },
  en: {
    title: "Imprint",
    subtitle: "Legal Notice",
    operator: "Operator / Company",
    office: "Central Office in Turkey",
    contact: "Contact",
    platform: "About Platform",
    platformText: "YapıMap is a B2B platform connecting real estate developers and brokers in Turkey. All projects and information displayed on the platform are provided by the respective developers.",
    back: "← Back to Home",
  },
  ru: {
    title: "Импрессум",
    subtitle: "Правовая информация",
    operator: "Оператор / Компания",
    office: "Центральный офис в Турции",
    contact: "Контакты",
    platform: "О платформе",
    platformText: "YapıMap — B2B-платформа, соединяющая застройщиков и агентов по недвижимости в Турции. Все проекты и информация на платформе предоставлены соответствующими застройщиками.",
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
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Global Trade Real Estate / Emlak / Недвижимость</p>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8 }}>
            Şehit Astsubay Ömer Halis Demir Cad.<br />
            Ekpa 1207 Sitesi, A3 Blok NO:95AN<br />
            Kepez / Antalya, Türkiye
          </p>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 20 }}>{tx.office}</h2>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8 }}>
            Ekpa 1207, Güneş Mahallesi<br />
            4409 Sokak, A3 Blok 163<br />
            07260 Kepez / Antalya, Türkiye
          </p>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 20 }}>{tx.contact}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ color: textMuted, fontSize: 13, minWidth: 60 }}>Tel 1</span>
              <a href="tel:+905013619006" style={{ color: "#F1F5F9", fontSize: 15, textDecoration: "none" }}>+90 501 361 90 06</a>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ color: textMuted, fontSize: 13, minWidth: 60 }}>Tel 2</span>
              <a href="tel:+77009993939" style={{ color: "#F1F5F9", fontSize: 15, textDecoration: "none" }}>+7 700 999 39 39</a>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ color: textMuted, fontSize: 13, minWidth: 60 }}>E-Mail</span>
              <a href="mailto:kaz.bigsale@gmail.com" style={{ color: accent, fontSize: 15, textDecoration: "none" }}>kaz.bigsale@gmail.com</a>
            </div>
          </div>
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
