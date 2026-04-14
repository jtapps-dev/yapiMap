"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";

const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

function RegisterForm() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<"broker" | "developer">(() => {
    const r = searchParams.get("role");
    return r === "developer" ? "developer" : "broker";
  });

  // Referral-Code aus URL in localStorage speichern
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("pending_referral_code", ref.toUpperCase().trim());
  }, []);  // eslint-disable-line

  function handleRoleChange(r: "broker" | "developer") {
    setRole(r);
    router.replace(`/register?role=${r}`, { scroll: false });
  }
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [dialCode, setDialCode] = useState("+90");
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    email: "",
    tax_number: "",
    country: "",
    city: "",
    iban: "",
  });

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

  const labels = {
    tr: {
      title: "Hesap Talebi",
      subtitle: "Bilgilerinizi gönderin, ekibimiz sizi arayacak.",
      broker: "Emlakçı",
      developer: "Geliştirici",
      name: "Ad Soyad",
      company: "Firma / Ajans Adı",
      phone: "Telefon",
      email: "E-posta",
      taxNumber: "Vergi Numarası",
      country: "Ülke",
      city: "Şehir",
      submit: "Talep Gönder",
      loading: "Gönderiliyor...",
      privacy: "Gizlilik politikasını kabul ediyorum",
      doneTitle: "Talebiniz Alındı!",
      doneText: "Ekibimiz en kısa sürede sizi arayacak ve hesabınızı aktive edecek.",
      login: "Zaten hesabınız var mı?",
      iban: "IBAN (isteğe bağlı, komisyon ödemeleri için)",
      ibanHint: "Her davet ettiğiniz kişi abone olduğunda €100 komisyon alırsınız",
    },
    en: {
      title: "Request Access",
      subtitle: "Submit your details and our team will contact you.",
      broker: "Broker",
      developer: "Developer",
      name: "Full Name",
      company: "Company / Agency Name",
      phone: "Phone Number",
      email: "Email",
      taxNumber: "Tax Number",
      country: "Country",
      city: "City",
      submit: "Send Request",
      loading: "Sending...",
      privacy: "I agree to the privacy policy",
      doneTitle: "Request Received!",
      doneText: "Our team will contact you shortly to activate your account.",
      login: "Already have an account?",
      iban: "IBAN (optional, for referral payouts)",
      ibanHint: "Enter your IBAN to receive €100 commission per referral",
    },
    ru: {
      title: "Запросить доступ",
      subtitle: "Отправьте данные — наша команда свяжется с вами.",
      broker: "Риелтор",
      developer: "Застройщик",
      name: "Имя и фамилия",
      company: "Название компании / агентства",
      phone: "Номер телефона",
      email: "Эл. почта",
      taxNumber: "ИНН / Налоговый номер",
      country: "Страна",
      city: "Город",
      submit: "Отправить запрос",
      loading: "Отправка...",
      privacy: "Я согласен с политикой конфиденциальности",
      doneTitle: "Запрос получен!",
      doneText: "Наша команда свяжется с вами в ближайшее время для активации аккаунта.",
      login: "Уже есть аккаунт?",
      iban: "IBAN (необязательно, для выплат комиссий)",
      ibanHint: "Получайте €100 за каждого приглашённого пользователя, оформившего подписку",
    },
  };

  const t = labels[lang as keyof typeof labels] ?? labels.en;

  function validate() {
    if (!form.full_name.trim() || form.full_name.trim().length < 2) return lang === "tr" ? "Ad Soyad en az 2 karakter olmalıdır." : lang === "ru" ? "Имя должно содержать не менее 2 символов." : "Full name must be at least 2 characters.";
    if (!form.company_name.trim() || form.company_name.trim().length < 2) return lang === "tr" ? "Şirket adı en az 2 karakter olmalıdır." : lang === "ru" ? "Название компании должно содержать не менее 2 символов." : "Company name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return lang === "tr" ? "Geçerli bir e-posta adresi girin." : lang === "ru" ? "Введите корректный адрес эл. почты." : "Enter a valid email address.";
    if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) return lang === "tr" ? "Geçerli bir telefon numarası girin (sadece rakam)." : lang === "ru" ? "Введите корректный номер телефона (только цифры)." : "Enter a valid phone number (digits only).";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Temporäres Passwort – User setzt es später selbst
      const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";

      // Referral Code generieren
      const nameSlug = form.full_name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
      const referralCode = `${nameSlug}-${Math.random().toString(36).toUpperCase().slice(2, 6)}`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: tempPassword,
        options: {
          data: {
            full_name: form.full_name,
            company_name: form.company_name,
            phone: dialCode + form.phone.replace(/^0/, "").replace(/\D/g, ""),
            role: role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered") || signUpError.message.toLowerCase().includes("already been registered")) {
          throw new Error(lang === "tr" ? "Bu e-posta adresi zaten kayıtlı." : lang === "ru" ? "Этот email уже зарегистрирован." : "This email is already registered.");
        }
        throw signUpError;
      }
      if (!signUpData.user) throw new Error("User konnte nicht erstellt werden");

      // Profil manuell einfügen (Trigger-Fallback)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        email: form.email,
        full_name: form.full_name,
        company_name: form.company_name,
        phone: dialCode + form.phone.replace(/^0/, "").replace(/\D/g, ""),
        tax_number: form.tax_number.trim() || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        iban: form.iban.trim() || null,
        referral_code: referralCode,
        role: role,
        status: "pending",
      });

      if (profileError) throw profileError;

      // Sofort ausloggen – User wartet auf Freischaltung durch Admin
      await supabase.auth.signOut();

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    color: "#F1F5F9",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  if (done) {
    return (
      <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 48, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16, color: "#F1F5F9" }}>{t.doneTitle}</h1>
          <p style={{ color: textMuted, fontSize: 16, lineHeight: 1.6 }}>{t.doneText}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 40, maxWidth: 480, width: "100%" }}>

        {/* Back + Logo */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <Link href="/" style={{ color: textMuted, fontSize: 22, lineHeight: 1 }}>←</Link>
          <Link href="/" style={{ flex: 1, textAlign: "center" }}>
            <span style={{ color: accent, fontSize: 28, fontWeight: 800 }}>YapıMap</span>
          </Link>
          <span style={{ width: 22 }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>{t.title}</h1>
        <p style={{ color: textMuted, fontSize: 14, textAlign: "center", marginBottom: 32 }}>{t.subtitle}</p>

        {/* Rolle wählen */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {(["broker", "developer"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: `2px solid ${role === r ? accent : borderColor}`,
                backgroundColor: role === r ? `${accent}18` : "transparent",
                color: role === r ? accent : textMuted,
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {r === "broker" ? `🏠 ${t.broker}` : `🏗️ ${t.developer}`}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.name}</label>
            <input
              style={inputStyle}
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.company}</label>
            <input
              style={inputStyle}
              value={form.company_name}
              onChange={e => setForm({ ...form, company_name: e.target.value })}
              placeholder="Yılmaz Gayrimenkul"
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.phone}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={dialCode}
                onChange={e => setDialCode(e.target.value)}
                style={{ ...inputStyle, width: "auto", paddingRight: 12, flexShrink: 0 }}
              >
                {DIAL_CODES.map(d => (
                  <option key={d.code} value={d.code}>{d.flag} {d.code}</option>
                ))}
              </select>
              <input
                style={inputStyle}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="555 123 45 67"
                type="tel"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.email}</label>
            <input
              style={inputStyle}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="ahmet@firma.com"
              type="email"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.country}</label>
              <input style={inputStyle} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Türkiye" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.city}</label>
              <input style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="İstanbul" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.taxNumber}</label>
            <input style={inputStyle} value={form.tax_number} onChange={e => setForm({ ...form, tax_number: e.target.value })} placeholder="1234567890" />
          </div>

          <div style={{ marginBottom: 24, backgroundColor: "#0F1923", borderRadius: 10, padding: 14, border: `1px solid ${borderColor}` }}>
            <label style={{ display: "block", fontSize: 13, color: accent, marginBottom: 4, fontWeight: 600 }}>💰 {t.iban}</label>
            <p style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>{t.ibanHint}</p>
            <input style={inputStyle} value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} placeholder="DE89 3704 0044 0532 0130 00" />
          </div>

          {error && (
            <div style={{ backgroundColor: "#EF444420", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#EF4444" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? borderColor : accent,
              color: "#0F1923",
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: textMuted }}>
          {t.login}{" "}
          <Link href="/login" style={{ color: accent, fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
