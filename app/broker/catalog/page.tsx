"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const ct = {
  tr: {
    savePdf: "🖨️ PDF Olarak Kaydet",
    backToMap: "← Haritaya Dön",
    loading: "Yükleniyor...",
    projects: (n: number) => `${n} Proje`,
    subtitle: "YapıMap · Premium Gayrimenkul",
    catalogTitle: "Proje Kataloğu",
    preparedBy: "Hazırlayan Danışman",
    toc: "İçindekiler",
    projectOf: (i: number, n: number) => `Proje ${i} / ${n}`,
    amenities: "Sosyal Olanaklar",
    payment: "Ödeme Seçenekleri",
    advisor: "Danışmanınız",
    footer: (date: string) => `Bu katalog YapıMap tarafından oluşturulmuştur · yapimap.com · ${date}`,
    residence: "✓ İkamet İzni",
    citizenship: "✓ Vatandaşlık",
  },
  en: {
    savePdf: "🖨️ Save as PDF",
    backToMap: "← Back to Map",
    loading: "Loading...",
    projects: (n: number) => `${n} Project${n !== 1 ? "s" : ""}`,
    subtitle: "YapıMap · Premium Real Estate",
    catalogTitle: "Project Catalog",
    preparedBy: "Prepared by Agent",
    toc: "Table of Contents",
    projectOf: (i: number, n: number) => `Project ${i} / ${n}`,
    amenities: "Amenities",
    payment: "Payment Options",
    advisor: "Your Agent",
    footer: (date: string) => `This catalog was created by YapıMap · yapimap.com · ${date}`,
    residence: "✓ Residence Permit",
    citizenship: "✓ Citizenship",
  },
  ru: {
    savePdf: "🖨️ Сохранить как PDF",
    backToMap: "← Вернуться к карте",
    loading: "Загрузка...",
    projects: (n: number) => `${n} Проект${n > 1 ? "а" : ""}`,
    subtitle: "YapıMap · Премиум Недвижимость",
    catalogTitle: "Каталог проектов",
    preparedBy: "Подготовлено агентом",
    toc: "Содержание",
    projectOf: (i: number, n: number) => `Проект ${i} / ${n}`,
    amenities: "Инфраструктура",
    payment: "Варианты оплаты",
    advisor: "Ваш агент",
    footer: (date: string) => `Каталог создан YapıMap · yapimap.com · ${date}`,
    residence: "✓ ВНЖ",
    citizenship: "✓ Гражданство",
  },
};

type Project = {
  id: string; title: string; city: string; district: string;
  project_type: string; min_price: number; max_price: number;
  description: string | null; ikamet_eligible: boolean;
  citizenship_eligible: boolean | null;
  cover_image_url: string | null;
  amenities: string[] | null;
  payment_plan: string | null;
  handover_date: string | null;
};
type Image = { project_id: string; url: string };

const AMENITY_ICONS: Record<string, string> = {
  "Yüzme Havuzu": "🏊", "Swimming Pool": "🏊",
  "Fitness Merkezi": "💪", "Fitness Center": "💪",
  "SPA & Sauna": "🧖",
  "Hamam": "♨️", "Turkish Bath": "♨️",
  "Kapalı Otopark": "🅿️", "Indoor Parking": "🅿️",
  "7/24 Güvenlik": "🔒", "24/7 Security": "🔒",
  "Resepsiyon": "🛎️", "Reception": "🛎️",
  "Çocuk Oyun Parkı": "🎠", "Kids Playground": "🎠",
  "Restoran & Kafe": "☕", "Restaurant & Cafe": "☕",
  "Tenis Kortu": "🎾", "Tennis Court": "🎾",
  "Bahçe & Peyzaj": "🌿", "Garden & Landscaping": "🌿",
  "Jeneratör": "⚡", "Generator": "⚡",
  "Akıllı Ev Sistemi": "🏠", "Smart Home System": "🏠",
  "Deniz Manzarası": "🌊", "Sea View": "🌊",
  "Dağ Manzarası": "⛰️", "Mountain View": "⛰️",
  "Asansör": "🛗", "Elevator": "🛗",
  "BBQ Alanı": "🔥", "BBQ Area": "🔥",
};

function CatalogContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { lang: ctxLang } = useLang();
  const urlLang = params.get("lang") as keyof typeof ct | null;
  const lang = (urlLang && ct[urlLang]) ? urlLang : ctxLang;
  const tx = ct[lang] ?? ct.en;
  const [projects, setProjects] = useState<Project[]>([]);
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [brokerName, setBrokerName] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");
  const [brokerCompany, setBrokerCompany] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerLogo, setBrokerLogo] = useState("");

  useEffect(() => {
    const ids = params.get("projects")?.split(",").filter(Boolean) || [];
    if (ids.length === 0) { router.push("/broker/map"); return; }
    const supabase = createClient();
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("projects")
        .select("id, title, city, district, project_type, min_price, max_price, description, ikamet_eligible, citizenship_eligible, cover_image_url, amenities, payment_plan, handover_date")
        .in("id", ids)
        .eq("status", "published"),
      supabase.from("project_images").select("project_id, url").in("project_id", ids),
    ]).then(async ([{ data: { user } }, { data: projs }, { data: imgs }]) => {
      if (user) {
        const { data: profile } = await supabase.from("profiles")
          .select("full_name, phone, company_name, email, logo_url")
          .eq("id", user.id).single();
        if (profile) {
          setBrokerName(profile.full_name || "");
          setBrokerPhone((profile as any).phone || "");
          setBrokerCompany((profile as any).company_name || "");
          setBrokerEmail((profile as any).email || "");
          setBrokerLogo((profile as any).logo_url || "");
        }
      }
      const ordered = ids.map(id => (projs as Project[])?.find(p => p.id === id)).filter(Boolean) as Project[];
      setProjects(ordered);
      const imgMap: Record<string, string[]> = {};
      (imgs as Image[] || []).forEach(img => {
        if (!imgMap[img.project_id]) imgMap[img.project_id] = [];
        imgMap[img.project_id].push(img.url);
      });
      setImages(imgMap);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  function formatPrice(n: number) { return "₺" + n.toLocaleString("tr-TR"); }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  }

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Georgia, serif", color: "#666" }}>{tx.loading}</div>;

  return (
    <div style={{ fontFamily: "'Georgia', serif", backgroundColor: "#fff", color: "#1a1a1a", maxWidth: 860, margin: "0 auto", padding: "40px 40px 60px" }}>

      {/* Print Toolbar */}
      <div className="no-print" style={{ marginBottom: 32, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "16px 20px", backgroundColor: "#F8F9FA", borderRadius: 10, border: "1px solid #E2E8F0" }}>
        <button onClick={() => window.print()}
          style={{ padding: "10px 24px", backgroundColor: "#E8B84B", color: "#0F1923", fontWeight: 700, fontSize: 14, borderRadius: 8, border: "none", cursor: "pointer" }}>
          {tx.savePdf}
        </button>
        <button onClick={() => router.push("/broker/map")}
          style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#666", fontSize: 14, borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}>
          {tx.backToMap}
        </button>
        <span style={{ fontSize: 13, color: "#666", marginLeft: "auto" }}>
          {tx.projects(projects.length)} · {new Date().toLocaleDateString("tr-TR")}
        </span>
      </div>

      {/* ===== COVER PAGE ===== */}
      <div style={{ textAlign: "center", padding: "70px 0 60px", borderBottom: "4px solid #E8B84B", marginBottom: 60, pageBreakAfter: "always" }}>
        {/* Broker Logo */}
        {brokerLogo && (
          <img src={brokerLogo} alt="" style={{ height: 60, maxWidth: 200, objectFit: "contain", marginBottom: 24 }} />
        )}
        <h1 style={{ fontSize: 44, fontWeight: 900, color: "#0F1923", marginBottom: 8, letterSpacing: -1 }}>
          {tx.catalogTitle}
        </h1>
        <p style={{ color: "#666", fontSize: 15, marginBottom: 40 }}>
          {tx.projects(projects.length)} · {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* Broker Card */}
        <div style={{ display: "inline-block", backgroundColor: "#0F1923", borderRadius: 14, padding: "24px 36px", textAlign: "left", minWidth: 320 }}>
          <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{tx.preparedBy}</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#F1F5F9", marginBottom: 4 }}>{brokerName}</div>
          {brokerCompany && <div style={{ fontSize: 14, color: "#E8B84B", marginBottom: 8 }}>{brokerCompany}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {brokerPhone && <div style={{ fontSize: 13, color: "#94A3B8" }}>📞 {brokerPhone}</div>}
            {brokerEmail && <div style={{ fontSize: 13, color: "#94A3B8" }}>✉️ {brokerEmail}</div>}
          </div>
        </div>

        {/* TOC */}
        {projects.length > 1 && (
          <div style={{ marginTop: 48, textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>{tx.toc}</div>
            {projects.map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9", fontSize: 14 }}>
                <span style={{ color: "#0F1923" }}>{i + 1}. <strong>{p.title}</strong> — {p.city}</span>
                <span style={{ color: "#E8B84B", fontWeight: 700 }}>{formatPrice(p.min_price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== PROJECTS ===== */}
      {projects.map((p, i) => (
        <div key={p.id} style={{ pageBreakBefore: i === 0 ? "auto" : "always", paddingBottom: 40 }}>

          {/* Project Counter */}
          <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
            {tx.projectOf(i + 1, projects.length)}
          </div>

          {/* Cover Image */}
          {p.cover_image_url
            ? <img src={p.cover_image_url} alt="" style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 12, marginBottom: 24, display: "block" }} />
            : <div style={{ width: "100%", height: 200, backgroundColor: "#F8F9FA", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, border: "1px solid #E2E8F0" }}>🏢</div>
          }

          {/* Title + Location */}
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F1923", margin: "0 0 6px" }}>{p.title}</h2>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <span style={{ color: "#666", fontSize: 14 }}>📍 {p.district ? `${p.district}, ` : ""}{p.city}</span>
            <span style={{ color: "#666", fontSize: 14 }}>🏠 {p.project_type}</span>
            {p.handover_date && (
              <span style={{ color: "#666", fontSize: 14 }}>📅 {formatDate(p.handover_date)}</span>
            )}
          </div>

          {/* Price + Badges */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 24, padding: "16px 20px", backgroundColor: "#0F1923", borderRadius: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#E8B84B" }}>{formatPrice(p.min_price)}</span>
            <span style={{ fontSize: 20, color: "#94A3B8" }}>—</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#E8B84B" }}>{formatPrice(p.max_price)}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {p.ikamet_eligible && (
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, backgroundColor: "#10B98120", color: "#10B981", border: "1px solid #10B981", fontWeight: 700 }}>{tx.residence}</span>
              )}
              {p.citizenship_eligible && (
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, backgroundColor: "#3B82F620", color: "#3B82F6", border: "1px solid #3B82F6", fontWeight: 700 }}>{tx.citizenship}</span>
              )}
            </div>
          </div>

          {/* Description */}
          {p.description && (
            <div style={{ marginBottom: 24, padding: "16px 20px", borderLeft: "4px solid #E8B84B", backgroundColor: "#FFFBF0" }}>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: "#444", margin: 0 }}>{p.description}</p>
            </div>
          )}

          {/* Gallery */}
          {images[p.id]?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
              {images[p.id].slice(0, 6).map((url, j) => (
                <img key={j} src={url} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} />
              ))}
            </div>
          )}

          {/* Amenities with Icons */}
          {p.amenities && p.amenities.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1923", marginBottom: 14, textTransform: "uppercase", letterSpacing: 3, borderBottom: "2px solid #E8B84B", paddingBottom: 6 }}>
                {tx.amenities}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {p.amenities.map((a, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#333", padding: "8px 10px", backgroundColor: "#F8F9FA", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 16 }}>{AMENITY_ICONS[a] || "✓"}</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Plan */}
          {p.payment_plan && (
            <div style={{ marginBottom: 24, padding: "16px 20px", backgroundColor: "#0F1923", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{tx.payment}</div>
              {p.payment_plan.split("\n").filter(Boolean).map((line, j) => (
                <div key={j} style={{ fontSize: 13, color: "#F1F5F9", lineHeight: 1.8, display: "flex", gap: 8 }}>
                  <span style={{ color: "#E8B84B" }}>›</span> {line}
                </div>
              ))}
            </div>
          )}

          {/* Broker Contact at bottom of each project */}
          <div style={{ marginTop: 24, padding: "16px 20px", backgroundColor: "#F8F9FA", borderRadius: 10, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{tx.advisor}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0F1923" }}>{brokerName}</div>
              {brokerCompany && <div style={{ fontSize: 12, color: "#E8B84B" }}>{brokerCompany}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              {brokerPhone && <div style={{ fontSize: 13, color: "#444" }}>📞 {brokerPhone}</div>}
              {brokerEmail && <div style={{ fontSize: 13, color: "#444" }}>✉️ {brokerEmail}</div>}
            </div>
          </div>

        </div>
      ))}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 48, paddingTop: 24, borderTop: "2px solid #E8B84B" }}>
        <p style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 2 }}>
          {tx.footer(new Date().toLocaleDateString("tr-TR"))}
        </p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
