"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PdfRenderer from "./PdfRenderer";

type Project = {
  id: string; title: string; city: string; district: string;
  project_type: string; min_price: number; max_price: number;
  description: string | null; ikamet_eligible: boolean;
  cover_image_url: string | null; pdf_url: string | null;
  amenities: string[] | null;
  contact_name: string | null; contact_phone: string | null; contact_email: string | null;
  profiles: { full_name: string; logo_url: string | null; phone: string | null } | null;
};
type Image = { project_id: string; url: string };

function CatalogContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [signedPdfs, setSignedPdfs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [brokerName, setBrokerName] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");

  useEffect(() => {
    const ids = params.get("projects")?.split(",").filter(Boolean) || [];
    if (ids.length === 0) { router.push("/broker/map"); return; }
    const supabase = createClient();
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("projects")
        .select("id, title, city, district, project_type, min_price, max_price, description, ikamet_eligible, cover_image_url, pdf_url, amenities, contact_name, contact_phone, contact_email, profiles(full_name, logo_url, phone)")
        .in("id", ids)
        .eq("status", "published"),
      supabase.from("project_images").select("project_id, url").in("project_id", ids),
    ]).then(async ([{ data: { user } }, { data: projs, error }, { data: imgs }]) => {
      if (error) console.error("Catalog error:", error.message);
      console.log("Projects loaded:", projs);
      console.log("Images loaded:", imgs);
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
        if (profile) { setBrokerName(profile.full_name); setBrokerPhone((profile as any).phone || ""); }
      }
      const ordered = ids.map(id => (projs as Project[])?.find(p => p.id === id)).filter(Boolean) as Project[];
      setProjects(ordered);
      const imgMap: Record<string, string[]> = {};
      (imgs as Image[] || []).forEach(img => {
        if (!imgMap[img.project_id]) imgMap[img.project_id] = [];
        imgMap[img.project_id].push(img.url);
      });
      setImages(imgMap);

      // Signed URLs für private PDFs generieren (1h gültig)
      const pdfProjects = (ordered).filter(p => p.pdf_url);
      if (pdfProjects.length > 0) {
        const pdfMap: Record<string, string> = {};
        await Promise.all(pdfProjects.map(async p => {
          if (!p.pdf_url) return;
          // Pfad aus der vollen URL extrahieren
          const match = p.pdf_url.match(/project-pdfs\/(.+)$/);
          if (!match) return;
          const { data, error: signErr } = await supabase.storage.from("project-pdfs").createSignedUrl(match[1], 3600);
          console.log("PDF path:", match[1], "signedUrl:", data?.signedUrl, "error:", signErr);
          if (data?.signedUrl) pdfMap[p.id] = data.signedUrl;
        }));
        setSignedPdfs(pdfMap);
      }

      setLoading(false);
    });
  }, []);

  function formatPrice(n: number) { return "₺" + n.toLocaleString("tr-TR"); }

  if (loading) return <div style={{ padding: 60, textAlign: "center", fontFamily: "Georgia, serif", color: "#666" }}>Yükleniyor...</div>;

  return (
    <div style={{ fontFamily: "Georgia, serif", backgroundColor: "#fff", color: "#1a1a1a", maxWidth: 840, margin: "0 auto", padding: "40px 40px 60px" }}>

      {/* Print Toolbar */}
      <div className="no-print" style={{ marginBottom: 32, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => window.print()}
          style={{ padding: "10px 24px", backgroundColor: "#E8B84B", color: "#0F1923", fontWeight: 700, fontSize: 14, borderRadius: 8, border: "none", cursor: "pointer" }}>
          🖨️ PDF olarak kaydet / Save as PDF
        </button>
        <button onClick={() => router.push("/broker/map")}
          style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#666", fontSize: 14, borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}>
          ← Haritaya Dön
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <input value={brokerName} onChange={e => setBrokerName(e.target.value)} placeholder="Danışman Adı"
            style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, width: 180 }} />
          <input value={brokerPhone} onChange={e => setBrokerPhone(e.target.value)} placeholder="Telefon"
            style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, width: 150 }} />
        </div>
      </div>

      {/* Kapak */}
      <div style={{ textAlign: "center", padding: "60px 0 48px", borderBottom: "3px solid #E8B84B", marginBottom: 56, pageBreakAfter: "always" }}>
        <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 5, textTransform: "uppercase", marginBottom: 20 }}>YapiMap · Premium Gayrimenkul</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F1923", marginBottom: 10, fontFamily: "Georgia, serif" }}>Proje Kataloğu</h1>
        <p style={{ color: "#666", fontSize: 16, marginBottom: 32 }}>{projects.length} Proje · {new Date().toLocaleDateString("tr-TR")}</p>
        {(brokerName || brokerPhone) && (
          <div style={{ display: "inline-block", backgroundColor: "#F8F9FA", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 28px", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Hazırlayan Danışman</div>
            {brokerName && <div style={{ fontWeight: 700, fontSize: 16, color: "#0F1923" }}>{brokerName}</div>}
            {brokerPhone && <div style={{ fontSize: 14, color: "#666", marginTop: 2 }}>📞 {brokerPhone}</div>}
          </div>
        )}
      </div>

      {/* İçindekiler */}
      {projects.length > 1 && (
        <div style={{ marginBottom: 48, pageBreakAfter: "always" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#0F1923", borderBottom: "2px solid #E8B84B", paddingBottom: 8 }}>İçindekiler</h2>
          {projects.map((p, i) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9", fontSize: 15 }}>
              <span>{i + 1}. {p.title}</span>
              <span style={{ color: "#E8B84B", fontWeight: 700 }}>{formatPrice(p.min_price)} – {formatPrice(p.max_price)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Projeler */}
      {projects.map((p, i) => (
        <div key={p.id} style={{ marginBottom: 0, pageBreakBefore: "always" }}>

          {/* Cover */}
          {p.cover_image_url
            ? <img src={p.cover_image_url} alt="" style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 10, marginBottom: 28 }} />
            : <div style={{ width: "100%", height: 180, backgroundColor: "#F8F9FA", borderRadius: 10, marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏢</div>
          }

          {/* Header: Titel + Logo */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Proje {i + 1} / {projects.length}</div>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0F1923", margin: 0 }}>{p.title}</h2>
              <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>📍 {p.district ? `${p.district}, ` : ""}{p.city} · {p.project_type}</p>
            </div>
            {p.profiles?.logo_url && (
              <img src={p.profiles.logo_url} alt="" style={{ height: 44, maxWidth: 160, objectFit: "contain", flexShrink: 0 }} />
            )}
          </div>

          {/* Fiyat + İkamet */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#E8B84B" }}>{formatPrice(p.min_price)} – {formatPrice(p.max_price)}</span>
            {p.ikamet_eligible && (
              <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, backgroundColor: "#10B98120", color: "#10B981", border: "1px solid #10B981", fontWeight: 600 }}>✓ İkamet İzni Uygun</span>
            )}
          </div>

          {/* Açıklama */}
          {p.description && (
            <p style={{ fontSize: 14, lineHeight: 1.9, color: "#444", marginBottom: 24, borderLeft: "3px solid #E8B84B", paddingLeft: 16 }}>{p.description}</p>
          )}

          {/* Galeri */}
          {images[p.id]?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
              {images[p.id].slice(0, 6).map((url, j) => (
                <img key={j} src={url} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 7 }} />
              ))}
            </div>
          )}

          {/* Amenities */}
          {p.amenities && p.amenities.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1923", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Sosyal Olanaklar</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 0" }}>
                {p.amenities.map((a, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#444" }}>
                    <span style={{ color: "#E8B84B", fontWeight: 700 }}>✓</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kontakt + Broschüre */}
          <div style={{ display: "grid", gridTemplateColumns: p.pdf_url ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
            {(p.contact_name || p.contact_phone || p.contact_email || p.profiles?.full_name) && (
              <div style={{ backgroundColor: "#F8F9FA", borderRadius: 10, padding: "16px 20px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>İletişim</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0F1923", marginBottom: 6 }}>{p.contact_name || p.profiles?.full_name}</div>
                {(p.contact_phone || p.profiles?.phone) && <div style={{ fontSize: 13, color: "#444", marginBottom: 3 }}>📞 {p.contact_phone || p.profiles?.phone}</div>}
                {p.contact_email && <div style={{ fontSize: 13, color: "#444" }}>✉️ {p.contact_email}</div>}
                {(brokerName || brokerPhone) && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 1, marginBottom: 4 }}>DANIŞMANINIZ</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0F1923" }}>{brokerName}</div>
                    {brokerPhone && <div style={{ fontSize: 12, color: "#666" }}>📞 {brokerPhone}</div>}
                  </div>
                )}
              </div>
            )}
            {(p.pdf_url && signedPdfs[p.id]) && (
              <div style={{ backgroundColor: "#0F1923", borderRadius: 10, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase" }}>Developer Broşürü</div>
                <a href={signedPdfs[p.id]} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", padding: "6px 14px", backgroundColor: "#E8B84B", color: "#0F1923", fontWeight: 700, fontSize: 12, borderRadius: 6, textDecoration: "none", textAlign: "center", marginBottom: 4 }}>
                  📄 Broşürü İndir / Download
                </a>
              </div>
            )}
          </div>

          {/* Broschüre inline — alle Seiten als Bild */}
          {(p.pdf_url && signedPdfs[p.id]) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontFamily: "system-ui" }}>Developer Broşürü — Tam İçerik</div>
              <PdfRenderer url={signedPdfs[p.id]} />
            </div>
          )}

          {/* Divider */}
          {i < projects.length - 1 && <div style={{ borderBottom: "2px solid #E8B84B", marginBottom: 0 }} />}
        </div>
      ))}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
        <p style={{ fontSize: 11, color: "#94A3B8" }}>Bu katalog YapiMap tarafından oluşturulmuştur · yapimap.com · {new Date().toLocaleDateString("tr-TR")}</p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          canvas { max-width: 100%; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Yükleniyor...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
