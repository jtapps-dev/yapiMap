"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "./i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgSecondary = "#162030";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function Home() {
  const { lang, setLang, t } = useLang();
  const [tryRate, setTryRate] = useState(51);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single()
        .then(({ data }) => { if (data) setUserRole(data.role); });
    });
  }, []);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=TRY&to=EUR")
      .then(r => r.json())
      .then(d => { if (d.rates?.EUR) setTryRate(1 / d.rates.EUR); })
      .catch(() => {});
  }, []);

  function formatPrice(eur: number) {
    if (lang === "tr") return "₺" + Math.round(eur * tryRate).toLocaleString("tr-TR");
    return "€" + eur;
  }

  return (
    <div style={{ backgroundColor: bgPrimary, color: "#F1F5F9", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: bgSecondary, borderBottom: `1px solid ${borderColor}`, padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ color: accent, fontSize: 26, fontWeight: 800, letterSpacing: -1, textDecoration: "none" }}>YapıMap</Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

          {/* LANGUAGE SWITCHER */}
          <div style={{ display: "flex", border: `1px solid ${borderColor}`, borderRadius: 8, overflow: "hidden" }}>
            <button
              onClick={() => setLang("tr")}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                backgroundColor: lang === "tr" ? accent : "transparent",
                color: lang === "tr" ? "#0F1923" : textMuted,
                transition: "all 0.2s",
              }}>
              TR
            </button>
            <button
              onClick={() => setLang("en")}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                borderLeft: `1px solid ${borderColor}`,
                backgroundColor: lang === "en" ? accent : "transparent",
                color: lang === "en" ? "#0F1923" : textMuted,
                transition: "all 0.2s",
              }}>
              EN
            </button>
            <button
              onClick={() => setLang("ru")}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                borderLeft: `1px solid ${borderColor}`,
                backgroundColor: lang === "ru" ? accent : "transparent",
                color: lang === "ru" ? "#0F1923" : textMuted,
                transition: "all 0.2s",
              }}>
              RU
            </button>
          </div>

          {userRole ? (
            <Link href={userRole === "developer" ? "/developer" : "/broker/map"}
              style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: "8px 20px", borderRadius: 8, fontSize: 14, textDecoration: "none" }}>
              {lang === "tr" ? "Dashboard →" : lang === "ru" ? "Панель →" : "Dashboard →"}
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ color: textMuted, fontSize: 14 }}>{t.nav.login}</Link>
              <Link href="/register" style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: "8px 20px", borderRadius: 8, fontSize: 14, textDecoration: "none" }}>
                {t.nav.try}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ display: "inline-block", backgroundColor: bgCard, border: `1px solid ${borderColor}`, color: accent, fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 999, marginBottom: 24 }}>
          {t.hero.badge}
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
          {t.hero.title1}<br />
          <span style={{ color: accent }}>{t.hero.title2}</span>
        </h1>
        <p style={{ color: textMuted, fontSize: 18, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
          {t.hero.subtitle}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register?role=broker" style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: "14px 32px", borderRadius: 12, fontSize: 16 }}>
            {t.hero.btnBroker}
          </Link>
          <Link href="/register?role=developer" style={{ border: `2px solid ${accent}`, color: accent, fontWeight: 600, padding: "14px 32px", borderRadius: 12, fontSize: 16 }}>
            {t.hero.btnDeveloper}
          </Link>
        </div>
      </section>

      {/* PROBLEM vs SOLUTION */}
      <section style={{ backgroundColor: bgSecondary, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>{t.problem.title}</h2>
            {t.problem.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <span style={{ color: "#EF4444", fontSize: 16, marginTop: 2 }}>✗</span>
                <p style={{ color: textMuted, fontSize: 15, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>
              {t.solution.title} <span style={{ color: accent }}>{t.solution.titleAccent}</span>
            </h2>
            {t.solution.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <span style={{ color: accent, fontSize: 16, marginTop: 2 }}>✓</span>
                <p style={{ color: textMuted, fontSize: 15, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>{t.features.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {t.features.items.map((f, i) => (
              <div key={i} style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ backgroundColor: bgSecondary, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: "60px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>{t.pricing.title}</h2>
          <p style={{ color: textMuted, textAlign: "center", marginBottom: 48 }}>{t.pricing.subtitle}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

            <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 20, padding: 32 }}>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.pricing.broker.label}</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 42, fontWeight: 900 }}>{formatPrice(249)}</span>
                <span style={{ color: textMuted, fontSize: 16 }}>{t.pricing.broker.period}</span>
              </div>
              <p style={{ color: textMuted, fontSize: 14, marginBottom: 28 }}>{t.pricing.broker.desc}</p>
              {t.pricing.broker.features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: accent }}>✓</span>
                  <span style={{ color: textMuted }}>{f}</span>
                </div>
              ))}
              <Link href="/register?role=broker" style={{ display: "block", backgroundColor: accent, color: "#0F1923", fontWeight: 700, textAlign: "center", padding: "12px 0", borderRadius: 10, marginTop: 24, fontSize: 15 }}>
                {t.pricing.broker.cta}
              </Link>
            </div>

            <div style={{ backgroundColor: bgCard, border: `2px solid ${accent}`, borderRadius: 20, padding: 32, position: "relative" }}>
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", backgroundColor: accent, color: "#0F1923", fontSize: 11, fontWeight: 800, padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>
                {t.pricing.developer.badge}
              </div>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.pricing.developer.label}</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 42, fontWeight: 900 }}>{formatPrice(249)}</span>
                <span style={{ color: textMuted, fontSize: 16 }}>{t.pricing.developer.period}</span>
              </div>
              <p style={{ color: textMuted, fontSize: 14, marginBottom: 28 }}>{t.pricing.developer.desc}</p>
              {t.pricing.developer.features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: accent }}>✓</span>
                  <span style={{ color: textMuted }}>{f}</span>
                </div>
              ))}
              <Link href="/register?role=developer" style={{ display: "block", backgroundColor: accent, color: "#0F1923", fontWeight: 700, textAlign: "center", padding: "12px 0", borderRadius: 10, marginTop: 24, fontSize: 15 }}>
                {t.pricing.developer.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "80px 24px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>{t.cta.title}</h2>
        <p style={{ color: textMuted, fontSize: 18, marginBottom: 36 }}>{t.cta.subtitle}</p>
        <Link href="/register" style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: "16px 40px", borderRadius: 12, fontSize: 17 }}>
          {t.cta.btn}
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: bgSecondary, borderTop: `1px solid ${borderColor}`, padding: "24px", textAlign: "center" }}>
        <p style={{ color: textMuted, fontSize: 13 }}>
          © 2026 YapıMap ·{" "}
          <a href="https://jtapps.dev/datenschutz/yapimap" style={{ color: textMuted }}>{t.footer.privacy}</a>
          {" · "}
          <a href="https://jtapps.dev/impressum" style={{ color: textMuted }}>{t.footer.imprint}</a>
        </p>
      </footer>

    </div>
  );
}
