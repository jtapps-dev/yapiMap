"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

const t = {
  tr: {
    title: "Gizlilik Politikası ve Kullanım Koşulları",
    text: "yapimap.com'u kullanmak için Gizlilik Politikamızı ve Kullanıcı Sözleşmemizi okuduğunuzu ve kabul ettiğinizi onaylamanız gerekmektedir. İletişim bilgilerinizin iş ortaklarımızla (geliştiriciler, acenteler) paylaşılabileceğini ve verilerinizin bu amaçla işlenebileceğini kabul etmiş olursunuz.",
    link: "Gizlilik Politikası ve Kullanıcı Sözleşmesi'ni oku →",
    accept: "Okudum ve Kabul Ediyorum",
    loading: "Kaydediliyor...",
    logout: "Geri Dön / Çıkış",
  },
  en: {
    title: "Privacy Policy & Terms of Use",
    text: "To use yapimap.com, you must confirm that you have read and accepted our Privacy Policy and User Agreement. You agree that your contact information may be shared with our partners (developers, agencies) and that your data may be processed for this purpose.",
    link: "Read Privacy Policy & User Agreement →",
    accept: "I Have Read and Accept",
    loading: "Saving...",
    logout: "Go Back / Sign Out",
  },
  ru: {
    title: "Политика конфиденциальности и Условия использования",
    text: "Для использования yapimap.com необходимо подтвердить, что вы ознакомились с нашей Политикой конфиденциальности и Пользовательским соглашением и принимаете их. Вы соглашаетесь с тем, что ваши контактные данные могут быть переданы нашим партнёрам (застройщикам, агентствам), а ваши данные могут обрабатываться в этих целях.",
    link: "Читать Политику конфиденциальности и Соглашение →",
    accept: "Ознакомился и принимаю",
    loading: "Сохранение...",
    logout: "Назад / Выйти",
  },
};

export default function ConsentPage() {
  const { lang } = useLang();
  const router = useRouter();
  const tx = t[lang as keyof typeof t] ?? t.en;
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);

  // If user is not logged in, send to login
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login");
    });
  }, []);

  async function handleAccept() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    await supabase.from("profiles").update({ privacy_accepted_at: new Date().toISOString() }).eq("id", user.id);
    router.replace("/dashboard");
  }

  async function handleDecline() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", color: "#F1F5F9" }}>

      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 40, maxWidth: 560, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 16 }}>🔒</div>

        <h1 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 20 }}>
          {tx.title}
        </h1>

        <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>
          {tx.text}
        </p>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/privacy" target="_blank" style={{ color: accent, fontSize: 13, textDecoration: "underline" }}>
            {tx.link}
          </Link>
        </div>

        {/* Checkbox */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 28, padding: "14px 16px", backgroundColor: checked ? `${accent}15` : bgPrimary, border: `1px solid ${checked ? accent : borderColor}`, borderRadius: 10 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: accent, cursor: "pointer", flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: checked ? "#F1F5F9" : textMuted, lineHeight: 1.5 }}>
            {tx.accept}
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked || saving}
          style={{
            width: "100%", padding: "14px",
            backgroundColor: checked && !saving ? accent : borderColor,
            color: checked && !saving ? bgPrimary : textMuted,
            fontWeight: 800, fontSize: 15, borderRadius: 10,
            border: "none", cursor: checked && !saving ? "pointer" : "not-allowed",
            marginBottom: 12,
            transition: "all 0.2s",
          }}
        >
          {saving ? tx.loading : tx.accept}
        </button>

        <button
          onClick={handleDecline}
          style={{ width: "100%", padding: "10px", backgroundColor: "transparent", color: textMuted, fontSize: 13, borderRadius: 10, border: `1px solid ${borderColor}`, cursor: "pointer" }}
        >
          {tx.logout}
        </button>

      </div>
    </div>
  );
}
