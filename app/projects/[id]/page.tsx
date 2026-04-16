"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

type Project = {
  id: string; title: string; city: string; district: string; project_type: string;
  min_price: number; max_price: number; description: string | null;
  ikamet_eligible: boolean; cover_image_url: string | null; pdf_url: string | null;
  lat: number; lng: number;
  contact_name: string | null; contact_phone: string | null; contact_email: string | null;
  profiles: { full_name: string; logo_url: string | null; phone: string | null; email: string | null } | null;
};
type Image = { id: string; url: string };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [tryRate, setTryRate] = useState<number>(51);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=TRY&to=EUR")
      .then(r => r.json())
      .then(d => { if (d.rates?.EUR) setTryRate(1 / d.rates.EUR); })
      .catch(() => {});
  }, []);

  const monthlyPrice = lang === "tr" ? `₺${Math.round(29 * tryRate).toLocaleString("tr-TR")}/ay` : "€29/mo";
  const yearlyLabel = lang === "tr" ? "Yıllık plan için →" : "Yearly plan →";

  const tLabels = {
    tr: {
      back: "← Haritaya Dön", type: "Tip", location: "Konum", price: "Fiyat Aralığı",
      ikamet: "İkamet İzni Uygun", gallery: "Galeri", contact: "İletişim",
      pdf: "Broşürü İndir", whatsapp: "WhatsApp ile İletişim",
      paywallTitle: "Premium İçerik",
      paywallText: "Proje detaylarını, iletişim bilgilerini ve PDF broşürü görmek için abone olun.",
      subscribe: `Abone Ol — ${monthlyPrice}`, alreadySub: yearlyLabel,
    },
    en: {
      back: "← Back to Map", type: "Type", location: "Location", price: "Price Range",
      ikamet: "Residence Permit Eligible", gallery: "Gallery", contact: "Contact",
      pdf: "Download Brochure", whatsapp: "Contact via WhatsApp",
      paywallTitle: "Premium Content",
      paywallText: "Subscribe to view project details, contact info and PDF brochure.",
      subscribe: `Subscribe — ${monthlyPrice}`, alreadySub: yearlyLabel,
    },
    ru: {
      back: "← Назад к карте", type: "Тип", location: "Расположение", price: "Диапазон цен",
      ikamet: "Подходит для ВНЖ", gallery: "Галерея", contact: "Контакт",
      pdf: "Скачать брошюру", whatsapp: "Связаться через WhatsApp",
      paywallTitle: "Премиум контент",
      paywallText: "Оформите подписку, чтобы просматривать детали проекта, контакты и PDF-брошюру.",
      subscribe: `Подписаться — ${monthlyPrice}`, alreadySub: yearlyLabel,
    },
  };
  const t = tLabels[lang as keyof typeof tLabels] ?? tLabels.en;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      const [{ data: profile }, { data: proj }, { data: imgs }] = await Promise.all([
        supabase.from("profiles").select("subscription_status").eq("id", user.id).single(),
        supabase.from("projects").select("id, title, city, district, project_type, min_price, max_price, description, ikamet_eligible, cover_image_url, pdf_url, lat, lng, contact_name, contact_phone, contact_email, profiles(full_name, logo_url, phone, email)").eq("id", id).eq("status", "published").single(),
        supabase.from("project_images").select("id, url").eq("project_id", id),
      ]);

      setSubscribed(profile?.subscription_status === "active");
      setProject(proj as Project | null);
      setImages((imgs as Image[]) || []);

      // Signed URL für privaten PDF Bucket
      const pdfUrl = (proj as any)?.pdf_url;
      if (pdfUrl) {
        const match = pdfUrl.match(/project-pdfs\/(.+)$/);
        if (match) {
          const { data } = await supabase.storage.from("project-pdfs").createSignedUrl(match[1], 3600);
          if (data?.signedUrl) setSignedPdfUrl(data.signedUrl);
        }
      }

      setLoading(false);
    });
  }, [id]);

  function formatPrice(n: number) {
    return "₺" + n.toLocaleString("tr-TR");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: textMuted }}>...</p>
    </div>
  );

  if (!project) return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: textMuted }}>Project not found.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bgPrimary, color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
        <button onClick={() => router.push("/broker/map")}
          style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          {t.back}
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Cover + Logo */}
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 28, backgroundColor: bgCard, height: 280 }}>
          {project.cover_image_url
            ? <img src={project.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1E2D3D, #0F1923)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: borderColor, fontSize: 48 }}>🏢</span>
              </div>
          }
          {project.profiles?.logo_url && (
            <div style={{ position: "absolute", bottom: 16, left: 16, backgroundColor: "rgba(15,25,35,0.9)", borderRadius: 8, padding: "8px 12px" }}>
              <img src={project.profiles.logo_url} alt="" style={{ height: 32, maxWidth: 140, objectFit: "contain" }} />
            </div>
          )}
        </div>

        {/* Title + basic info */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{project.title}</h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: textMuted, fontSize: 14 }}>
            <span>📍 {project.district}, {project.city}</span>
            <span>🏠 {project.project_type}</span>
            <span style={{ color: accent, fontWeight: 700 }}>{formatPrice(project.min_price)} – {formatPrice(project.max_price)}</span>
          </div>
          {project.ikamet_eligible && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "#10B98120", color: "#10B981", padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: "1px solid #10B981" }}>
              ✓ {t.ikamet}
            </div>
          )}
        </div>

        {/* Gallery (public) */}
        {images.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>{t.gallery}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {images.map(img => (
                <img key={img.id} src={img.url} alt="" onClick={() => setSelectedImg(img.url)}
                  style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: `1px solid ${borderColor}` }} />
              ))}
            </div>
          </div>
        )}

        {/* PAYWALL or DETAILS */}
        {!subscribed ? (
          <div style={{ backgroundColor: bgCard, borderRadius: 14, padding: 36, border: `1px solid ${borderColor}`, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{t.paywallTitle}</h2>
            <p style={{ color: textMuted, fontSize: 15, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>{t.paywallText}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.push("/subscribe")}
                style={{ padding: "12px 28px", backgroundColor: accent, color: bgPrimary, fontWeight: 800, fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer" }}>
                {t.subscribe}
              </button>
              <button onClick={() => router.push("/subscribe")}
                style={{ padding: "12px 28px", backgroundColor: "transparent", color: accent, fontWeight: 700, fontSize: 14, borderRadius: 10, border: `2px solid ${accent}`, cursor: "pointer" }}>
                {t.alreadySub}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Description */}
            {project.description && (
              <div style={{ backgroundColor: bgCard, borderRadius: 12, padding: 24, border: `1px solid ${borderColor}` }}>
                <p style={{ color: "#CBD5E1", lineHeight: 1.8, fontSize: 15 }}>{project.description}</p>
              </div>
            )}

            {/* Contact + PDF */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(() => {
                // Projektspezifischer Kontakt hat Vorrang, Fallback auf Account-Daten
                const contactName = project.contact_name || project.profiles?.full_name || null;
                const contactPhone = project.contact_phone || project.profiles?.phone || null;
                const contactEmail = project.contact_email || project.profiles?.email || null;
                if (!contactName) return null;
                const waMsg = lang === "tr" ? `Merhaba, YapıMap'te "${project.title}" projenizle ilgileniyorum.` : lang === "ru" ? `Здравствуйте, меня интересует ваш проект "${project.title}" на YapıMap.` : `Hello, I'm interested in your project "${project.title}" on YapıMap.`;
                return (
                  <div style={{ backgroundColor: bgCard, borderRadius: 12, padding: 20, border: `1px solid ${borderColor}` }}>
                    <div style={{ fontSize: 11, color: textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{t.contact}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{contactName}</div>
                    {contactPhone && (
                      <a href={`tel:${contactPhone.replace(/\s/g, "")}`}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#F1F5F9", textDecoration: "none", marginBottom: 8 }}>
                        <span>📞</span><span>{contactPhone}</span>
                      </a>
                    )}
                    {contactEmail && (
                      <a href={`mailto:${contactEmail}`}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#F1F5F9", textDecoration: "none", marginBottom: 14 }}>
                        <span>✉️</span><span>{contactEmail}</span>
                      </a>
                    )}
                    {contactPhone && (
                      <a href={`https://wa.me/${contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: "block", padding: "10px", backgroundColor: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13, borderRadius: 8, textAlign: "center", textDecoration: "none" }}>
                        {t.whatsapp}
                      </a>
                    )}
                  </div>
                );
              })()}
              {(project.pdf_url && signedPdfUrl) && (
                <div style={{ backgroundColor: bgCard, borderRadius: 12, padding: 20, border: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>PDF</div>
                  <a href={signedPdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", padding: "10px", backgroundColor: accent, color: bgPrimary, fontWeight: 700, fontSize: 13, borderRadius: 8, textAlign: "center", textDecoration: "none" }}>
                    {t.pdf}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div onClick={() => setSelectedImg(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <img src={selectedImg} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
