"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "./i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "./hooks/useIsMobile";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgSecondary = "#162030";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function Home() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [tryRate, setTryRate] = useState(38);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [usdPrice, setUsdPrice] = useState<number>(250);

  // Implicit flow: access_token im Hash → zu reset-password weiterleiten
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get("type") === "recovery" && params.get("access_token")) {
      router.replace(`/reset-password${window.location.hash}`);
      return;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setUserRole(data.role); });
    });
  }, []);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => { if (d.rates?.TRY) setTryRate(d.rates.TRY); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/paddle/prices")
      .then(r => r.json())
      .then(d => { if (d.amount) setUsdPrice(d.amount); })
      .catch(() => {});
  }, []);

  function formatPrice(usd: number) {
    if (lang === "tr") return "₺" + Math.round(usd * tryRate).toLocaleString("tr-TR");
    return "$" + usd;
  }
  const price = formatPrice(usdPrice);

  return (
    <div style={{ backgroundColor: bgPrimary, color: "#F1F5F9", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: bgSecondary, borderBottom: `1px solid ${borderColor}`, padding: isMobile ? "12px 16px" : "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ color: accent, fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: -1, textDecoration: "none" }}>YapıMap</Link>
        <div style={{ display: "flex", gap: isMobile ? 8 : 12, alignItems: "center" }}>

          {/* LANGUAGE SWITCHER */}
          <div style={{ display: "flex", border: `1px solid ${borderColor}`, borderRadius: 8, overflow: "hidden" }}>
            {(["tr","en","ru"] as const).map((l, i) => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  padding: isMobile ? "5px 8px" : "6px 14px", fontSize: isMobile ? 11 : 13, fontWeight: 600, cursor: "pointer", border: "none",
                  borderLeft: i > 0 ? `1px solid ${borderColor}` : "none",
                  backgroundColor: lang === l ? accent : "transparent",
                  color: lang === l ? "#0F1923" : textMuted,
                }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {userRole ? (
            <Link href={userRole === "developer" ? "/developer" : "/broker/map"}
              style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: isMobile ? "7px 12px" : "8px 20px", borderRadius: 8, fontSize: isMobile ? 12 : 14, textDecoration: "none" }}>
              {lang === "tr" ? "Panelim →" : lang === "ru" ? "Кабинет →" : "Dashboard →"}
            </Link>
          ) : (
            <>
              {!isMobile && <Link href="/login" style={{ color: textMuted, fontSize: 14 }}>{t.nav.login}</Link>}
              <Link href="/register" style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: isMobile ? "7px 12px" : "8px 20px", borderRadius: 8, fontSize: isMobile ? 12 : 14, textDecoration: "none" }}>
                {isMobile ? (lang === "tr" ? "Başla" : lang === "ru" ? "Начать" : "Start") : t.nav.try}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: isMobile ? "48px 16px" : "80px 24px" }}>
        <div style={{ display: "inline-block", backgroundColor: bgCard, border: `1px solid ${borderColor}`, color: accent, fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 999, marginBottom: 20 }}>
          {t.hero.badge}
        </div>
        <h1 style={{ fontSize: isMobile ? 28 : "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          {t.hero.title1}<br />
          <span style={{ color: accent }}>{t.hero.title2}</span>
        </h1>
        <p style={{ color: textMuted, fontSize: isMobile ? 15 : 18, maxWidth: 600, margin: "0 auto 28px", lineHeight: 1.7, padding: isMobile ? "0 4px" : 0 }}>
          {t.hero.subtitle}
        </p>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 16, justifyContent: "center", alignItems: "center" }}>
          <Link href="/register?role=broker" style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: isMobile ? "13px 28px" : "14px 32px", borderRadius: 12, fontSize: isMobile ? 15 : 16, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? 320 : "none", textAlign: "center", boxSizing: "border-box" as const }}>
            {t.hero.btnBroker}
          </Link>
          <Link href="/register?role=developer" style={{ border: `2px solid ${accent}`, color: accent, fontWeight: 600, padding: isMobile ? "11px 28px" : "14px 32px", borderRadius: 12, fontSize: isMobile ? 15 : 16, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? 320 : "none", textAlign: "center", boxSizing: "border-box" as const }}>
            {t.hero.btnDeveloper}
          </Link>
        </div>
      </section>

      {/* PROBLEM vs SOLUTION */}
      <section style={{ backgroundColor: bgSecondary, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: isMobile ? "40px 16px" : "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: isMobile ? 32 : 48 }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20 }}>{t.problem.title}</h2>
            {t.problem.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#EF4444", fontSize: 16, marginTop: 2, flexShrink: 0 }}>✗</span>
                <p style={{ color: textMuted, fontSize: isMobile ? 14 : 15, lineHeight: 1.5, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
          <div>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 20 }}>
              {t.solution.title} <span style={{ color: accent }}>{t.solution.titleAccent}</span>
            </h2>
            {t.solution.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ color: accent, fontSize: 16, marginTop: 2, flexShrink: 0 }}>✓</span>
                <p style={{ color: textMuted, fontSize: isMobile ? 14 : 15, lineHeight: 1.5, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: isMobile ? "40px 16px" : "60px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, textAlign: "center", marginBottom: isMobile ? 28 : 48 }}>{t.features.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: isMobile ? 12 : 20 }}>
            {t.features.items.map((f, i) => (
              <div key={i} style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: isMobile ? "18px 16px" : 24, display: isMobile ? "flex" : "block", alignItems: isMobile ? "flex-start" : undefined, gap: isMobile ? 14 : undefined }}>
                <div style={{ fontSize: isMobile ? 28 : 32, marginBottom: isMobile ? 0 : 12, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: isMobile ? 15 : 17, marginBottom: 6, marginTop: 0 }}>{f.title}</h3>
                  <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ backgroundColor: bgSecondary, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: isMobile ? "40px 16px" : "60px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>{t.pricing.title}</h2>
          <p style={{ color: textMuted, textAlign: "center", marginBottom: isMobile ? 32 : 48, fontSize: isMobile ? 14 : 16 }}>{t.pricing.subtitle}</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

            <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: isMobile ? 24 : 32 }}>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{t.pricing.broker.label}</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: isMobile ? 36 : 42, fontWeight: 900 }}>{price}</span>
                <span style={{ color: textMuted, fontSize: 16 }}>{t.pricing.broker.period}</span>
              </div>
              <p style={{ color: textMuted, fontSize: 14, marginBottom: 24 }}>{t.pricing.broker.desc}</p>
              {t.pricing.broker.features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: accent }}>✓</span>
                  <span style={{ color: textMuted }}>{f}</span>
                </div>
              ))}
              <Link href="/register?role=broker" style={{ display: "block", backgroundColor: accent, color: "#0F1923", fontWeight: 700, textAlign: "center", padding: "12px 0", borderRadius: 10, marginTop: 20, fontSize: 15 }}>
                {t.pricing.broker.cta}
              </Link>
            </div>

            <div style={{ backgroundColor: bgCard, border: `2px solid ${accent}`, borderRadius: 20, padding: isMobile ? 24 : 32, position: "relative", marginTop: isMobile ? 16 : 0 }}>
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", backgroundColor: accent, color: "#0F1923", fontSize: 11, fontWeight: 800, padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>
                {t.pricing.developer.badge}
              </div>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{t.pricing.developer.label}</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: isMobile ? 36 : 42, fontWeight: 900 }}>{price}</span>
                <span style={{ color: textMuted, fontSize: 16 }}>{t.pricing.developer.period}</span>
              </div>
              <p style={{ color: textMuted, fontSize: 14, marginBottom: 24 }}>{t.pricing.developer.desc}</p>
              {t.pricing.developer.features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: accent }}>✓</span>
                  <span style={{ color: textMuted }}>{f}</span>
                </div>
              ))}
              <Link href="/register?role=developer" style={{ display: "block", backgroundColor: accent, color: "#0F1923", fontWeight: 700, textAlign: "center", padding: "12px 0", borderRadius: 10, marginTop: 20, fontSize: 15 }}>
                {t.pricing.developer.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: isMobile ? "48px 16px" : "80px 24px" }}>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, marginBottom: 14 }}>{t.cta.title}</h2>
        <p style={{ color: textMuted, fontSize: isMobile ? 15 : 18, marginBottom: 28, padding: isMobile ? "0 8px" : 0 }}>{t.cta.subtitle}</p>
        <Link href="/register" style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: isMobile ? "14px 32px" : "16px 40px", borderRadius: 12, fontSize: isMobile ? 15 : 17, display: isMobile ? "inline-block" : undefined }}>
          {t.cta.btn}
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: bgSecondary, borderTop: `1px solid ${borderColor}`, padding: isMobile ? "20px 16px" : "24px", textAlign: "center" }}>
        <p style={{ color: textMuted, fontSize: isMobile ? 12 : 13, lineHeight: 1.8 }}>
          © 2026 YapıMap ·{" "}
          <Link href="/privacy" style={{ color: textMuted }}>{t.footer.privacy}</Link>
          {" · "}
          <Link href="/terms" style={{ color: textMuted }}>{t.footer.terms}</Link>
          {" · "}
          <Link href="/refund" style={{ color: textMuted }}>{t.footer.refund}</Link>
          {" · "}
          <Link href="/impressum" style={{ color: textMuted }}>{t.footer.imprint}</Link>
        </p>
      </footer>

    </div>
  );
}
