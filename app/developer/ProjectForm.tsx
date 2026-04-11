"use client";
import { useState, useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const PROJECT_TYPES = ["daire", "villa", "rezidans", "ofis", "townhouse", "loft", "karma"];

const AMENITIES = [
  "Yüzme Havuzu", "Fitness Merkezi", "SPA & Sauna", "Hamam",
  "Kapalı Otopark", "7/24 Güvenlik", "Resepsiyon",
  "Çocuk Oyun Parkı", "Restoran & Kafe", "Tenis Kortu",
  "Bahçe & Peyzaj", "Jeneratör", "Akıllı Ev Sistemi",
  "Deniz Manzarası", "Dağ Manzarası", "Asansör", "BBQ Alanı",
];

type Props = {
  profile: { id: string; full_name: string };
  project: any | null;
  onSave: () => void;
  onCancel: () => void;
  lang: string;
};

export default function ProjectForm({ profile, project, onSave, onCancel, lang }: Props) {
  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    city: project?.city || "",
    district: project?.district || "",
    address: project?.address || "",
    project_type: project?.project_type || "daire",
    min_price: project?.min_price?.toString() || "",
    max_price: project?.max_price?.toString() || "",
    min_sqm: project?.min_sqm?.toString() || "",
    max_sqm: project?.max_sqm?.toString() || "",
    delivery_date: project?.delivery_date || "",
    ikamet_eligible: project?.ikamet_eligible || false,
    amenities: (project?.amenities as string[]) || [],
    contact_name: project?.contact_name || "",
    contact_phone: project?.contact_phone || "",
    contact_email: project?.contact_email || "",
  });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    project?.lat ? { lat: project.lat, lng: project.lng } : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(project?.cover_image_url || "");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState<string>(project?.pdf_url || "");
  const mapRef = useRef<MapRef>(null);

  function set(key: string, value: any) { setForm(f => ({ ...f, [key]: value })); }

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImageFiles(f => [...f, ...files]);
    setImagePreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  }

  function removeImage(idx: number) {
    setImageFiles(f => f.filter((_, i) => i !== idx));
    setImagePreviews(p => p.filter((_, i) => i !== idx));
  }

  async function uploadFile(bucket: string, file: File, path: string): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function geocodeAndFly(query: string, zoom: number) {
    if (!query || query.length < 2) return;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query + " Turkey")}.json?access_token=${MAPBOX_TOKEN}&country=TR&limit=1&language=tr`);
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 });
      }
    } catch {}
  }

  function handleCityChange(value: string) { set("city", value); if (value.length >= 3) geocodeAndFly(value, 10); }
  function handleDistrictChange(value: string) { set("district", value); const q = value.length >= 3 ? `${value} ${form.city}` : form.city; if (q.length >= 3) geocodeAndFly(q, value.length >= 3 ? 13 : 10); }
  function handleAddressChange(value: string) { set("address", value); if (value.length >= 5) geocodeAndFly(`${value} ${form.district} ${form.city}`.trim(), 16); }

  const t = {
    tr: {
      title: project ? "Projeyi Düzenle" : "Yeni Proje Ekle",
      save: "Kaydet", cancel: "İptal",
      fields: {
        title: "Proje Adı", description: "Açıklama", city: "Şehir", district: "İlçe",
        address: "Adres", type: "Proje Tipi", minPrice: "Min Fiyat (₺)", maxPrice: "Max Fiyat (₺)",
        minSqm: "Min m²", maxSqm: "Max m²", delivery: "Teslim Tarihi",
        ikamet: "İkamet İzni Uygun", mapHint: "Haritaya tıklayarak konum belirleyin",
        pinSet: "Konum belirlendi", pinMissing: "Lütfen haritada konum belirleyin",
        amenities: "Sosyal Olanaklar", contact: "Proje İletişim Bilgileri",
        contactName: "Yetkili Adı", contactPhone: "Telefon", contactEmail: "E-posta",
      },
    },
    en: {
      title: project ? "Edit Project" : "Add New Project",
      save: "Save", cancel: "Cancel",
      fields: {
        title: "Project Name", description: "Description", city: "City", district: "District",
        address: "Address", type: "Project Type", minPrice: "Min Price (₺)", maxPrice: "Max Price (₺)",
        minSqm: "Min m²", maxSqm: "Max m²", delivery: "Delivery Date",
        ikamet: "Residence Permit Eligible", mapHint: "Click on the map to set location",
        pinSet: "Location set", pinMissing: "Please set a location on the map",
        amenities: "Amenities", contact: "Project Contact",
        contactName: "Contact Name", contactPhone: "Phone", contactEmail: "Email",
      },
    },
  }[lang];

  const inputStyle = {
    width: "100%", padding: "10px 14px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 8, color: "#F1F5F9",
    fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };

  async function handleSave() {
    if (!form.title || !form.city || !form.project_type) { setError(lang === "tr" ? "Zorunlu alanları doldurun." : "Fill in required fields."); return; }
    if (!pin) { setError(t.fields.pinMissing); return; }
    setLoading(true); setError("");
    const supabase = createClient();
    const timestamp = Date.now();

    let coverUrl = project?.cover_image_url || null;
    if (coverFile) coverUrl = await uploadFile("project-images", coverFile, `${profile.id}/${timestamp}_cover`);

    let pdfUrl = existingPdf || null;
    if (pdfFile) pdfUrl = await uploadFile("project-pdfs", pdfFile, `${profile.id}/${timestamp}_brochure.pdf`);

    const payload = {
      developer_id: profile.id,
      title: form.title, description: form.description || null,
      city: form.city, district: form.district || null, address: form.address || null,
      project_type: form.project_type,
      min_price: form.min_price ? parseInt(form.min_price) : null,
      max_price: form.max_price ? parseInt(form.max_price) : null,
      min_sqm: form.min_sqm ? parseInt(form.min_sqm) : null,
      max_sqm: form.max_sqm ? parseInt(form.max_sqm) : null,
      delivery_date: form.delivery_date || null,
      ikamet_eligible: form.ikamet_eligible,
      amenities: form.amenities,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      lat: pin.lat, lng: pin.lng,
      cover_image_url: coverUrl,
      pdf_url: pdfUrl,
    };

    let err; let projectId = project?.id;
    if (project) {
      ({ error: err } = await supabase.from("projects").update(payload).eq("id", project.id));
    } else {
      const { data: newProject, error: insertErr } = await supabase.from("projects").insert(payload).select("id").single();
      err = insertErr; projectId = newProject?.id;
    }
    if (err) { setError(err.message); setLoading(false); return; }

    if (projectId && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadFile("project-images", imageFiles[i], `${profile.id}/${timestamp}_img_${i}`);
        if (url) await supabase.from("project_images").insert({ project_id: projectId, url: url, sort_order: i });
      }
    }
    onSave();
  }

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: accent, fontSize: 20, fontWeight: 800 }}>YapiMap</span>
        <button onClick={onCancel} style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>{t.cancel}</button>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Linke Spalte */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{t.title}</h1>

          {/* Basis */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.title} *</label>
              <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.city} *</label>
                <input style={inputStyle} value={form.city} onChange={e => handleCityChange(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.district}</label>
                <input style={inputStyle} value={form.district} onChange={e => handleDistrictChange(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.address}</label>
              <input style={inputStyle} value={form.address} onChange={e => handleAddressChange(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.type} *</label>
              <select style={{ ...inputStyle }} value={form.project_type} onChange={e => set("project_type", e.target.value)}>
                {PROJECT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.description}</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>

          {/* Preise & Fläche */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.minPrice}</label>
                <input style={inputStyle} type="number" value={form.min_price} onChange={e => set("min_price", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.maxPrice}</label>
                <input style={inputStyle} type="number" value={form.max_price} onChange={e => set("max_price", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.minSqm}</label>
                <input style={inputStyle} type="number" value={form.min_sqm} onChange={e => set("min_sqm", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.maxSqm}</label>
                <input style={inputStyle} type="number" value={form.max_sqm} onChange={e => set("max_sqm", e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.delivery}</label>
              <input style={inputStyle} type="date" value={form.delivery_date} onChange={e => set("delivery_date", e.target.value)} />
            </div>
          </div>

          {/* İkamet */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div onClick={() => set("ikamet_eligible", !form.ikamet_eligible)}
                style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.ikamet_eligible ? accent : borderColor, position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: form.ikamet_eligible ? 23 : 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: form.ikamet_eligible ? "#0F1923" : textMuted, transition: "left 0.2s" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: form.ikamet_eligible ? accent : "#F1F5F9" }}>{t.fields.ikamet}</div>
                <div style={{ fontSize: 12, color: textMuted }}>{lang === "tr" ? "Bu proje ikamet iznine uygun mu?" : "Is this project eligible for residence permit?"}</div>
              </div>
            </label>
          </div>

          {/* Amenities */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 14, color: accent }}>{t.fields.amenities}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {AMENITIES.map(a => (
                <label key={a} onClick={() => toggleAmenity(a)}
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, backgroundColor: form.amenities.includes(a) ? `${accent}18` : "transparent", border: `1px solid ${form.amenities.includes(a) ? accent : borderColor}`, transition: "all 0.15s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${form.amenities.includes(a) ? accent : borderColor}`, backgroundColor: form.amenities.includes(a) ? accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form.amenities.includes(a) && <span style={{ color: "#0F1923", fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: form.amenities.includes(a) ? "#F1F5F9" : textMuted }}>{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Kontakt */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 14, color: accent }}>{t.fields.contact}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.contactName}</label>
                <input style={inputStyle} value={form.contact_name} onChange={e => set("contact_name", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.contactPhone}</label>
                  <input style={inputStyle} value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} placeholder="+90 5xx xxx xx xx" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.contactEmail}</label>
                  <input style={inputStyle} type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Cover */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 12 }}>{lang === "tr" ? "Kapak Fotoğrafı" : "Cover Image"}</label>
            {coverPreview && <img src={coverPreview} alt="cover" style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 8, marginBottom: 10, backgroundColor: "#0F1923" }} />}
            <label style={{ display: "block", padding: "9px 14px", backgroundColor: bgPrimary, border: `1px dashed ${borderColor}`, borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 13, color: textMuted }}>
              {lang === "tr" ? "Fotoğraf Seç" : "Choose Photo"}
              <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
            </label>
          </div>

          {/* Galeri */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 12 }}>{lang === "tr" ? "Galeri Fotoğrafları" : "Gallery Images"}</label>
            {imagePreviews.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6 }} />
                    <button onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, backgroundColor: "#EF4444", color: "#fff", borderRadius: "50%", border: "none", fontSize: 10, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: "block", padding: "9px 14px", backgroundColor: bgPrimary, border: `1px dashed ${borderColor}`, borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 13, color: textMuted }}>
              {lang === "tr" ? "Fotoğraf Ekle (Çoklu)" : "Add Photos (Multiple)"}
              <input type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: "none" }} />
            </label>
          </div>

          {/* PDF */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 12 }}>{lang === "tr" ? "Broşür (PDF)" : "Brochure (PDF)"}</label>
            {(existingPdf || pdfFile) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 12px", backgroundColor: bgPrimary, borderRadius: 7 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ fontSize: 13, color: "#F1F5F9", flex: 1 }}>{pdfFile?.name || "Mevcut PDF"}</span>
                {existingPdf && <a href={existingPdf} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: accent }}>Görüntüle</a>}
              </div>
            )}
            <label style={{ display: "block", padding: "9px 14px", backgroundColor: bgPrimary, border: `1px dashed ${borderColor}`, borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 13, color: textMuted }}>
              {lang === "tr" ? "PDF Seç" : "Choose PDF"}
              <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
            </label>
          </div>

          {error && (
            <div style={{ backgroundColor: "#EF444420", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#EF4444" }}>{error}</div>
          )}

          <button onClick={handleSave} disabled={loading}
            style={{ width: "100%", padding: "14px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 16, borderRadius: 10, border: "none", cursor: "pointer" }}>
            {loading ? "..." : t.save}
          </button>
        </div>

        {/* Rechte Spalte: Karte */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{lang === "tr" ? "Proje Konumu" : "Project Location"}</h2>
          <p style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>{t.fields.mapHint}</p>
          {pin && (
            <div style={{ backgroundColor: "#10B98120", border: "1px solid #10B981", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#10B981" }}>
              ✓ {t.fields.pinSet}: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            </div>
          )}
          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${borderColor}`, height: 500, position: "sticky", top: 20 }}>
            <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ longitude: pin?.lng || 35.2433, latitude: pin?.lat || 38.9637, zoom: pin ? 12 : 5.5 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              cursor="crosshair"
              onClick={e => setPin({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
            >
              <NavigationControl position="bottom-right" />
              {pin && (
                <Marker longitude={pin.lng} latitude={pin.lat} anchor="bottom">
                  <div style={{ backgroundColor: accent, color: "#0F1923", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>📍</div>
                </Marker>
              )}
            </Map>
          </div>
        </div>
      </div>
    </div>
  );
}
