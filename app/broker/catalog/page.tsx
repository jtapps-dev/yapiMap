"use client";
import { useEffect, useState, useRef, Suspense } from "react";
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

const AMENITY_ICONS: Record<string, string> = {
  "Yüzme Havuzu": "🏊", "Fitness Merkezi": "💪", "SPA & Sauna": "🧖",
  "Hamam": "♨️", "Kapalı Otopark": "🅿️", "7/24 Güvenlik": "🔒",
  "Resepsiyon": "🛎️", "Çocuk Oyun Parkı": "🎠", "Restoran & Kafe": "☕",
  "Tenis Kortu": "🎾", "Bahçe & Peyzaj": "🌿", "Jeneratör": "⚡",
  "Akıllı Ev Sistemi": "🏠", "Deniz Manzarası": "🌊", "Dağ Manzarası": "⛰️",
  "Asansör": "🛗", "BBQ Alanı": "🔥",
};

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
  const [iosPdfUrl, setIosPdfUrl] = useState<string | null>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const [brokerName, setBrokerName] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");
  const [brokerCompany, setBrokerCompany] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerLogo, setBrokerLogo] = useState("");

  useEffect(() => {
    const ids = params.get("projects")?.split(",").filter(Boolean) || [];
    if (ids.length === 0) { router.push("/broker/map"); return; }
    const supabase = createClient();
    (async () => {
    // getSession() reads from local storage — never fails even if network is down
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email || "";

    Promise.all([
      supabase.from("projects")
        .select("id, title, city, district, project_type, min_price, max_price, description, ikamet_eligible, citizenship_eligible, cover_image_url, amenities, payment_plan, handover_date")
        .in("id", ids).eq("status", "published"),
      supabase.from("project_images").select("project_id, url").in("project_id", ids),
      userId
        ? supabase.from("profiles").select("full_name, phone, company_name, logo_url").eq("id", userId).single()
        : Promise.resolve({ data: null }),
    ]).then(async ([{ data: projs }, { data: imgs }, { data: profile }]) => {
      setBrokerEmail(userEmail);
      if (profile) {
        setBrokerName((profile as any).full_name || "");
        setBrokerPhone((profile as any).phone || "");
        setBrokerCompany((profile as any).company_name || "");
        setBrokerLogo((profile as any).logo_url || "");
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
    })();
  }, []); // eslint-disable-line

  const locale = lang === "ru" ? "ru-RU" : lang === "en" ? "en-GB" : "tr-TR";
  function formatPrice(n: number) { return "TL " + n.toLocaleString("tr-TR"); }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(locale, { month: "long", year: "numeric" });
  }

  async function downloadPDF() {
    if (!catalogRef.current) return;
    setPdfLoading(true);

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const filename = `yapimap-katalog-${new Date().toISOString().split("T")[0]}.pdf`;

    // ── Chrome / Firefox / Android: pixel-perfect html2canvas screenshot ──
    if (!isSafari) {
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);
        const el = catalogRef.current!;
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 150));
        const canvas = await html2canvas(el, {
          scale: 2, useCORS: true, allowTaint: true,
          backgroundColor: "#0F1923", logging: false,
          windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const pxW = canvas.width / 2, pxH = canvas.height / 2;
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [pxW, pxH] });
        pdf.addImage(imgData, "JPEG", 0, 0, pxW, pxH);
        if (isIOS) {
          setIosPdfUrl(URL.createObjectURL(pdf.output("blob")));
        } else {
          pdf.save(filename);
        }
      } catch (e) { console.error("PDF error:", e); }
      finally { setPdfLoading(false); }
      return;
    }

    // ── Safari / iOS: jsPDF direct (no canvas CORS issues) ──
    try {
      const { default: jsPDF } = await import("jspdf");

      // Turkish chars not in Latin-1 → readable fallback
      const san = (t: string) => (t || "")
        .replace(/ı/g, "i").replace(/İ/g, "I")
        .replace(/ğ/g, "g").replace(/Ğ/g, "G")
        .replace(/ş/g, "s").replace(/Ş/g, "S");

      async function fetchImg(url: string): Promise<string> {
        if (!url || url.startsWith("data:")) return url;
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`, { signal: ctrl.signal });
          clearTimeout(t);
          const blob = await res.blob();
          return await new Promise<string>(r => {
            const fr = new FileReader();
            fr.onloadend = () => r(fr.result as string);
            fr.readAsDataURL(blob);
          });
        } catch { return ""; }
      }

      const logoData = await fetchImg(brokerLogo);
      const coverDatas = await Promise.all(projects.map(p => fetchImg(p.cover_image_url || "")));
      const galleryDatas = await Promise.all(
        projects.map(p => Promise.all((images[p.id] || []).slice(0, 6).map(fetchImg)))
      );

      const W = 210, H = 297, M = 15, CW = W - M * 2;
      const BG:   [number,number,number] = [15, 25, 35];
      const DARK: [number,number,number] = [10, 18, 25];
      const CARD: [number,number,number] = [30, 45, 61];
      const GOLD: [number,number,number] = [232, 184, 75];
      const WHITE:[number,number,number] = [241, 245, 249];
      const MUTED:[number,number,number] = [148, 163, 184];
      const GREEN:[number,number,number] = [16, 185, 129];
      const BLUE: [number,number,number] = [59, 130, 246];
      const BORD: [number,number,number] = [42, 63, 85];

      const pdf = new jsPDF({ unit: "mm", format: "a4" });

      const fillPage = () => { pdf.setFillColor(...BG); pdf.rect(0, 0, W, H, "F"); };

      const setT = (size: number, col: [number,number,number], bold = false) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(...col);
      };

      const safeImg = (data: string, x: number, y: number, w: number, h: number) => {
        if (!data) return;
        const fmt = data.startsWith("data:image/png") ? "PNG" : "JPEG";
        try { pdf.addImage(data, fmt, x, y, w, h, undefined, "FAST"); } catch {}
      };

      const hline = (y: number, col: [number,number,number] = BORD, lw = 0.25) => {
        pdf.setDrawColor(...col); pdf.setLineWidth(lw); pdf.line(M, y, W - M, y);
      };

      // ===== COVER PAGE =====
      fillPage();
      let y = M + 8;

      if (logoData) { safeImg(logoData, W / 2 - 22, y, 44, 18); y += 24; }

      setT(24, GOLD, true);
      pdf.text(san(tx.catalogTitle), W / 2, y, { align: "center" });
      y += 9;
      setT(9, MUTED);
      pdf.text(san(`${tx.projects(projects.length)}  ·  ${new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}`), W / 2, y, { align: "center" });
      y += 8;
      pdf.setDrawColor(...GOLD); pdf.setLineWidth(0.7); pdf.line(M, y, W - M, y);
      y += 10;

      // Broker card
      pdf.setFillColor(...CARD); pdf.rect(M, y, CW, 38, "F");
      setT(7, MUTED); pdf.text(san(tx.preparedBy.toUpperCase()), M + 6, y + 7);
      setT(14, WHITE, true); pdf.text(san(brokerName || "—"), M + 6, y + 15);
      if (brokerCompany) { setT(10, GOLD); pdf.text(san(brokerCompany), M + 6, y + 22); }
      const cY = brokerCompany ? y + 29 : y + 23;
      setT(9, MUTED);
      if (brokerPhone) pdf.text(`Tel: ${brokerPhone}`, M + 6, cY);
      if (brokerEmail) pdf.text(`E-Mail: ${brokerEmail}`, M + 6, cY + (brokerPhone ? 6 : 0));
      y += 46;

      // TOC
      if (projects.length > 1) {
        setT(8, GOLD, true); pdf.text(san(tx.toc.toUpperCase()), M, y); y += 5;
        hline(y); y += 5;
        projects.forEach((p, i) => {
          setT(10, WHITE, true); pdf.text(`${i + 1}.  ${san(p.title)}`, M, y);
          setT(10, MUTED); pdf.text(san(p.city), W - M, y, { align: "right" });
          y += 5; hline(y); y += 4;
        });
      }

      // ===== PROJECT PAGES =====
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        pdf.addPage(); fillPage();
        let py = M;

        setT(7, MUTED); pdf.text(san(tx.projectOf(i + 1, projects.length).toUpperCase()), M, py + 5); py += 11;

        if (coverDatas[i]) {
          safeImg(coverDatas[i], M, py, CW, 62); py += 66;
        } else {
          pdf.setFillColor(...CARD); pdf.rect(M, py, CW, 40, "F");
          setT(10, MUTED); pdf.text("—", W / 2, py + 22, { align: "center" }); py += 44;
        }

        setT(20, WHITE, true);
        const titleLines = pdf.splitTextToSize(san(p.title), CW);
        pdf.text(titleLines, M, py); py += titleLines.length * 8 + 2;

        const locParts = [san(`${p.district ? p.district + ", " : ""}${p.city}`), san(translateType(p.project_type, lang))];
        if (p.handover_date) locParts.push(san(formatDate(p.handover_date)));
        setT(9, MUTED); pdf.text(locParts.join("   |   "), M, py); py += 8;

        // Price box
        pdf.setFillColor(...DARK); pdf.rect(M, py, CW, 14, "F");
        setT(13, GOLD, true); pdf.text(`${formatPrice(p.min_price)}  —  ${formatPrice(p.max_price)}`, M + 4, py + 9);
        let bx = W - M - 4;
        if (p.citizenship_eligible) {
          const label = san(tx.citizenship);
          setT(7, BLUE, true);
          const bw = pdf.getTextWidth(label) + 6;
          bx -= bw + 2;
          pdf.setDrawColor(...BLUE); pdf.setLineWidth(0.3); pdf.rect(bx, py + 3, bw, 8, "S");
          pdf.text(label, bx + bw / 2, py + 8.5, { align: "center" });
        }
        if (p.ikamet_eligible) {
          const label = san(tx.residence);
          setT(7, GREEN, true);
          const bw = pdf.getTextWidth(label) + 6;
          bx -= bw + 2;
          pdf.setDrawColor(...GREEN); pdf.setLineWidth(0.3); pdf.rect(bx, py + 3, bw, 8, "S");
          pdf.text(label, bx + bw / 2, py + 8.5, { align: "center" });
        }
        py += 18;

        // Description
        if (p.description && py < H - 80) {
          pdf.setFillColor(30, 45, 61);
          setT(8.5, [203, 213, 225] as [number,number,number]);
          const descLines = pdf.splitTextToSize(san(p.description.substring(0, 400)), CW - 8);
          const shown = descLines.slice(0, 6);
          const dH = shown.length * 4.5 + 6;
          pdf.rect(M + 1, py, CW - 1, dH, "F");
          pdf.setDrawColor(...GOLD); pdf.setLineWidth(0.8); pdf.line(M, py, M, py + dH);
          pdf.text(shown, M + 5, py + 5); py += dH + 4;
        }

        // Gallery
        const gal = galleryDatas[i].filter(Boolean);
        if (gal.length > 0 && py < H - 65) {
          const gw = (CW - 6) / 3, gh = 27;
          const maxRows = Math.floor((H - 65 - py) / (gh + 3));
          const maxGal = Math.min(gal.length, maxRows * 3, 6);
          for (let j = 0; j < maxGal; j++) {
            safeImg(gal[j], M + (j % 3) * (gw + 3), py + Math.floor(j / 3) * (gh + 3), gw, gh);
          }
          py += Math.ceil(maxGal / 3) * (gh + 3) + 4;
        }

        // Amenities
        if (p.amenities && p.amenities.length > 0 && py < H - 55) {
          setT(8, GOLD, true); pdf.text(san(tx.amenities.toUpperCase()), M, py);
          pdf.setDrawColor(...GOLD); pdf.setLineWidth(0.4); pdf.line(M, py + 2, W - M, py + 2);
          py += 8;
          const aw = (CW - 6) / 3;
          p.amenities.forEach((a, j) => {
            const ax = M + (j % 3) * (aw + 3), ay = py + Math.floor(j / 3) * 8;
            pdf.setFillColor(...CARD); pdf.rect(ax, ay, aw, 6.5, "F");
            setT(7, WHITE); pdf.text(san(translateAmenity(a, lang)), ax + 2, ay + 4.5);
          });
          py += Math.ceil(p.amenities.length / 3) * 8 + 4;
        }

        // Payment plan
        if (p.payment_plan && py < H - 50) {
          const pLines = p.payment_plan.split("\n").filter(Boolean);
          const pH = pLines.length * 5 + 12;
          pdf.setFillColor(...DARK); pdf.rect(M, py, CW, pH, "F");
          setT(7, MUTED); pdf.text(san(tx.payment.toUpperCase()), M + 4, py + 6);
          setT(8, WHITE); pLines.forEach((line, j) => pdf.text(`> ${san(line)}`, M + 4, py + 12 + j * 5));
          py += pH + 4;
        }

        // Advisor card — fixed at bottom
        const advY = H - M - 20;
        pdf.setFillColor(...CARD); pdf.rect(M, advY, CW, 20, "F");
        setT(7, MUTED); pdf.text(san(tx.advisor.toUpperCase()), M + 5, advY + 5);
        setT(11, WHITE, true); pdf.text(san(brokerName || "—"), M + 5, advY + 12);
        if (brokerCompany) { setT(8, GOLD); pdf.text(san(brokerCompany), M + 5, advY + 18); }
        setT(8, MUTED);
        if (brokerPhone) pdf.text(`Tel: ${brokerPhone}`, W - M - 4, advY + 12, { align: "right" });
        if (brokerEmail) pdf.text(`E-Mail: ${brokerEmail}`, W - M - 4, advY + 18, { align: "right" });
      }

      if (isIOS) {
        const blob = pdf.output("blob");
        setIosPdfUrl(URL.createObjectURL(blob));
      } else {
        pdf.save(filename);
      }
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
        {iosPdfUrl && (
          <a href={iosPdfUrl} target="_blank" rel="noopener"
            style={{ padding: "10px 24px", backgroundColor: "#10B981", color: "#fff", fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            📄 {lang === "tr" ? "PDF'i Aç" : lang === "ru" ? "Открыть PDF" : "Open PDF"}
          </a>
        )}
        <button onClick={() => router.push("/broker/map")}
          style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#94A3B8", fontSize: 14, borderRadius: 8, border: "1px solid #ffffff30", cursor: "pointer" }}>
          {tx.backToMap}
        </button>
        <span style={{ fontSize: 13, color: "#94A3B8", marginLeft: "auto" }}>
          {tx.projects(projects.length)} · {new Date().toLocaleDateString(locale)}
        </span>
      </div>

      {/* ===== CATALOG CONTENT (captured by html2canvas) ===== */}
      <div ref={catalogRef} style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #232323 50%, #1a1a2e 100%)", padding: "40px 40px 60px" }}>

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
        <div style={{ backgroundColor: "#0F1923", borderRadius: 14, padding: "24px 36px", textAlign: "left", maxWidth: 400, margin: "0 auto" }}>
          <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{tx.preparedBy}</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#F1F5F9", marginBottom: 4 }}>{brokerName || "—"}</div>
          {brokerCompany && <div style={{ fontSize: 14, color: "#E8B84B", marginBottom: 8 }}>{brokerCompany}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {brokerPhone && <div style={{ fontSize: 13, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}><span>📞</span><span>{brokerPhone}</span></div>}
            {brokerEmail && <div style={{ fontSize: 13, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}><span>✉️</span><span>{brokerEmail}</span></div>}
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
                    <span style={{ fontSize: 16 }}>{AMENITY_ICONS[a] || "✓"}</span>
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
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
              {brokerPhone && <div style={{ fontSize: 13, color: "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}><span>📞</span>{brokerPhone}</div>}
              {brokerEmail && <div style={{ fontSize: 13, color: "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}><span>✉️</span>{brokerEmail}</div>}
            </div>
          </div>
        </div>
      ))}
      </div>{/* end catalogRef */}
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
