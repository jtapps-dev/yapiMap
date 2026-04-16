"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function SetPasswordPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const tLabels = {
    tr: { title: "Şifrenizi Belirleyin", pw: "Şifre", confirm: "Şifre Tekrar", btn: "Kaydet ve Giriş Yap", mismatch: "Şifreler eşleşmiyor", short: "Şifre en az 8 karakter olmalı", invalid: "Geçersiz veya süresi dolmuş link.", loading: "Yükleniyor..." },
    en: { title: "Set Your Password", pw: "Password", confirm: "Confirm Password", btn: "Save & Login", mismatch: "Passwords don't match", short: "Password must be at least 8 characters", invalid: "Invalid or expired link.", loading: "Loading..." },
    ru: { title: "Установите пароль", pw: "Пароль", confirm: "Подтвердите пароль", btn: "Сохранить и войти", mismatch: "Пароли не совпадают", short: "Пароль должен содержать не менее 8 символов", invalid: "Неверная или устаревшая ссылка.", loading: "Загрузка..." },
  };
  const t = tLabels[lang as keyof typeof tLabels] ?? tLabels.en;

  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        // Implicit flow: tokens direkt im Hash
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (error) {
              setError(t.invalid);
            } else {
              setReady(true);
            }
          });
        return;
      }
    }

    // PKCE flow: Session wurde via auth/callback in Cookies gesetzt
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(t.invalid);
        } else if (session) {
        setReady(true);
      } else {
        setError(t.invalid);
      }
    });
  }, []);

  const inputStyle = {
    width: "100%", padding: "12px 16px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 10, color: "#F1F5F9",
    fontSize: 15, outline: "none", boxSizing: "border-box" as const,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError(t.short); return; }
    if (password !== confirm) { setError(t.mismatch); return; }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 40, maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 28, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 32, textAlign: "center" }}>{t.title}</h1>

        {!ready ? (
          error ? (
            <div style={{ backgroundColor: "#EF444420", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#EF4444", textAlign: "center" }}>
              {error}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: textMuted }}>{t.loading}</p>
          )
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: textMuted, marginBottom: 6 }}>{t.pw}</label>
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
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 16, borderRadius: 10, border: "none", cursor: "pointer" }}>
              {loading ? "..." : t.btn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
