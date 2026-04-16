"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const ct = {
  tr: {
    savePdf: "PDF İndir",
    backToMap: "← Haritaya Dön",
    loading: "Yükleniyor...",
    generating: "PDF oluşturuluyor...",
    projects: (n: number) => `${n} Proje`,
    catalogTitle: "Proje Katalogü",
    preparedBy: "Hazırlayan Danışman",
    toc: "İçindekiler",
    projectOf: (i: number, n: number) => `Proje ${i} / ${n}`,
    amenities: "Sosyal Olanaklar",
    payment: "Ödeme Seçenekleri",
    advisor: "Danışmanınız",
    residence: "İkamet İzni",
    citizenship: "Vatandaşlık",
  },
  en: {
    savePdf: "Download PDF",
    backToMap: "← Back to Map",
    loading: "Loading...",
    generating: "Generating PDF...",
    projects: (n: number) => `${n} Project${n !== 1 ? "s" : ""}`,
    catalogTitle: "Project Catalog",
    preparedBy: "Prepared by Agent",
    toc: "Table of Contents",
    projectOf: (i: number, n: number) => `Project ${i} / ${n}`,
    amenities: "Amenities",
    payment: "Payment Options",
    advisor: "Your Agent",
    residence: "Residence Permit",
    citizenship: "Citizenship",
  },
  ru: {
    savePdf: "Скачать PDF",
    backToMap: "← Вернуться к карте",
    loading: "Загрузка...",
    generating: "Создание PDF...",
    projects: (n: number) => `${n} Проект${n > 1 ? "а" : ""}`,
    catalogTitle: "Каталог проектов",
    preparedBy: "Подготовлено агентом",
    toc: "Содержание",
    projectOf: (i: number, n: number) => `Проект ${i} / ${n}`,
    amenities: "Инфраструктура",
    payment: "Варианты оплаты",
    advisor: "Ваш агент",
    residence: "ВНЖ",
    citizenship: "Гражданство",
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

const AMENITY_TR: Record<string, { en: string; ru: string }> = {
  "Yüzme Havuzu":    { en: "Swimming Pool",       ru: "Бассейн" },
  "Fitness Merkezi": { en: "Fitness Center",       ru: "Фитнес-центр" },
  "SPA & Sauna":     { en: "SPA & Sauna",          ru: "СПА и Сауна" },
  "Hamam":           { en: "Turkish Bath",         ru: "Хамам" },
  "Kapalı Otopark":  { en: "Indoor Parking",       ru: "Подземная парковка" },
  "7/24 Güvenlik":   { en: "24/7 Security",        ru: "Охрана 24/7" },
  "Resepsiyon":      { en: "Reception",            ru: "Ресепшн" },
  "Çocuk Oyun Parkı":{ en: "Kids Playground",      ru: "Детская площадка" },
  "Restoran & Kafe": { en: "Restaurant & Cafe",    ru: "Ресторан und Cafe" },
  "Tenis Kortu":     { en: "Tennis Court",         ru: "Теннисный корт" },
  "Bahçe & Peyzaj":  { en: "Garden & Landscaping", ru: "Сад и ландшафт" },
  "Jeneratör":       { en: "Generator",            ru: "Генератор" },
  "Akıllı Ev Sistemi":{ en: "Smart Home System",   ru: "Умный дом" },
  "Deniz Manzarası": { en: "Sea View",             ru: "Вид на море" },
  "Dağ Manzarası":   { en: "Mountain View",        ru: "Вид на горы" },
  "Asansör":         { en: "Elevator",             ru: "Лифт" },
  "BBQ Alanı":       { en: "BBQ Area",             ru: "Зона барбекю" },
};

const PROJECT_TYPE_TR: Record<string, { en: string; ru: string }> = {
  "daire":     { en: "Apartment",  ru: "Квартира" },
  "villa":     { en: "Villa",      ru: "Вилла" },
  "rezidans":  { en: "Residence",  ru: "Резиденс" },
  "ofis":      { en: "Office",     ru: "Офис" },
  "townhouse": { en: "Townhouse",  ru: "Таунхаус" },
  "loft":      { en: "Loft",       ru: "Лофт" },
};

function translateAmenity(a: string, lang: string) {
  if (lang === "tr") return a;
  return AMENITY_TR[a]?.[lang as "en" | "ru"] ?? a;
}
function translateType(t: string, lang: string) {
  if (lang === "tr") return t;
  return PROJECT_TYPE_TR[t]?.[lang as "en" | "ru"] ?? t;
}

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
  const [error, setError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
        .in("id", ids).eq("status", "published"),
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
    }).catch(() => { setLoading(false); setError(true); });
  }, []); // eslint-disable-line

  const locale = lang === "ru" ? "ru-RU" : lang === "en" ? "en-GB" : "tr-TR";
  function formatPrice(n: number) { return "TL " + n.toLocaleString("tr-TR"); }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(locale, { month: "long", year: "numeric" });
  }

  async function downloadPDF() {
    setPdfLoading(true);
    try {
      const { pdf, Document, Page, Text, View, Image: PdfImage, StyleSheet } = await import("@react-pdf/renderer");

      const NAV = "#0F1923";
      const GOLD = "#E8B84B";
      const WHITE = "#FFFFFF";
      const MUTED = "#94A3B8";
      const CARD = "#1A2B3C";

      const s = StyleSheet.create({
        // ── COVER PAGE ──
        coverPage: { backgroundColor: NAV, padding: 0, fontFamily: "Helvetica" },
        coverBg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
        coverOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: NAV, opacity: 0.78 },
        coverTopBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "18 32", borderBottomWidth: 1, borderBottomColor: GOLD },
        coverBrand: { fontSize: 13, fontWeight: "bold", color: GOLD, letterSpacing: 2 },
        coverDate: { fontSize: 10, color: MUTED },
        coverBody: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 60, paddingTop: 80 },
        coverLogoWrap: { width: 100, height: 50, marginBottom: 20 },
        coverLogo: { width: "100%", height: "100%", objectFit: "contain" },
        coverTitle: { fontSize: 38, fontWeight: "bold", color: WHITE, textAlign: "center", letterSpacing: 1, marginBottom: 6 },
        coverSubtitle: { fontSize: 13, color: MUTED, textAlign: "center", marginBottom: 0 },
        coverDivider: { width: 60, height: 3, backgroundColor: GOLD, marginVertical: 20 },
        coverBottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0A131C", borderTopWidth: 2, borderTopColor: GOLD, padding: "16 32", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        coverAgentName: { fontSize: 14, fontWeight: "bold", color: WHITE, marginBottom: 2 },
        coverAgentCompany: { fontSize: 11, color: GOLD },
        coverAgentContact: { fontSize: 10, color: MUTED, textAlign: "right", marginBottom: 2 },
        // ── TOC PAGE ──
        tocPage: { backgroundColor: NAV, padding: "48 40", fontFamily: "Helvetica" },
        tocHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32, borderBottomWidth: 2, borderBottomColor: GOLD, paddingBottom: 12 },
        tocBrand: { fontSize: 11, fontWeight: "bold", color: GOLD, letterSpacing: 2 },
        tocPageNum: { fontSize: 10, color: MUTED },
        tocTitle: { fontSize: 22, fontWeight: "bold", color: WHITE, marginBottom: 24 },
        tocRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1E3048" },
        tocNum: { fontSize: 11, color: GOLD, fontWeight: "bold", width: 24 },
        tocName: { fontSize: 13, color: WHITE, flex: 1, fontWeight: "bold" },
        tocCity: { fontSize: 11, color: MUTED, flex: 1 },
        tocPrice: { fontSize: 13, color: GOLD, fontWeight: "bold" },
        // ── PROJECT PAGE ──
        projPage: { backgroundColor: NAV, padding: 0, fontFamily: "Helvetica" },
        projTopBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "10 24", backgroundColor: "#0A131C", borderBottomWidth: 1, borderBottomColor: "#1E3048" },
        projBrand: { fontSize: 9, fontWeight: "bold", color: GOLD, letterSpacing: 2 },
        projCounter: { fontSize: 9, color: MUTED },
        projHero: { width: "100%", height: 220, objectFit: "cover" },
        projHeroPlaceholder: { width: "100%", height: 220, backgroundColor: CARD },
        projTitleBar: { backgroundColor: "#0A131C", padding: "14 24", borderBottomWidth: 2, borderBottomColor: GOLD },
        projTitle: { fontSize: 22, fontWeight: "bold", color: WHITE, marginBottom: 4 },
        projLocation: { fontSize: 11, color: MUTED },
        projChipRow: { flexDirection: "row", padding: "10 24", backgroundColor: "#0D1E2E", gap: 6 },
        projChip: { flex: 1, backgroundColor: CARD, borderRadius: 5, padding: "8 10", borderTopWidth: 2, borderTopColor: GOLD },
        projChipLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
        projChipValue: { fontSize: 11, fontWeight: "bold", color: WHITE },
        projBody: { padding: "16 24", flex: 1 },
        projDesc: { fontSize: 10, color: "#B0C0D0", lineHeight: 1.7, marginBottom: 14 },
        projGallery: { flexDirection: "row", gap: 5, marginBottom: 14 },
        projGalleryImg: { flex: 1, height: 80, objectFit: "cover", borderRadius: 4 },
        projSectionLabel: { fontSize: 9, fontWeight: "bold", color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#1E3048", paddingBottom: 4 },
        projAmenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 14 },
        projAmenityItem: { backgroundColor: CARD, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 5, borderLeftWidth: 2, borderLeftColor: GOLD },
        projAmenityText: { fontSize: 9, color: WHITE },
        projPayBox: { backgroundColor: CARD, borderRadius: 5, padding: 10, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: GOLD },
        projPayLine: { fontSize: 10, color: "#B0C0D0", lineHeight: 1.6 },
        projBadgeRow: { flexDirection: "row", gap: 6, marginTop: 2 },
        projBadge: { fontSize: 9, color: "#10B981", borderWidth: 1, borderColor: "#10B981", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
        projBadgeBlue: { fontSize: 9, color: "#60A5FA", borderWidth: 1, borderColor: "#60A5FA", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
        // ── FOOTER BAR (absolute bottom) ──
        projFooter: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0A131C", borderTopWidth: 1, borderTopColor: GOLD, padding: "10 24", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        projFooterName: { fontSize: 11, fontWeight: "bold", color: WHITE },
        projFooterCompany: { fontSize: 9, color: GOLD },
        projFooterContact: { fontSize: 9, color: MUTED, textAlign: "right", marginBottom: 1 },
      });

      const dateStr = new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
      const firstCover = projects[0]?.cover_image_url;

      const doc = (
        <Document title={tx.catalogTitle} author={brokerName}>

          {/* ── COVER PAGE ── */}
          <Page size="A4" style={s.coverPage}>
            {firstCover ? <PdfImage src={firstCover} style={s.coverBg} /> : null}
            <View style={s.coverOverlay} />
            <View style={s.coverTopBar}>
              <Text style={s.coverBrand}>YAPIMAP</Text>
              <Text style={s.coverDate}>{dateStr}</Text>
            </View>
            <View style={s.coverBody}>
              {brokerLogo ? (
                <View style={s.coverLogoWrap}>
                  <PdfImage src={brokerLogo} style={s.coverLogo} />
                </View>
              ) : null}
              <Text style={s.coverTitle}>{brokerCompany || brokerName}</Text>
              <View style={s.coverDivider} />
              <Text style={s.coverSubtitle}>{tx.catalogTitle} · {tx.projects(projects.length)}</Text>
              {projects.length > 1 && (
                <View style={{ marginTop: 36, width: "100%" }}>
                  {projects.map((p, i) => (
                    <View key={p.id} style={s.tocRow}>
                      <Text style={s.tocNum}>{i + 1}</Text>
                      <Text style={s.tocName}>{p.title}</Text>
                      <Text style={s.tocCity}>{p.city}</Text>
                      <Text style={s.tocPrice}>{formatPrice(p.min_price)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={s.coverBottomBar}>
              <View>
                <Text style={s.coverAgentName}>{brokerName}</Text>
                {brokerCompany ? <Text style={s.coverAgentCompany}>{brokerCompany}</Text> : null}
              </View>
              <View>
                {brokerPhone ? <Text style={s.coverAgentContact}>{brokerPhone}</Text> : null}
                {brokerEmail ? <Text style={s.coverAgentContact}>{brokerEmail}</Text> : null}
              </View>
            </View>
          </Page>

          {/* ── PROJECT PAGES ── */}
          {projects.map((p, i) => (
            <Page key={p.id} size="A4" style={s.projPage}>
              {/* Top brand bar */}
              <View style={s.projTopBar}>
                <Text style={s.projBrand}>YAPIMAP</Text>
                <Text style={s.projCounter}>{tx.projectOf(i + 1, projects.length)}</Text>
              </View>

              {/* Hero image */}
              {p.cover_image_url
                ? <PdfImage src={p.cover_image_url} style={s.projHero} />
                : <View style={s.projHeroPlaceholder} />}

              {/* Title bar */}
              <View style={s.projTitleBar}>
                <Text style={s.projTitle}>{p.title}</Text>
                <Text style={s.projLocation}>{p.district ? `${p.district}, ` : ""}{p.city}  ·  {translateType(p.project_type, lang)}{p.handover_date ? `  ·  ${formatDate(p.handover_date)}` : ""}</Text>
              </View>

              {/* Info chips */}
              <View style={s.projChipRow}>
                <View style={s.projChip}>
                  <Text style={s.projChipLabel}>{lang === "tr" ? "Fiyat" : lang === "ru" ? "Цена" : "Price"}</Text>
                  <Text style={s.projChipValue}>{formatPrice(p.min_price)}</Text>
                </View>
                <View style={s.projChip}>
                  <Text style={s.projChipLabel}>{lang === "tr" ? "Max" : "Max"}</Text>
                  <Text style={s.projChipValue}>{formatPrice(p.max_price)}</Text>
                </View>
                {p.ikamet_eligible && (
                  <View style={[s.projChip, { borderTopColor: "#10B981" }]}>
                    <Text style={s.projChipLabel}>{tx.residence}</Text>
                    <Text style={[s.projChipValue, { color: "#10B981", fontSize: 9 }]}>✓</Text>
                  </View>
                )}
                {p.citizenship_eligible && (
                  <View style={[s.projChip, { borderTopColor: "#60A5FA" }]}>
                    <Text style={s.projChipLabel}>{tx.citizenship}</Text>
                    <Text style={[s.projChipValue, { color: "#60A5FA", fontSize: 9 }]}>✓</Text>
                  </View>
                )}
              </View>

              {/* Body */}
              <View style={s.projBody}>
                {p.description ? <Text style={s.projDesc}>{p.description}</Text> : null}

                {images[p.id]?.length > 0 && (
                  <View style={s.projGallery}>
                    {images[p.id].slice(0, 4).map((url, j) => (
                      <PdfImage key={j} src={url} style={s.projGalleryImg} />
                    ))}
                  </View>
                )}

                {p.amenities && p.amenities.length > 0 && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={s.projSectionLabel}>{tx.amenities}</Text>
                    <View style={s.projAmenityGrid}>
                      {p.amenities.map((a, j) => (
                        <View key={j} style={s.projAmenityItem}>
                          <Text style={s.projAmenityText}>{translateAmenity(a, lang)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {p.payment_plan ? (
                  <View style={s.projPayBox}>
                    <Text style={[s.projSectionLabel, { marginBottom: 6 }]}>{tx.payment}</Text>
                    {p.payment_plan.split("\n").filter(Boolean).map((line, j) => (
                      <Text key={j} style={s.projPayLine}>› {line}</Text>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Footer contact bar */}
              <View style={s.projFooter}>
                <View>
                  <Text style={s.projFooterName}>{brokerName}</Text>
                  {brokerCompany ? <Text style={s.projFooterCompany}>{brokerCompany}</Text> : null}
                </View>
                <View>
                  {brokerPhone ? <Text style={s.projFooterContact}>{brokerPhone}</Text> : null}
                  {brokerEmail ? <Text style={s.projFooterContact}>{brokerEmail}</Text> : null}
                </View>
              </View>
            </Page>
          ))}
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yapimap-katalog-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "system-ui", color: "#94A3B8", backgroundColor: "#0F1923", minHeight: "100vh" }}>{tx.loading}</div>;
  if (error) return <div style={{ padding: 60, textAlign: "center", fontFamily: "system-ui", color: "#94A3B8", backgroundColor: "#0F1923", minHeight: "100vh" }}>
    Fehler beim Laden. <button onClick={() => router.push("/broker/map")} style={{ color: "#E8B84B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Zurück zur Karte</button>
  </div>;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "linear-gradient(135deg, #1a1a2e 0%, #232323 50%, #1a1a2e 100%)", color: "#F1F5F9", maxWidth: 860, margin: "0 auto", padding: "40px 40px 60px" }}>

      {/* Toolbar */}
      <div style={{ marginBottom: 32, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "16px 20px", backgroundColor: "#ffffff10", borderRadius: 10, border: "1px solid #ffffff20" }}>
        <button onClick={downloadPDF} disabled={pdfLoading}
          style={{ padding: "10px 24px", backgroundColor: pdfLoading ? "#888" : "#E8B84B", color: "#0F1923", fontWeight: 700, fontSize: 14, borderRadius: 8, border: "none", cursor: pdfLoading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          {pdfLoading ? tx.generating : `⬇ ${tx.savePdf}`}
        </button>
        <button onClick={() => router.push("/broker/map")}
          style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#94A3B8", fontSize: 14, borderRadius: 8, border: "1px solid #ffffff30", cursor: "pointer" }}>
          {tx.backToMap}
        </button>
        <span style={{ fontSize: 13, color: "#94A3B8", marginLeft: "auto" }}>
          {tx.projects(projects.length)} · {new Date().toLocaleDateString(locale)}
        </span>
      </div>

      {/* ===== COVER PAGE ===== */}
      <div style={{ textAlign: "center", padding: "70px 0 60px", borderBottom: "4px solid #E8B84B", marginBottom: 60 }}>
        {brokerLogo && (
          <img src={brokerLogo} alt="" style={{ height: 60, maxWidth: 200, objectFit: "contain", marginBottom: 24 }} />
        )}
        <h1 style={{ fontSize: 44, fontWeight: 900, color: "#F1F5F9", marginBottom: 8, letterSpacing: -1 }}>
          {tx.catalogTitle}
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 40 }}>
          {tx.projects(projects.length)} · {new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div style={{ display: "inline-block", backgroundColor: "#0F1923", borderRadius: 14, padding: "24px 36px", textAlign: "left", minWidth: 320 }}>
          <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{tx.preparedBy}</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#F1F5F9", marginBottom: 4 }}>{brokerName}</div>
          {brokerCompany && <div style={{ fontSize: 14, color: "#E8B84B", marginBottom: 8 }}>{brokerCompany}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {brokerPhone && <div style={{ fontSize: 13, color: "#94A3B8" }}>{brokerPhone}</div>}
            {brokerEmail && <div style={{ fontSize: 13, color: "#94A3B8" }}>{brokerEmail}</div>}
          </div>
        </div>
        {projects.length > 1 && (
          <div style={{ marginTop: 48, textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>{tx.toc}</div>
            {projects.map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #ffffff20", fontSize: 14 }}>
                <span style={{ color: "#F1F5F9" }}>{i + 1}. <strong>{p.title}</strong> — {p.city}</span>
                <span style={{ color: "#E8B84B", fontWeight: 700 }}>{formatPrice(p.min_price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== PROJECTS ===== */}
      {projects.map((p, i) => (
        <div key={p.id} style={{ marginTop: i === 0 ? 0 : 60, paddingTop: i === 0 ? 0 : 60, borderTop: i === 0 ? "none" : "2px solid #ffffff15" }}>
          <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
            {tx.projectOf(i + 1, projects.length)}
          </div>
          {p.cover_image_url
            ? <img src={p.cover_image_url} alt="" loading="lazy" style={{ width: "100%", height: 280, objectFit: "contain", borderRadius: 12, marginBottom: 24, display: "block", backgroundColor: "#0F1923" }} />
            : <div style={{ width: "100%", height: 200, backgroundColor: "#ffffff10", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>🏢</div>
          }
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#F1F5F9", margin: "0 0 6px" }}>{p.title}</h2>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <span style={{ color: "#94A3B8", fontSize: 14 }}>📍 {p.district ? `${p.district}, ` : ""}{p.city}</span>
            <span style={{ color: "#94A3B8", fontSize: 14 }}>🏠 {translateType(p.project_type, lang)}</span>
            {p.handover_date && <span style={{ color: "#94A3B8", fontSize: 14 }}>📅 {formatDate(p.handover_date)}</span>}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 24, padding: "16px 20px", backgroundColor: "#0F1923", borderRadius: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#E8B84B" }}>{formatPrice(p.min_price)}</span>
            <span style={{ fontSize: 20, color: "#94A3B8" }}>—</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#E8B84B" }}>{formatPrice(p.max_price)}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {p.ikamet_eligible && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, backgroundColor: "#10B98120", color: "#10B981", border: "1px solid #10B981", fontWeight: 700 }}>✓ {tx.residence}</span>}
              {p.citizenship_eligible && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, backgroundColor: "#3B82F620", color: "#3B82F6", border: "1px solid #3B82F6", fontWeight: 700 }}>✓ {tx.citizenship}</span>}
            </div>
          </div>
          {p.description && (
            <div style={{ marginBottom: 24, padding: "16px 20px", borderLeft: "4px solid #E8B84B", backgroundColor: "#ffffff12" }}>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: "#CBD5E1", margin: 0 }}>{p.description}</p>
            </div>
          )}
          {images[p.id]?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
              {images[p.id].slice(0, 6).map((url, j) => (
                <img key={j} src={url} alt="" loading="lazy" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} />
              ))}
            </div>
          )}
          {p.amenities && p.amenities.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E8B84B", marginBottom: 14, textTransform: "uppercase", letterSpacing: 3, borderBottom: "2px solid #E8B84B", paddingBottom: 6 }}>
                {tx.amenities}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {p.amenities.map((a, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#F1F5F9", padding: "8px 10px", backgroundColor: "#ffffff10", borderRadius: 8, border: "1px solid #ffffff20" }}>
                    <span>{translateAmenity(a, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          <div style={{ padding: "16px 20px", backgroundColor: "#ffffff10", borderRadius: 10, border: "1px solid #ffffff20", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{tx.advisor}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9" }}>{brokerName}</div>
              {brokerCompany && <div style={{ fontSize: 12, color: "#E8B84B" }}>{brokerCompany}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              {brokerPhone && <div style={{ fontSize: 13, color: "#CBD5E1" }}>{brokerPhone}</div>}
              {brokerEmail && <div style={{ fontSize: 13, color: "#CBD5E1" }}>{brokerEmail}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center", backgroundColor: "#0F1923", minHeight: "100vh" }}>Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
