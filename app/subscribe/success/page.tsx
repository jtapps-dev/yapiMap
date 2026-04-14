"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const { lang } = useLang();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/broker/map"), 4000);
    return () => clearTimeout(timer);
  }, []);

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
