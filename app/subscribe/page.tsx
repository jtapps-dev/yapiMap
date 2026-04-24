"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

const YEARLY_PLAN = {
  id: "yearly",
  priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || "",
  tr: { name: "Yıllık Plan", period: "/ yıl", badge: "En İyi Değer" },
  en: { name: "Yearly Plan", period: "/ year", badge: "Best Value" },
  ru: { name: "Годовой план", period: "/ год", badge: "Лучшее предложение" },
};

type Profile = { role: string; subscription_status: string | null };


export default function SubscribePage() {
  const { lang } = useLang();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tryRate, setTryRate] = useState<number>(51);
  const [eurPrice, setEurPrice] = useState<number>(249);
  const [activePriceId, setActivePriceId] = useState<string>(YEARLY_PLAN.priceId);
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [referralName, setReferralName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: "production",
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          router.push("/subscribe/success?provider=paddle");
        }
      },
    }).then(setPaddle);
  }, []); // eslint-disable-line

  // Referral-Code aus localStorage auto-einsetzen
  useEffect(() => {
    const pending = localStorage.getItem("pending_referral_code");
    if (pending) {
      setReferralCode(pending);
      localStorage.removeItem("pending_referral_code");
      // Auto-validieren
      setTimeout(() => applyReferralCode(pending), 300);
    }
  }, []);  // eslint-disable-line

  // Verhindert BFCACHE-Snapshot wenn von Stripe zurückgekehrt wird
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=TRY&to=EUR")
      .then(r => r.json())
      .then(d => { if (d.rates?.EUR) setTryRate(1 / d.rates.EUR); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/stripe/prices")
      .then(r => r.json())
      .then(d => { if (d.amountEur) setEurPrice(d.amountEur); if (d.priceId) setActivePriceId(d.priceId); })
      .catch(() => {});
  }, []);

  function formatPrice(eurPrice: number) {
    if (lang === "tr") {
      const try_ = Math.round(eurPrice * tryRate);
      return "₺" + try_.toLocaleString("tr-TR");
    }
    return "€" + eurPrice;
  }

  const DISCOUNT = 20; // €20 Rabatt
  const discountedPrice = eurPrice - DISCOUNT;

  async function applyReferralCode(code?: string) {
    const val = (code ?? referralCode).trim();
    if (!val) return;
    setReferralStatus("checking");
    const res = await fetch("/api/referral/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: val }),
    });
    const json = await res.json();
    if (json.valid) {
      setReferralStatus("valid");
      setReferralName(json.name);
    } else {
      setReferralStatus("invalid");
      setReferralName("");
    }
  }

  function handleReferralChange(val: string) {
    const upper = val.toUpperCase();
    setReferralCode(upper);
    setReferralStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (upper.trim().length >= 6) {
      debounceRef.current = setTimeout(() => applyReferralCode(upper), 700);
    }
  }

  function yearlyDesc() {
    const monthlyTry = Math.round((eurPrice / 12) * tryRate);
    if (lang === "tr") return `≈ ₺${monthlyTry.toLocaleString("tr-TR")}/ay — 2 ay ücretsiz.`;
    if (lang === "ru") return `≈ ₺${monthlyTry.toLocaleString("tr-TR")}/мес — 2 месяца бесплатно.`;
    return `≈ €${Math.round(eurPrice / 12)}/mo — 2 months free.`;
  }

  const tSub = {
    tr: {
      title: "YapıMap Premium",
      subtitle: "Projelerinizi yönetin ve tüm içeriklere erişin",
      devFeatures: ["Sınırsız proje oluşturma", "Fotoğraf ve PDF broşür yükleme", "Haritada yayımlama", "İstatistikler ve görüntülenme"],
      brokerFeatures: ["Tüm yayınlanan projelere tam erişim", "Proje detayları ve iletişim bilgileri", "PDF broşür indirme", "Harita filtreleri (fiyat, bölge, ikamet)"],
      cta: "Şimdi Başla",
      active: "Aboneliğiniz Aktif",
      back: "← Geri Dön",
      devTitle: "Developer",
      brokerTitle: "Emlak Danışmanı",
    },
    en: {
      title: "YapıMap Premium",
      subtitle: "Manage your projects and access all content",
      devFeatures: ["Unlimited project creation", "Photo & PDF brochure upload", "Publish on map", "Stats & view counts"],
      brokerFeatures: ["Full access to all published projects", "Project details & contact info", "PDF brochure download", "Map filters (price, region, permit)"],
      cta: "Get Started",
      active: "Subscription Active",
      back: "← Go Back",
      devTitle: "Developer",
      brokerTitle: "Real Estate Agent",
    },
    ru: {
      title: "YapıMap Premium",
      subtitle: "Управляйте проектами и получите доступ ко всему контенту",
      devFeatures: ["Неограниченное создание проектов", "Загрузка фото и PDF-брошюр", "Публикация на карте", "Статистика и просмотры"],
      brokerFeatures: ["Полный доступ ко всем проектам", "Детали проектов и контакты", "Скачивание PDF-брошюр", "Фильтры карты (цена, район, ВНЖ)"],
      cta: "Начать",
      active: "Подписка активна",
      back: "← Назад",
      devTitle: "Застройщик",
      brokerTitle: "Риелтор",
    },
  } as const;
  const t = (tSub as any)[lang] ?? tSub.en;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("role, subscription_status").eq("id", user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);  // eslint-disable-line

  async function handleCheckout() {
    if (!paddle) { alert("Payment not ready, please wait"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    paddle.Checkout.open({
      items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!, quantity: 1 }],
      customer: { email: user.email! },
      customData: { userId: user.id },
    });
    setLoading(false);
  }

  async function handleStripeCheckout() {
    if (!activePriceId) { alert("Stripe Price ID not configured"); return; }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: activePriceId,
        ...(referralStatus === "valid" && { referralCode: referralCode.trim() }),
      }),
    });
    const { url, error } = await res.json();
    if (error) { alert(error); setLoading(false); return; }
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, fontFamily: "system-ui, sans-serif", color: "#F1F5F9" }}>
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
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

        {/* Features für beide Rollen */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          {[
            { title: t.devTitle, features: t.devFeatures, icon: "🏗️" },
            { title: t.brokerTitle, features: t.brokerFeatures, icon: "🔑" },
          ].map(block => (
            <div key={block.title} style={{ backgroundColor: bgCard, borderRadius: 12, padding: "20px 24px", border: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{block.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: accent }}>{block.title}</div>
              {(block.features as string[]).map((f: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#CBD5E1", marginBottom: 6 }}>
                  <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Plan */}
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", backgroundColor: accent, color: bgPrimary, fontSize: 11, fontWeight: 800, padding: "3px 16px", borderRadius: 999, letterSpacing: 1, whiteSpace: "nowrap" }}>
            {YEARLY_PLAN[lang as "tr" | "en" | "ru"].badge}
          </div>
          <div style={{ backgroundColor: bgCard, borderRadius: 12, padding: 36, border: `2px solid ${accent}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{YEARLY_PLAN[lang as "tr" | "en" | "ru"].name}</div>
            <div style={{ marginBottom: 8 }}>
              {referralStatus === "valid" ? (
                <>
                  <span style={{ fontSize: 32, fontWeight: 800, color: textMuted, textDecoration: "line-through", marginRight: 10 }}>{formatPrice(eurPrice)}</span>
                  <span style={{ fontSize: 42, fontWeight: 800, color: accent }}>{formatPrice(discountedPrice)}</span>
                </>
              ) : (
                <span style={{ fontSize: 42, fontWeight: 800, color: accent }}>{formatPrice(eurPrice)}</span>
              )}
              <span style={{ color: textMuted, fontSize: 14, marginLeft: 6 }}>{YEARLY_PLAN[lang as "tr" | "en" | "ru"].period}</span>
            </div>
            <div style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>{yearlyDesc()}</div>

            {/* Referral Code */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: "relative" }}>
                <input
                  value={referralCode}
                  onChange={e => handleReferralChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyReferralCode(); } }}
                  placeholder={lang === "tr" ? "Referral kodu (opsiyonel)" : lang === "ru" ? "Реферальный код (необязательно)" : "Referral code (optional)"}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 14px",
                    backgroundColor: bgPrimary,
                    border: `1px solid ${referralStatus === "valid" ? "#10B981" : referralStatus === "invalid" ? "#EF4444" : borderColor}`,
                    borderRadius: 8,
                    color: "#F1F5F9",
                    fontSize: 14,
                    outline: "none",
                    letterSpacing: referralCode ? 2 : 0,
                    boxSizing: "border-box" as const,
                  }}
                />
                {referralStatus === "checking" && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: textMuted, fontSize: 12 }}>...</span>
                )}
                {referralStatus === "valid" && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#10B981", fontSize: 16 }}>✓</span>
                )}
                {referralStatus === "invalid" && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#EF4444", fontSize: 16 }}>✗</span>
                )}
              </div>
              {referralStatus === "valid" && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#10B981", display: "flex", alignItems: "center", gap: 6, backgroundColor: "#10B98115", border: "1px solid #10B98133", borderRadius: 8, padding: "8px 12px" }}>
                  🎉 {lang === "tr" ? `${referralName} sizi davet etti — €${DISCOUNT} indirim uygulandı!` : lang === "ru" ? `${referralName} пригласил вас — скидка €${DISCOUNT} применена!` : `${referralName} invited you — €${DISCOUNT} discount applied!`}
                </div>
              )}
              {referralStatus === "invalid" && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#EF4444" }}>
                  {lang === "tr" ? "Geçersiz referral kodu." : lang === "ru" ? "Неверный реферальный код." : "Invalid referral code."}
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || !paddle}
              style={{ width: "100%", padding: "14px", backgroundColor: accent, color: bgPrimary, fontWeight: 700, fontSize: 15, borderRadius: 8, border: "none", cursor: (loading || !paddle) ? "not-allowed" : "pointer", opacity: (loading || !paddle) ? 0.7 : 1 }}>
              {loading ? "..." : t.cta}
            </button>
            <button
              onClick={handleStripeCheckout}
              disabled={loading}
              style={{ width: "100%", marginTop: 10, padding: "10px", backgroundColor: "transparent", color: textMuted, fontWeight: 500, fontSize: 13, borderRadius: 8, border: `1px solid ${borderColor}`, cursor: loading ? "not-allowed" : "pointer" }}>
              {lang === "tr" ? "Stripe ile öde" : lang === "ru" ? "Оплатить через Stripe" : "Pay with Stripe"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", color: textMuted, fontSize: 12, marginTop: 24 }}>
          {lang === "tr" ? "Kredi kartı ile güvenli ödeme · İstediğiniz zaman iptal edebilirsiniz" : lang === "ru" ? "Безопасная оплата картой · Отмена в любое время" : "Secure payment by credit card · Cancel anytime"}
        </p>
      </div>
    </div>
  );
}
