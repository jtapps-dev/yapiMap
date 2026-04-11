"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";

const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function RegisterPage() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<"broker" | "developer">(() => {
    const r = searchParams.get("role");
    return r === "developer" ? "developer" : "broker";
  });

  function handleRoleChange(r: "broker" | "developer") {
    setRole(r);
    router.replace(`/register?role=${r}`, { scroll: false });
  }
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    email: "",
  });

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
      submit: "Talep Gönder",
      loading: "Gönderiliyor...",
      privacy: "Gizlilik politikasını kabul ediyorum",
      doneTitle: "Talebiniz Alındı!",
      doneText: "Ekibimiz en kısa sürede sizi arayacak ve hesabınızı aktive edecek.",
      login: "Zaten hesabınız var mı?",
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
      submit: "Send Request",
      loading: "Sending...",
      privacy: "I agree to the privacy policy",
      doneTitle: "Request Received!",
      doneText: "Our team will contact you shortly to activate your account.",
      login: "Already have an account?",
    },
  };

  const t = labels[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Temporäres Passwort – User setzt es später selbst
      const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: tempPassword,
        options: {
          data: {
            full_name: form.full_name,
            company_name: form.company_name,
            phone: form.phone,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("User konnte nicht erstellt werden");

      // Profil manuell einfügen (Trigger-Fallback)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        email: form.email,
        full_name: form.full_name,
        company_name: form.company_name,
        phone: form.phone,
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
            <span style={{ color: accent, fontSize: 28, fontWeight: 800 }}>YapiMap</span>
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
            <input
              style={inputStyle}
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+90 555 123 45 67"
              type="tel"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
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
