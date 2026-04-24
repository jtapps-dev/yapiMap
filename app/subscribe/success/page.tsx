"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";

function SuccessContent() {
  const router = useRouter();
  const { lang } = useLang();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const provider = searchParams.get("provider");
    const activate = async () => {
      if (provider === "paddle") {
        // Webhook aktiviert DB — kurz warten dann weiter
        await new Promise(r => setTimeout(r, 3000));
      } else if (sessionId) {
        await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      }
      router.push("/broker/map");
    };
    activate();
  }, []); // eslint-disable-line

  const tSuccess = {
    tr: { title: "Abonelik Aktif!", sub: "YapıMap Premium'a hoş geldiniz. Tüm projelere artık erişebilirsiniz.", redirect: "Haritaya yönlendiriliyorsunuz..." },
    en: { title: "Subscription Active!", sub: "Welcome to YapıMap Premium. You now have full access to all projects.", redirect: "Redirecting to map..." },
    ru: { title: "Подписка активна!", sub: "Добро пожаловать в YapıMap Premium. Теперь у вас есть полный доступ ко всем проектам.", redirect: "Переход на карту..." },
  };
  const t = tSuccess[lang as keyof typeof tSuccess] ?? tSuccess.en;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#F1F5F9" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: accent, marginBottom: 12 }}>{t.title}</h1>
        <p style={{ color: "#94A3B8", fontSize: 16, marginBottom: 24, maxWidth: 400 }}>{t.sub}</p>
        <p style={{ color: "#4A5568", fontSize: 13 }}>{t.redirect}</p>
      </div>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
