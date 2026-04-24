"use client";
import Link from "next/link";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

const content = {
  tr: {
    title: "İade ve İptal Politikası",
    subtitle: "yapimap.com — Son güncelleme: Nisan 2026",
    back: "← Ana Sayfaya Dön",
    sections: [
      {
        heading: "1. Genel Kural",
        text: "YapıMap, dijital bir B2B hizmet platformudur. Abonelik ödemeleri tamamlandıktan sonra kural olarak iade yapılmamaktadır. Abonelik aktivasyonu ile hizmete anında erişim sağlandığından cayma hakkı kullanılamamaktadır.",
      },
      {
        heading: "2. İptal Hakkı",
        text: "Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işleminin ardından mevcut abonelik dönemi sonuna kadar platforma erişiminiz devam eder. Kalan süre için ücret iadesi yapılmaz.",
      },
      {
        heading: "3. Çift Ödeme veya Hatalı İşlem",
        text: "Teknik bir hata nedeniyle birden fazla ücretlendirme gerçekleşmesi durumunda fazla ödenen tutar iade edilir. Başvuru için: info@yapimap.com",
      },
      {
        heading: "4. İade Süreci",
        text: "İade talepleri 5 iş günü içinde değerlendirilir. Onaylanan iadeler, ödemenin yapıldığı yönteme (kredi kartı veya banka havalesi) 7–14 iş günü içinde yansıtılır.",
      },
      {
        heading: "5. İletişim",
        text: "İade ve iptal talepleriniz için: info@yapimap.com",
      },
    ],
  },
  en: {
    title: "Refund & Cancellation Policy",
    subtitle: "yapimap.com — Last updated: April 2026",
    back: "← Back to Home",
    sections: [
      {
        heading: "1. General Rule",
        text: "YapıMap is a digital B2B service platform. As a general rule, subscription payments are non-refundable once processed. Since access to the service is granted immediately upon subscription activation, the right of withdrawal does not apply.",
      },
      {
        heading: "2. Right to Cancel",
        text: "You may cancel your subscription at any time. After cancellation, you will continue to have access to the platform until the end of your current billing period. No refund is issued for the remaining period.",
      },
      {
        heading: "3. Duplicate or Erroneous Charges",
        text: "If a technical error results in multiple charges for the same period, the excess amount will be refunded. Please contact: info@yapimap.com",
      },
      {
        heading: "4. Refund Process",
        text: "Refund requests are reviewed within 5 business days. Approved refunds are credited back to the original payment method (credit card or bank transfer) within 7–14 business days.",
      },
      {
        heading: "5. Contact",
        text: "For refund and cancellation requests: info@yapimap.com",
      },
    ],
  },
  ru: {
    title: "Политика возврата и отмены",
    subtitle: "yapimap.com — Последнее обновление: апрель 2026",
    back: "← На главную",
    sections: [
      {
        heading: "1. Общее правило",
        text: "YapıMap — цифровая B2B-сервисная платформа. Как правило, оплата подписки не возвращается после её оформления. Поскольку доступ к сервису предоставляется немедленно после активации подписки, право на отказ не применяется.",
      },
      {
        heading: "2. Право на отмену",
        text: "Вы можете отменить подписку в любое время. После отмены доступ к платформе сохраняется до конца текущего оплаченного периода. Возврат средств за оставшийся период не производится.",
      },
      {
        heading: "3. Двойное или ошибочное списание",
        text: "Если в результате технической ошибки произошло несколько списаний за один период, излишне уплаченная сумма будет возвращена. Обращайтесь: info@yapimap.com",
      },
      {
        heading: "4. Процесс возврата",
        text: "Запросы на возврат рассматриваются в течение 5 рабочих дней. Одобренные возвраты зачисляются на исходный способ оплаты (кредитная карта или банковский перевод) в течение 7–14 рабочих дней.",
      },
      {
        heading: "5. Контакты",
        text: "По вопросам возврата и отмены: info@yapimap.com",
      },
    ],
  },
};

export default function RefundPage() {
  const { lang } = useLang();
  const tx = content[lang as keyof typeof content] ?? content.en;

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "16px 40px", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ color: accent, fontSize: 22, fontWeight: 800, textDecoration: "none" }}>YapıMap</Link>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>{tx.title}</h1>
        <p style={{ color: textMuted, fontSize: 14, marginBottom: 48 }}>{tx.subtitle}</p>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 40 }}>
          {tx.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.heading}</h3>
              <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center" }}>
          <Link href="/" style={{ color: textMuted, fontSize: 13 }}>{tx.back}</Link>
        </p>
      </div>
    </div>
  );
}
