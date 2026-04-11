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

const PLANS = [
  {
    id: "monthly",
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "",
    tr: { name: "Aylık Plan", price: "€29", period: "/ ay", desc: "Her ay yenilenir. İstediğiniz zaman iptal." },
    en: { name: "Monthly Plan", price: "€29", period: "/ month", desc: "Renews monthly. Cancel anytime." },
  },
  {
    id: "yearly",
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || "",
    tr: { name: "Yıllık Plan", price: "€249", period: "/ yıl", desc: "≈ €20/ay — 2 ay ücretsiz.", badge: "En Popüler" },
    en: { name: "Yearly Plan", price: "€249", period: "/ year", desc: "≈ €20/mo — 2 months free.", badge: "Most Popular" },
    popular: true,
  },
];

type Profile = { role: string; subscription_status: string | null; created_at: string };

function trialDaysLeft(createdAt: string): number {
  const created = new Date(createdAt);
  const trialEnd = new Date(created);
  trialEnd.setMonth(trialEnd.getMonth() + 3);
  const diff = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function SubscribePage() {
  const { lang } = useLang();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const t = {
    tr: {
      title: "YapiMap Premium",
      subtitle: "Projelerinizi yönetin ve tüm içeriklere erişin",
      devFeatures: ["Sınırsız proje oluşturma", "Fotoğraf ve PDF broşür yükleme", "Haritada yayımlama", "İstatistikler ve görüntülenme"],
      brokerFeatures: ["Tüm yayınlanan projelere tam erişim", "Proje detayları ve iletişim bilgileri", "PDF broşür indirme", "Harita filtreleri (fiyat, bölge, ikamet)"],
      cta: "Şimdi Başla",
      active: "Aboneliğiniz Aktif",
      trialInfo: (days: number) => `Developer hesabınızda ${days} gün ücretsiz kullanım hakkınız kaldı.`,
      trialExpired: "3 aylık ücretsiz süreniz doldu. Devam etmek için abone olun.",
      back: "← Geri Dön",
      devTitle: "Developer",
      brokerTitle: "Emlak Danışmanı",
    },
    en: {
      title: "YapiMap Premium",
      subtitle: "Manage your projects and access all content",
      devFeatures: ["Unlimited project creation", "Photo & PDF brochure upload", "Publish on map", "Stats & view counts"],
      brokerFeatures: ["Full access to all published projects", "Project details & contact info", "PDF brochure download", "Map filters (price, region, permit)"],
      cta: "Get Started",
      active: "Subscription Active",
      trialInfo: (days: number) => `You have ${days} days left in your free developer trial.`,
      trialExpired: "Your 3-month free trial has ended. Subscribe to continue.",
      back: "← Go Back",
      devTitle: "Developer",
      brokerTitle: "Real Estate Agent",
    },
  }[lang];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("role, subscription_status, created_at").eq("id", user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  async function handleCheckout(priceId: string, planId: string) {
    if (!priceId) { alert("Stripe Price ID not configured"); return; }
    setLoading(planId);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const { url, error } = await res.json();
    if (error) { alert(error); setLoading(null); return; }
    window.location.href = url;
  }

  const backUrl = profile?.role === "developer" ? "/developer" : "/broker/map";

  if (profile?.subscription_status === "active") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✓</div>
          <div style={{ color: "#10B981", fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{t.active}</div>
          <button onClick={() => router.push(backUrl)}
            style={{ padding: "10px 24px", backgroundColor: accent, color: bgPrimary, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14 }}>
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  const isDev = profile?.role === "developer";
  const daysLeft = profile ? trialDaysLeft(profile.created_at) : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, fontFamily: "system-ui, sans-serif", color: "#F1F5F9" }}>
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: accent, fontSize: 20, fontWeight: 800 }}>YapiMap</span>
        <button onClick={() => router.push(backUrl)}
          style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          {t.back}
        </button>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", backgroundColor: `${accent}22`, color: accent, padding: "4px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
            PREMIUM
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>{t.title}</h1>
          <p style={{ color: textMuted, fontSize: 16 }}>{t.subtitle}</p>
        </div>

        {/* Trial banner for developers */}
        {isDev && (
          <div style={{ backgroundColor: daysLeft > 0 ? "#10B98120" : "#EF444420", border: `1px solid ${daysLeft > 0 ? "#10B981" : "#EF4444"}`, borderRadius: 10, padding: "14px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>{daysLeft > 0 ? "⏳" : "⚠️"}</span>
            <span style={{ fontSize: 14, color: daysLeft > 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>
              {daysLeft > 0 ? t.trialInfo(daysLeft) : t.trialExpired}
            </span>
          </div>
        )}

        {/* Features für beide Rollen */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          {[
            { title: t.devTitle, features: t.devFeatures, icon: "🏗️" },
            { title: t.brokerTitle, features: t.brokerFeatures, icon: "🔑" },
          ].map(block => (
            <div key={block.title} style={{ backgroundColor: bgCard, borderRadius: 12, padding: "20px 24px", border: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{block.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: accent }}>{block.title}</div>
              {block.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#CBD5E1", marginBottom: 6 }}>
                  <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {PLANS.map(plan => {
            const p = plan[lang as "tr" | "en"];
            return (
              <div key={plan.id} style={{ backgroundColor: bgCard, borderRadius: 12, padding: 28, border: `2px solid ${plan.popular ? accent : borderColor}`, position: "relative" }}>
                {plan.popular && "badge" in p && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", backgroundColor: accent, color: bgPrimary, fontSize: 11, fontWeight: 800, padding: "3px 14px", borderRadius: 999, letterSpacing: 1 }}>
                    {(p as { badge: string }).badge}
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: accent }}>{p.price}</span>
                  <span style={{ color: textMuted, fontSize: 14, marginLeft: 4 }}>{p.period}</span>
                </div>
                <div style={{ color: textMuted, fontSize: 13, marginBottom: 24 }}>{p.desc}</div>
                <button
                  onClick={() => handleCheckout(plan.priceId, plan.id)}
                  disabled={loading === plan.id}
                  style={{ width: "100%", padding: "12px", backgroundColor: plan.popular ? accent : "transparent", color: plan.popular ? bgPrimary : accent, fontWeight: 700, fontSize: 14, borderRadius: 8, border: `2px solid ${accent}`, cursor: "pointer", opacity: loading === plan.id ? 0.7 : 1 }}>
                  {loading === plan.id ? "..." : t.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", color: textMuted, fontSize: 12, marginTop: 24 }}>
          {lang === "tr" ? "Kredi kartı ile güvenli ödeme · İstediğiniz zaman iptal edebilirsiniz" : "Secure payment by credit card · Cancel anytime"}
        </p>
      </div>
    </div>
  );
}
