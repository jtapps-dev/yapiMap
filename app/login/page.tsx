"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/i18n/LanguageContext";
import PrivacyConsentModal from "@/app/components/PrivacyConsentModal";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function LoginPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showConsent, setShowConsent] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  const labels = {
    tr: {
      title: "Giriş Yap",
      email: "E-posta",
      password: "Şifre",
      submit: "Giriş Yap",
      loading: "Giriş yapılıyor...",
      noAccount: "Hesabınız yok mu?",
      register: "Talep Oluştur",
      forgot: "Şifremi Unuttum",
    },
    en: {
      title: "Login",
      email: "Email",
      password: "Password",
      submit: "Login",
      loading: "Logging in...",
      noAccount: "Don't have an account?",
      register: "Request Access",
      forgot: "Forgot Password",
    },
    ru: {
      title: "Войти",
      email: "Эл. почта",
      password: "Пароль",
      submit: "Войти",
      loading: "Вход...",
      noAccount: "Нет аккаунта?",
      register: "Запросить доступ",
      forgot: "Забыл пароль",
    },
  };

  const t = labels[lang as keyof typeof labels] ?? labels.en;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) throw loginError;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("status, privacy_accepted_at").eq("id", user!.id).single();

      if (!profile || profile.status === "pending") { router.push("/pending"); return; }
      if (profile.status === "rejected") { router.push("/pending"); return; }

      if (!profile.privacy_accepted_at) {
        setRedirectTo("/dashboard");
        setShowConsent(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials") || msg.includes("email not confirmed")) {
        setError(lang === "tr" ? "E-posta veya şifre hatalı." : lang === "ru" ? "Неверный email или пароль." : "Incorrect email or password.");
      } else {
        setError(lang === "tr" ? "Giriş başarısız. Lütfen tekrar deneyin." : lang === "ru" ? "Ошибка входа. Попробуйте снова." : "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConsentAccept() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ privacy_accepted_at: new Date().toISOString() }).eq("id", user.id);
    }
    setShowConsent(false);
    router.push(redirectTo);
  }

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {showConsent && <PrivacyConsentModal lang={lang} onAccept={handleConsentAccept} />}
      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 40, maxWidth: 440, width: "100%" }}>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <Link href="/" style={{ color: textMuted, fontSize: 22, lineHeight: 1 }}>←</Link>
          <Link href="/" style={{ flex: 1, textAlign: "center" }}>
            <span style={{ color: accent, fontSize: 28, fontWeight: 800 }}>YapıMap</span>
          </Link>
          <span style={{ width: 22 }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, textAlign: "center" }}>{t.title}</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.email}</label>
            <input
              style={inputStyle}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              type="email"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, color: textMuted }}>{t.password}</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: accent }}>{t.forgot}</Link>
            </div>
            <input
              style={inputStyle}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              type="password"
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
          {t.noAccount}{" "}
          <Link href="/register" style={{ color: accent, fontWeight: 600 }}>{t.register}</Link>
        </p>
      </div>
    </div>
  );
}
