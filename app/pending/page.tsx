"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

export default function PendingPage() {
  const { lang } = useLang();
  const [status, setStatus] = useState<"loading" | "pending" | "rejected">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setStatus("pending"); return; }
      supabase.from("profiles").select("status").eq("id", user.id).single()
        .then(({ data }) => {
          setStatus(data?.status === "rejected" ? "rejected" : "pending");
        });
    });
  }, []);

  const tPending = {
    tr: {
      pending: {
        icon: "⏳",
        title: "Hesabınız İnceleniyor",
        text: "Ekibimiz talebinizi inceliyor. En kısa sürede sizi arayacak ve hesabınızı aktive edecek.",
      },
      rejected: {
        icon: "❌",
        title: "Başvurunuz Reddedildi",
        text: "Üzgünüz, başvurunuz onaylanmadı. Daha fazla bilgi için lütfen bizimle iletişime geçin.",
      },
      back: "Ana Sayfaya Dön",
    },
    en: {
      pending: {
        icon: "⏳",
        title: "Account Under Review",
        text: "Our team is reviewing your request. We will contact you shortly to activate your account.",
      },
      rejected: {
        icon: "❌",
        title: "Application Rejected",
        text: "Unfortunately your application was not approved. Please contact us for more information.",
      },
      back: "Back to Home",
    },
    ru: {
      pending: {
        icon: "⏳",
        title: "Аккаунт на проверке",
        text: "Наша команда рассматривает вашу заявку. Мы свяжемся с вами в ближайшее время для активации аккаунта.",
      },
      rejected: {
        icon: "❌",
        title: "Заявка отклонена",
        text: "К сожалению, ваша заявка не была одобрена. Пожалуйста, свяжитесь с нами для получения дополнительной информации.",
      },
      back: "На главную",
    },
  } as const;
  const t = (tPending as any)[lang] ?? tPending.en;

  if (status === "loading") return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: textMuted }}>...</p>
    </div>
  );

  const content = status === "rejected" ? t.rejected : t.pending;

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: bgCard, border: `1px solid ${status === "rejected" ? "#EF4444" : borderColor}`, borderRadius: 20, padding: 48, maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>{content.icon}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: status === "rejected" ? "#EF4444" : "#F1F5F9" }}>{content.title}</h1>
        <p style={{ color: textMuted, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>{content.text}</p>
        <Link href="/" style={{ color: accent, fontSize: 14, fontWeight: 600 }}>{t.back}</Link>
      </div>
    </div>
  );
}
