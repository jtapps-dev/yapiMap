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
    title: "Kullanım Koşulları",
    subtitle: "yapimap.com — Son güncelleme: Nisan 2026",
    back: "← Ana Sayfaya Dön",
    sections: [
      {
        heading: "1. Hizmetin Tanımı",
        text: "YapıMap (yapimap.com), gayrimenkul geliştiricilerini ve acenteleri bir araya getiren B2B bir bilgi platformudur. Platform; proje oluşturma, harita üzerinde listeleme ve PDF katalog oluşturma araçları sunar.",
      },
      {
        heading: "2. Kullanıcı Hesapları",
        text: "Platforma erişim için kayıt gereklidir. Hesabınız iki role sahip olabilir: Geliştirici (proje yükleyebilir) veya Acenta (projeleri görüntüleyebilir ve katalog oluşturabilir). Hesap bilgilerinin doğruluğundan kullanıcı sorumludur.",
      },
      {
        heading: "3. Abonelik ve Ödeme",
        text: "Belirli özellikler ücretli abonelik gerektirir. Abonelik ücretleri, ödeme sırasında belirtilen tutarlardadır. Ödemeler Paddle aracılığıyla güvenli biçimde işlenir. Abonelik, iptal edilene kadar otomatik olarak yenilenir.",
      },
      {
        heading: "4. Kullanım Kuralları",
        text: "Kullanıcılar: yalnızca doğru ve güncel bilgi yükleyebilir, platformu yasadışı amaçlarla kullanamaz, başka kullanıcıların verilerine yetkisiz erişim sağlayamaz ve spam veya yanıltıcı içerik paylaşamaz.",
      },
      {
        heading: "5. İçerik Sorumluluğu",
        text: "Kullanıcılar tarafından yüklenen tüm içerik (proje bilgileri, görseller, PDF'ler) yalnızca ilgili kullanıcının sorumluluğundadır. YapıMap, kullanıcı içeriğinin doğruluğunu garanti etmez.",
      },
      {
        heading: "6. Hizmet Kesintileri",
        text: "YapıMap, hizmeti makul çaba ile sürekli erişilebilir tutmaya çalışır; ancak bakım, teknik arızalar veya üçüncü taraf hizmet kesintileri nedeniyle geçici erişim sorunları yaşanabilir.",
      },
      {
        heading: "7. Hesap Askıya Alma",
        text: "Bu koşulların ihlali durumunda YapıMap, önceden bildirim yapmaksızın hesabı askıya alma veya kalıcı olarak kapatma hakkına sahiptir.",
      },
      {
        heading: "8. Fikri Mülkiyet",
        text: "YapıMap platformunun tüm hakları Global Trade Real Estate'e aittir. Kullanıcı içerikleri üzerindeki haklar kullanıcıda kalır; ancak kullanıcı, YapıMap'e içeriği platform dahilinde kullanma lisansı verir.",
      },
      {
        heading: "9. Yükümlülük Sınırlaması",
        text: "YapıMap, dolaylı, arızi veya sonuç olarak ortaya çıkan zararlardan sorumlu tutulamaz. Azami sorumluluğumuz, ilgili dönemde ödenen abonelik ücretiyle sınırlıdır.",
      },
      {
        heading: "10. Geçerli Hukuk",
        text: "Bu koşullar Türk hukukuna tabidir. Uyuşmazlıklar Antalya mahkemelerinde çözüme kavuşturulur.",
      },
      {
        heading: "11. İletişim",
        text: "Sorularınız için: info@yapimap.com",
      },
    ],
  },
  en: {
    title: "Terms of Service",
    subtitle: "yapimap.com — Last updated: April 2026",
    back: "← Back to Home",
    sections: [
      {
        heading: "1. Description of Service",
        text: "YapıMap (yapimap.com) is a B2B information platform connecting real estate developers and agencies. The platform offers tools for project creation, map-based listings, and PDF catalog generation.",
      },
      {
        heading: "2. User Accounts",
        text: "Registration is required to access the platform. Accounts can have two roles: Developer (can upload projects) or Agency/Broker (can browse projects and create catalogs). Users are responsible for the accuracy of their account information.",
      },
      {
        heading: "3. Subscription & Payment",
        text: "Certain features require a paid subscription. Subscription fees are stated at the time of purchase. Payments are processed securely via Paddle. Subscriptions renew automatically until cancelled.",
      },
      {
        heading: "4. Acceptable Use",
        text: "Users must: upload only accurate and current information, not use the platform for unlawful purposes, not access other users' data without authorization, and not distribute spam or misleading content.",
      },
      {
        heading: "5. Content Responsibility",
        text: "All content uploaded by users (project details, images, PDFs) is solely the responsibility of the uploading user. YapıMap does not guarantee the accuracy of user-generated content.",
      },
      {
        heading: "6. Service Availability",
        text: "YapıMap makes reasonable efforts to keep the service continuously available; however, temporary outages may occur due to maintenance, technical issues, or third-party service interruptions.",
      },
      {
        heading: "7. Account Suspension",
        text: "In case of violation of these terms, YapıMap reserves the right to suspend or permanently close an account without prior notice.",
      },
      {
        heading: "8. Intellectual Property",
        text: "All rights to the YapıMap platform belong to Global Trade Real Estate. Users retain ownership of their content but grant YapıMap a license to display and use that content within the platform.",
      },
      {
        heading: "9. Limitation of Liability",
        text: "YapıMap is not liable for indirect, incidental, or consequential damages. Our maximum liability is limited to the subscription fee paid during the relevant period.",
      },
      {
        heading: "10. Governing Law",
        text: "These terms are governed by Turkish law. Disputes shall be resolved in the courts of Antalya, Turkey.",
      },
      {
        heading: "11. Contact",
        text: "For questions: info@yapimap.com",
      },
    ],
  },
  ru: {
    title: "Условия использования",
    subtitle: "yapimap.com — Последнее обновление: апрель 2026",
    back: "← На главную",
    sections: [
      {
        heading: "1. Описание сервиса",
        text: "YapıMap (yapimap.com) — B2B информационная платформа, объединяющая застройщиков недвижимости и агентства. Платформа предлагает инструменты для создания проектов, отображения на карте и формирования PDF-каталогов.",
      },
      {
        heading: "2. Учётные записи",
        text: "Для доступа к платформе необходима регистрация. Аккаунты бывают двух типов: Застройщик (может загружать проекты) и Агентство/Брокер (может просматривать проекты и создавать каталоги). Пользователь несёт ответственность за достоверность данных своего аккаунта.",
      },
      {
        heading: "3. Подписка и оплата",
        text: "Некоторые функции требуют платной подписки. Стоимость подписки указывается в момент оформления. Платежи обрабатываются безопасно через Paddle. Подписка продлевается автоматически до отмены.",
      },
      {
        heading: "4. Правила использования",
        text: "Пользователи обязаны: загружать только точную и актуальную информацию, не использовать платформу в незаконных целях, не получать несанкционированный доступ к данным других пользователей, не распространять спам или вводящий в заблуждение контент.",
      },
      {
        heading: "5. Ответственность за контент",
        text: "Весь контент, загружаемый пользователями (данные проектов, изображения, PDF), является исключительно их ответственностью. YapıMap не гарантирует точность пользовательского контента.",
      },
      {
        heading: "6. Доступность сервиса",
        text: "YapıMap прилагает разумные усилия для обеспечения постоянной доступности сервиса; однако возможны временные перебои из-за технического обслуживания, неполадок или сбоев сторонних сервисов.",
      },
      {
        heading: "7. Блокировка аккаунта",
        text: "В случае нарушения настоящих условий YapıMap оставляет за собой право приостановить или навсегда заблокировать аккаунт без предварительного уведомления.",
      },
      {
        heading: "8. Интеллектуальная собственность",
        text: "Все права на платформу YapıMap принадлежат Global Trade Real Estate. Пользователи сохраняют право на свой контент, однако предоставляют YapıMap лицензию на его использование в рамках платформы.",
      },
      {
        heading: "9. Ограничение ответственности",
        text: "YapıMap не несёт ответственности за косвенные, случайные или последующие убытки. Наша максимальная ответственность ограничена суммой абонентской платы, уплаченной за соответствующий период.",
      },
      {
        heading: "10. Применимое право",
        text: "Настоящие условия регулируются законодательством Турции. Споры разрешаются в судах Анталии.",
      },
      {
        heading: "11. Контакты",
        text: "По всем вопросам: info@yapimap.com",
      },
    ],
  },
};

export default function TermsPage() {
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
