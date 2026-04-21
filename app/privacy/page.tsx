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
    title: "Gizlilik Politikası ve Kullanıcı Sözleşmesi",
    subtitle: "Yapimap.com — Hukuki Bilgiler",
    back: "← Ana Sayfaya Dön",
    agreement: {
      title: "Kullanıcı Sözleşmesi",
      sections: [
        {
          heading: "1. Genel Hükümler",
          text: "yapimap.com web sitesi (bundan böyle \"Hizmet\" olarak anılacaktır), kullanıcılara gayrimenkul, geliştirici firmalar ve acenteler hakkında bilgiye erişim sağlayan bilgi platformudur. Hizmet; bir geliştirici, gayrimenkul satıcısı, gayrimenkul acentesi veya komisyoncu değildir.",
        },
        {
          heading: "2. Hizmetin Rolü",
          text: "Hizmet yalnızca aracılık işlevi görür: Gayrimenkul nesneleri hakkında bilgi sağlar ve kullanıcı taleplerini iş ortaklarına (geliştiriciler, acenteler) iletir. Hizmet, kullanıcılar ile üçüncü taraflar arasındaki işlemlerin yapılmasına katılmaz.",
        },
        {
          heading: "3. Veri Aktarımı",
          text: "Web sitesinde talep gönderen kullanıcı, iletişim bilgilerinin (ad, telefon numarası, e-posta) üçüncü taraflara (geliştiriciler, gayrimenkul acenteleri) aktarılmasına ve bu verilerin söz konusu üçüncü taraflarca işlenmesine onay verir.",
        },
        {
          heading: "4. Sorumluluk",
          text: "Hizmet aşağıdakilerden sorumlu değildir: gayrimenkul bilgilerinin doğruluğu, fiyat, koşul veya inşaat süresi değişiklikleri, geliştiricilerin, gayrimenkul acentelerinin veya diğer üçüncü tarafların eylemleri. Tüm işlemler doğrudan kullanıcı ile ortak arasında gerçekleştirilir.",
        },
        {
          heading: "5. Mali Koşullar",
          text: "Hizmet, müşteri kazanımı ve talep aktarımı için ortaklardan ücret alabilir. Aksi belirtilmedikçe kullanıcı, Hizmet'in hizmetleri için herhangi bir ödeme yapmaz.",
        },
        {
          heading: "6. Web Sitesinin Kullanımı",
          text: "Kullanıcı, doğru bilgi sağlamayı ve web sitesini yasadışı amaçlarla kullanmamayı kabul eder. Hizmet, bu koşulların ihlali halinde erişimi kısıtlama hakkına sahiptir.",
        },
        {
          heading: "7. Sözleşme Değişiklikleri",
          text: "Hizmet, bu sözleşmeyi önceden haber vermeksizin değiştirme hakkını saklı tutar. Güncel sürüm her zaman web sitesinde mevcuttur.",
        },
        {
          heading: "8. İletişim",
          text: "Tüm sorgular için: info@yapimap.com",
        },
      ],
    },
    privacy: {
      title: "Gizlilik Politikası",
      sections: [
        {
          heading: "1. Veri Toplama",
          text: "Aşağıdaki verileri topluyoruz: ad soyad, telefon numarası, e-posta, vergi numarası, IP adresi.",
        },
        {
          heading: "2. İşleme Amacı",
          text: "Veriler şu amaçlarla kullanılır: kullanıcıyla iletişim, taleplerin iş ortaklarına iletilmesi, hizmetin iyileştirilmesi.",
        },
        {
          heading: "3. Üçüncü Taraflarla Paylaşım",
          text: "Veriler şu taraflarla paylaşılabilir: geliştiriciler, gayrimenkul acenteleri, hizmet ortakları.",
        },
        {
          heading: "4. Veri Saklama",
          text: "Veriler, işleme amaçlarının yerine getirilmesi için gerekli olduğu sürece saklanır.",
        },
        {
          heading: "5. Veri Koruma",
          text: "Hizmet, verileri korumak için önlemler alır; ancak mutlak güvenliği garanti edemez.",
        },
        {
          heading: "6. Kullanıcı Hakları",
          text: "Kullanıcının aşağıdaki hakları vardır: verilerinin silinmesini talep etme, verilerini değiştirme, onayı geri çekme.",
        },
        {
          heading: "7. Çerezler",
          text: "Web sitesi, analiz ve hizmet geliştirme amacıyla çerezler kullanır.",
        },
        {
          heading: "8. Değişiklikler",
          text: "Bu politika, önceden haber verilmeksizin güncellenebilir.",
        },
        {
          heading: "9. İletişim",
          text: "info@yapimap.com",
        },
      ],
    },
    disclaimer: {
      title: "Yasal Sorumluluk Reddi",
      text: "Bu sayfada yer alan bilgiler yalnızca bilgi amaçlıdır ve bir teklif, sözleşme veya hukuken bağlayıcı bir beyan niteliği taşımaz. Hizmet, bilgilerin doğruluğunu, eksiksizliğini veya güncelliğini garanti etmez. Fiyatlar, stok durumu ve özellikler dahil tüm mülk bilgileri önceden haber verilmeksizin değişebilir. Hizmet bir gayrimenkul komisyoncusu, acentesi veya satıcısı değildir ve kullanıcılar ile üçüncü taraflar arasındaki işlemlere katılmaz. Tüm sözleşmeler doğrudan kullanıcı ile ilgili ortak arasında akdedilir.",
    },
  },
  en: {
    title: "Privacy Policy & User Agreement",
    subtitle: "yapimap.com — Legal Information",
    back: "← Back to Home",
    agreement: {
      title: "User Agreement",
      sections: [
        {
          heading: "1. General Provisions",
          text: "The website yapimap.com (hereinafter referred to as the \"Service\") is an informational platform that provides users with access to information about real estate, developers, and agencies. The Service is not a developer, real estate seller, real estate agency, or broker.",
        },
        {
          heading: "2. Role of the Service",
          text: "The Service performs solely an intermediary function: provides information about real estate properties and transfers user inquiries to partners (developers, agencies). The Service does not participate in the conclusion of transactions between users and third parties.",
        },
        {
          heading: "3. Data Transfer",
          text: "By submitting a request on the website, the user agrees to the transfer of their contact details (name, phone number, email) and the processing of this data by third parties (developers, real estate agencies).",
        },
        {
          heading: "4. Liability",
          text: "The Service is not responsible for: the accuracy of property information, changes in prices, terms, or construction deadlines, actions of developers, real estate agents, or other third parties. All transactions are concluded directly between the user and the partner.",
        },
        {
          heading: "5. Financial Terms",
          text: "The Service may receive compensation from partners for attracting clients and transferring inquiries. The user does not pay for the Service's services unless otherwise specified.",
        },
        {
          heading: "6. Use of the Website",
          text: "The user agrees to provide accurate information and not use the website for unlawful purposes. The Service has the right to restrict access in case of violation of these terms.",
        },
        {
          heading: "7. Changes to the Agreement",
          text: "The Service reserves the right to modify this agreement without prior notice. The current version is always available on the website.",
        },
        {
          heading: "8. Contact",
          text: "For all inquiries: info@yapimap.com",
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      sections: [
        {
          heading: "1. Data Collection",
          text: "We collect: full name, phone number, email, tax number, IP address.",
        },
        {
          heading: "2. Purpose of Processing",
          text: "The data is used for: contacting the user, transferring inquiries to partners, improving the service.",
        },
        {
          heading: "3. Sharing with Third Parties",
          text: "Data may be shared with: developers, real estate agencies, service partners.",
        },
        {
          heading: "4. Data Retention",
          text: "We store data for as long as necessary to fulfill the purposes of processing.",
        },
        {
          heading: "5. Data Protection",
          text: "The Service takes measures to protect data but cannot guarantee absolute security.",
        },
        {
          heading: "6. User Rights",
          text: "The user has the right to: request deletion of their data, modify their data, withdraw consent.",
        },
        {
          heading: "7. Cookies",
          text: "The website uses cookies for analysis and service improvement.",
        },
        {
          heading: "8. Changes",
          text: "This policy may be updated without prior notice.",
        },
        {
          heading: "9. Contact",
          text: "info@yapimap.com",
        },
      ],
    },
    disclaimer: {
      title: "Legal Disclaimer",
      text: "The information provided on this page is for informational purposes only and does not constitute an offer, contract, or legally binding representation. The Service does not guarantee the accuracy, completeness, or timeliness of the information. All property details, including prices, availability, and specifications, are subject to change without notice. The Service is not a real estate broker, agent, or seller and does not participate in transactions between users and third parties. Any agreements are concluded directly between the user and the respective partner.",
    },
  },
  ru: {
    title: "Политика конфиденциальности и Пользовательское соглашение",
    subtitle: "yapimap.com — Правовая информация",
    back: "← На главную",
    agreement: {
      title: "Пользовательское соглашение",
      sections: [
        {
          heading: "1. Общие положения",
          text: "Сайт yapimap.com (далее — «Сервис») является информационной платформой, предоставляющей пользователям доступ к информации о недвижимости, застройщиках и агентствах. Сервис не является застройщиком, продавцом недвижимости, агентством недвижимости или брокером.",
        },
        {
          heading: "2. Роль Сервиса",
          text: "Сервис выполняет исключительно посредническую функцию: предоставляет информацию об объектах недвижимости и передаёт запросы пользователей партнёрам (застройщикам, агентствам). Сервис не участвует в заключении сделок между пользователями и третьими лицами.",
        },
        {
          heading: "3. Передача данных",
          text: "Отправляя заявку на сайте, пользователь даёт согласие на передачу своих контактных данных (имя, номер телефона, email) третьим лицам (застройщикам, агентствам недвижимости) и на обработку этих данных указанными третьими лицами.",
        },
        {
          heading: "4. Ответственность",
          text: "Сервис не несёт ответственности за: точность информации об объектах, изменение цен, условий или сроков строительства, действия застройщиков, агентов по недвижимости или иных третьих лиц. Все сделки заключаются напрямую между пользователем и партнёром.",
        },
        {
          heading: "5. Финансовые условия",
          text: "Сервис может получать вознаграждение от партнёров за привлечение клиентов и передачу заявок. Пользователь не оплачивает услуги Сервиса, если иное не предусмотрено.",
        },
        {
          heading: "6. Использование сайта",
          text: "Пользователь обязуется предоставлять достоверную информацию и не использовать сайт в незаконных целях. Сервис вправе ограничить доступ при нарушении настоящих условий.",
        },
        {
          heading: "7. Изменения соглашения",
          text: "Сервис оставляет за собой право изменять настоящее соглашение без предварительного уведомления. Актуальная версия всегда доступна на сайте.",
        },
        {
          heading: "8. Контакты",
          text: "По всем вопросам: info@yapimap.com",
        },
      ],
    },
    privacy: {
      title: "Политика конфиденциальности",
      sections: [
        {
          heading: "1. Сбор данных",
          text: "Мы собираем: имя и фамилию, номер телефона, email, ИНН, IP-адрес.",
        },
        {
          heading: "2. Цели обработки",
          text: "Данные используются для: связи с пользователем, передачи запросов партнёрам, улучшения сервиса.",
        },
        {
          heading: "3. Передача третьим лицам",
          text: "Данные могут передаваться: застройщикам, агентствам недвижимости, сервисным партнёрам.",
        },
        {
          heading: "4. Хранение данных",
          text: "Данные хранятся столько, сколько необходимо для выполнения целей обработки.",
        },
        {
          heading: "5. Защита данных",
          text: "Сервис принимает меры для защиты данных, однако не может гарантировать абсолютную безопасность.",
        },
        {
          heading: "6. Права пользователя",
          text: "Пользователь вправе: запросить удаление своих данных, изменить свои данные, отозвать согласие.",
        },
        {
          heading: "7. Cookies",
          text: "Сайт использует файлы cookies для анализа и улучшения сервиса.",
        },
        {
          heading: "8. Изменения",
          text: "Настоящая политика может обновляться без предварительного уведомления.",
        },
        {
          heading: "9. Контакты",
          text: "info@yapimap.com",
        },
      ],
    },
    disclaimer: {
      title: "Правовая оговорка",
      text: "Информация, размещённая на данной странице, носит исключительно информационный характер и не является публичной офертой, договором или юридически обязывающим предложением. Сервис не гарантирует точность, полноту и актуальность информации. Все данные об объектах, включая цены, наличие и характеристики, могут изменяться без предварительного уведомления. Сервис не является застройщиком, продавцом, агентством или брокером недвижимости и не участвует в сделках между пользователями и третьими лицами. Все договоры заключаются напрямую между пользователем и соответствующим партнёром.",
    },
  },
};

export default function DatenschutzPage() {
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

        {/* User Agreement */}
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: accent, marginBottom: 24 }}>{tx.agreement.title}</h2>
          {tx.agreement.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.heading}</h3>
              <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>

        {/* Privacy Policy */}
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: accent, marginBottom: 24 }}>{tx.privacy.title}</h2>
          {tx.privacy.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.heading}</h3>
              <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ backgroundColor: "#0F2336", border: `1px solid ${borderColor}`, borderRadius: 16, padding: 32, marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: textMuted, marginBottom: 12 }}>{tx.disclaimer.title}</h2>
          <p style={{ color: textMuted, fontSize: 13, lineHeight: 1.8 }}>{tx.disclaimer.text}</p>
        </div>

        <p style={{ textAlign: "center" }}>
          <Link href="/" style={{ color: textMuted, fontSize: 13 }}>{tx.back}</Link>
        </p>
      </div>
    </div>
  );
}
