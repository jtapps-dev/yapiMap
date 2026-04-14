"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function ProfilePage() {
  const { lang } = useLang();
  const router = useRouter();
  const [dialCode, setDialCode] = useState("+90");
  const [localPhone, setLocalPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const DIAL_CODES = [
    { code: "+90", flag: "🇹🇷", name: "Türkiye" },
    { code: "+49", flag: "🇩🇪", name: "Deutschland" },
    { code: "+43", flag: "🇦🇹", name: "Österreich" },
    { code: "+41", flag: "🇨🇭", name: "Schweiz" },
    { code: "+44", flag: "🇬🇧", name: "UK" },
    { code: "+1",  flag: "🇺🇸", name: "USA" },
    { code: "+31", flag: "🇳🇱", name: "Netherlands" },
    { code: "+33", flag: "🇫🇷", name: "France" },
    { code: "+39", flag: "🇮🇹", name: "Italy" },
    { code: "+34", flag: "🇪🇸", name: "Spain" },
    { code: "+7",  flag: "🇷🇺", name: "Russia" },
    { code: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
    { code: "+970", flag: "🇵🇸", name: "Palestine" },
    { code: "+20", flag: "🇪🇬", name: "Egypt" },
  ];
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ full_name: "", company_name: "", phone: "", iban: "" });

  const tLabels = {
    tr: {
      title: "Profil Ayarları", back: "← Geri Dön",
      name: "Ad Soyad", company: "Firma / Ajans Adı", phone: "Telefon",
      phoneHint: "WhatsApp numaranızı uluslararası formatta girin (örn. +90 555 123 45 67)",
      iban: "IBAN (Komisyon Ödemeleri İçin)",
      ibanHint: "Referral komisyonlarınızı almak için IBAN girin (opsiyonel)",
      save: "Kaydet", saving: "Kaydediliyor...",
      success: "Profil güncellendi.",
    },
    en: {
      title: "Profile Settings", back: "← Go Back",
      name: "Full Name", company: "Company / Agency Name", phone: "Phone",
      phoneHint: "Enter your WhatsApp number in international format (e.g. +90 555 123 45 67)",
      iban: "IBAN (For Commission Payouts)",
      ibanHint: "Enter your IBAN to receive referral commissions (optional)",
      save: "Save", saving: "Saving...",
      success: "Profile updated.",
    },
    ru: {
      title: "Настройки профиля", back: "← Назад",
      name: "Имя и фамилия", company: "Название компании / агентства", phone: "Телефон",
      phoneHint: "Введите номер WhatsApp в международном формате (например, +90 555 123 45 67)",
      iban: "IBAN (для выплаты комиссий)",
      ibanHint: "Введите IBAN для получения реферальных комиссий (необязательно)",
      save: "Сохранить", saving: "Сохранение...",
      success: "Профиль обновлён.",
    },
  };
  const t = tLabels[lang as keyof typeof tLabels] ?? tLabels.en;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("full_name, company_name, phone, role, iban").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setForm({ full_name: data.full_name || "", company_name: data.company_name || "", phone: data.phone || "", iban: data.iban || "" });
            setRole(data.role || "");
            // Bestehende Nummer aufsplitten
            const phone = data.phone || "";
            const known = ["+90","+49","+43","+41","+44","+1","+31","+33","+39","+34","+7","+971","+966","+970","+20"];
            const match = known.find(c => phone.startsWith(c));
            if (match) { setDialCode(match); setLocalPhone(phone.slice(match.length)); }
            else setLocalPhone(phone);
          }
          setLoading(false);
        });
    });
  }, []); // eslint-disable-line

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      company_name: form.company_name.trim(),
      phone: dialCode + localPhone.replace(/^0/, "").replace(/\D/g, ""),
      iban: form.iban.trim() || null,
    }).eq("id", user.id);
    if (err) setError(lang === "tr" ? "Bir hata oluştu." : "An error occurred.");
    else setSuccess(true);
    setSaving(false);
  }

  const backUrl = role === "developer" ? "/developer" : "/broker/map";

  const inputStyle = {
    width: "100%", padding: "12px 16px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 10, color: "#F1F5F9",
    fontSize: 15, outline: "none", boxSizing: "border-box" as const,
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: textMuted }}>...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
        <button onClick={() => router.push(backUrl)}
          style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          {t.back}
        </button>
      </nav>

      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 32 }}>{t.title}</h1>

        <form onSubmit={handleSave} style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.name}</label>
            <input style={inputStyle} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.company}</label>
            <input style={inputStyle} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.phone}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={dialCode} onChange={e => setDialCode(e.target.value)}
                style={{ ...inputStyle, width: "auto", paddingRight: 12, flexShrink: 0 }}>
                {DIAL_CODES.map(d => (
                  <option key={d.code} value={d.code}>{d.flag} {d.code}</option>
                ))}
              </select>
              <input style={inputStyle} value={localPhone} onChange={e => setLocalPhone(e.target.value)} placeholder="555 123 45 67" type="tel" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.iban}</label>
            <input
              style={{ ...inputStyle, borderColor: form.iban ? accent : borderColor }}
              value={form.iban}
              onChange={e => setForm({ ...form, iban: e.target.value.toUpperCase() })}
              placeholder="DE89 3704 0044 0532 0130 00"
            />
            <p style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{t.ibanHint}</p>
          </div>

          {error && <div style={{ backgroundColor: "#EF444420", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#EF4444" }}>{error}</div>}
          {success && <div style={{ backgroundColor: "#10B98120", border: "1px solid #10B981", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#10B981" }}>{t.success}</div>}

          <button type="submit" disabled={saving}
            style={{ padding: "13px", backgroundColor: saving ? borderColor : accent, color: "#0F1923", fontWeight: 700, fontSize: 15, borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? t.saving : t.save}
          </button>
        </form>
      </div>
    </div>
  );
}
