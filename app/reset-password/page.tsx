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

export default function ResetPasswordPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const tReset = {
    tr: {
      title: "Yeni Şifre Belirle",
      password: "Yeni Şifre",
      confirm: "Şifreyi Onayla",
      submit: "Şifreyi Güncelle",
      loading: "Güncelleniyor...",
      mismatch: "Şifreler eşleşmiyor.",
      short: "Şifre en az 6 karakter olmalıdır.",
      noSession: "Geçersiz veya süresi dolmuş bağlantı.",
      doneTitle: "Şifre Güncellendi!",
      doneText: "Şifreniz başarıyla güncellendi.",
      login: "Giriş Yap →",
    },
    en: {
      title: "Set New Password",
      password: "New Password",
      confirm: "Confirm Password",
      submit: "Update Password",
      loading: "Updating...",
      mismatch: "Passwords do not match.",
      short: "Password must be at least 6 characters.",
      noSession: "Invalid or expired link.",
      doneTitle: "Password Updated!",
      doneText: "Your password has been successfully updated.",
      login: "Go to Login →",
    },
    ru: {
      title: "Новый пароль",
      password: "Новый пароль",
      confirm: "Подтвердите пароль",
      submit: "Обновить пароль",
      loading: "Обновление...",
      mismatch: "Пароли не совпадают.",
      short: "Пароль должен содержать не менее 6 символов.",
      noSession: "Неверная или устаревшая ссылка.",
      doneTitle: "Пароль обновлён!",
      doneText: "Ваш пароль успешно обновлён.",
      login: "Войти →",
    },
  } as const;
  const t = (tReset as any)[lang] ?? tReset.en;

  useEffect(() => {
    // Implicit flow: tokens im URL-Hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const supabase = createClient();
      supabase.auth.setSession({ access_token, refresh_token });
    }
    // PKCE flow: Session ist bereits gesetzt via auth/callback → nichts zu tun
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError(t.short); return; }
    if (password !== confirm) { setError(t.mismatch); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  }

  const inputStyle = {
    width: "100%", padding: "12px 16px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 10, color: "#F1F5F9",
    fontSize: 15, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 40, maxWidth: 440, width: "100%" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 28, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{t.doneTitle}</h2>
            <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{t.doneText}</p>
            <button onClick={() => router.push("/login")} style={{
              padding: "12px 28px", backgroundColor: accent, color: bgPrimary,
              fontWeight: 700, fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer",
            }}>
              {t.login}
            </button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28, textAlign: "center" }}>{t.title}</h1>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.password}</label>
                <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.confirm}</label>
                <input style={inputStyle} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
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
          </>
        )}
      </div>
    </div>
  );
}
