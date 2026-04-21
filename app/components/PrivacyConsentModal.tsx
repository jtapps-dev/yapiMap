"use client";
import Link from "next/link";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

const t = {
  tr: {
    title: "Gizlilik Politikası ve Kullanım Koşulları",
    text: "yapimap.com'u kullanmak için Gizlilik Politikamızı ve Kullanıcı Sözleşmemizi okuduğunuzu ve kabul ettiğinizi onaylamanız gerekmektedir. İletişim bilgilerinizin iş ortaklarımızla (geliştiriciler, acenteler) paylaşılabileceğini ve verilerinizin bu amaçla işlenebileceğini kabul etmiş olursunuz.",
    link: "Gizlilik Politikası ve Kullanıcı Sözleşmesi'ni oku",
    accept: "Okudum ve Kabul Ediyorum",
  },
  en: {
    title: "Privacy Policy & Terms of Use",
    text: "To use yapimap.com, you must confirm that you have read and accepted our Privacy Policy and User Agreement. You agree that your contact information may be shared with our partners (developers, agencies) and that your data may be processed for this purpose.",
    link: "Read Privacy Policy & User Agreement",
    accept: "I Have Read and Accept",
  },
  ru: {
    title: "Политика конфиденциальности и Условия использования",
    text: "Для использования yapimap.com необходимо подтвердить, что вы ознакомились с нашей Политикой конфиденциальности и Пользовательским соглашением и принимаете их. Вы соглашаетесь с тем, что ваши контактные данные могут быть переданы нашим партнёрам (застройщикам, агентствам), а ваши данные могут обрабатываться в этих целях.",
    link: "Читать Политику конфиденциальности и Соглашение",
    accept: "Ознакомился и принимаю",
  },
};

interface Props {
  lang: string;
  onAccept: () => void;
}

export default function PrivacyConsentModal({ lang, onAccept }: Props) {
  const tx = t[lang as keyof typeof t] ?? t.en;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        backgroundColor: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: 20,
        padding: 40,
        maxWidth: 520,
        width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 16, color: "#F1F5F9" }}>
          {tx.title}
        </h2>
        <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 20, textAlign: "center" }}>
          {tx.text}
        </p>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link
            href="/datenschutz"
            target="_blank"
            style={{ color: accent, fontSize: 13, textDecoration: "underline" }}
          >
            {tx.link} →
          </Link>
        </div>
        <button
          onClick={onAccept}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: accent,
            color: bgPrimary,
            fontWeight: 800,
            fontSize: 15,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          {tx.accept}
        </button>
      </div>
    </div>
  );
}
