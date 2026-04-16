"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

const PROJECT_TYPES = ["daire", "villa", "rezidans", "ofis", "townhouse", "loft"];

const AMENITIES: { tr: string; en: string; ru: string }[] = [
  { tr: "Yüzme Havuzu", en: "Swimming Pool", ru: "Бассейн" },
  { tr: "Fitness Merkezi", en: "Fitness Center", ru: "Фитнес-центр" },
  { tr: "SPA & Sauna", en: "SPA & Sauna", ru: "СПА & Сауна" },
  { tr: "Hamam", en: "Turkish Bath", ru: "Хаммам" },
  { tr: "Kapalı Otopark", en: "Indoor Parking", ru: "Крытая парковка" },
  { tr: "7/24 Güvenlik", en: "24/7 Security", ru: "Охрана 24/7" },
  { tr: "Resepsiyon", en: "Reception", ru: "Ресепшн" },
  { tr: "Çocuk Oyun Parkı", en: "Kids Playground", ru: "Детская площадка" },
  { tr: "Restoran & Kafe", en: "Restaurant & Cafe", ru: "Ресторан & Кафе" },
  { tr: "Tenis Kortu", en: "Tennis Court", ru: "Теннисный корт" },
  { tr: "Bahçe & Peyzaj", en: "Garden & Landscaping", ru: "Сад & Ландшафт" },
  { tr: "Jeneratör", en: "Generator", ru: "Генератор" },
  { tr: "Akıllı Ev Sistemi", en: "Smart Home System", ru: "Система умного дома" },
  { tr: "Deniz Manzarası", en: "Sea View", ru: "Вид на море" },
  { tr: "Dağ Manzarası", en: "Mountain View", ru: "Вид на горы" },
  { tr: "Asansör", en: "Elevator", ru: "Лифт" },
  { tr: "BBQ Alanı", en: "BBQ Area", ru: "Зона барбекю" },
];

type Props = {
  profile: { id: string; full_name: string };
  project: any | null;
  onSave: () => void;
  onCancel: () => void;
  lang: string;
};

export default function ProjectForm({ profile, project, onSave, onCancel, lang }: Props) {
  const router = useRouter();
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
    citizenship_eligible: project?.citizenship_eligible || false,
    payment_plan: project?.payment_plan || "",
    handover_date: project?.handover_date || "",
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
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<{ id: string; name: string; url: string }[]>([]);
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { alert("Sadece JPG, PNG veya WEBP / Only JPG, PNG or WEBP"); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Maksimum 10 MB / Maximum 10 MB"); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter(f => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { alert(`${f.name}: Sadece JPG/PNG/WEBP`); return false; }
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name}: Maksimum 10 MB`); return false; }
      return true;
    });
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

  const tLabels = {
    tr: {
      title: project ? "Projeyi Düzenle" : "Yeni Proje Ekle",
      save: "Kaydet", cancel: "İptal",
      fields: {
        title: "Proje Adı", description: "Açıklama", city: "Şehir", district: "İlçe",
        address: "Adres", type: "Proje Tipi", minPrice: "Min Fiyat (₺)", maxPrice: "Max Fiyat (₺)",
        minSqm: "Min m²", maxSqm: "Max m²", delivery: "Teslim Tarihi",
        ikamet: "İkamet İzni Uygun", citizenship: "Vatandaşlık Yatırımına Uygun",
        mapHint: "Haritaya tıklayarak konum belirleyin",
        pinSet: "Konum belirlendi", pinMissing: "Lütfen haritada konum belirleyin",
        amenities: "Sosyal Olanaklar", contact: "Proje İletişim Bilgileri",
        contactName: "Yetkili Adı", contactPhone: "Telefon", contactEmail: "E-posta",
        paymentPlan: "Ödeme Planı", handoverDate: "Teslim Tarihi",
        documents: "Belgeler (Maks. 5)", docsHint: "Teknik şartname, kat planı vb.",
      },
    },
    en: {
      title: project ? "Edit Project" : "Add New Project",
      save: "Save", cancel: "Cancel",
      fields: {
        title: "Project Name", description: "Description", city: "City", district: "District",
        address: "Address", type: "Project Type", minPrice: "Min Price (₺)", maxPrice: "Max Price (₺)",
        minSqm: "Min m²", maxSqm: "Max m²", delivery: "Delivery Date",
        ikamet: "Residence Permit Eligible", citizenship: "Eligible for Citizenship by Investment",
        mapHint: "Click on the map to set location",
        pinSet: "Location set", pinMissing: "Please set a location on the map",
        amenities: "Amenities", contact: "Project Contact",
        contactName: "Contact Name", contactPhone: "Phone", contactEmail: "Email",
        paymentPlan: "Payment Plan", handoverDate: "Handover Date",
        documents: "Documents (Max. 5)", docsHint: "Technical specs, floor plans, etc.",
      },
    },
    ru: {
      title: project ? "Редактировать проект" : "Добавить новый проект",
      save: "Сохранить", cancel: "Отмена",
      fields: {
        title: "Название проекта", description: "Описание", city: "Город", district: "Район",
        address: "Адрес", type: "Тип проекта", minPrice: "Мин. цена (₺)", maxPrice: "Макс. цена (₺)",
        minSqm: "Мин. м²", maxSqm: "Макс. м²", delivery: "Дата сдачи",
        ikamet: "Подходит для ВНЖ", citizenship: "Подходит для гражданства через инвестиции",
        mapHint: "Нажмите на карту, чтобы указать расположение",
        pinSet: "Расположение указано", pinMissing: "Пожалуйста, укажите расположение на карте",
        amenities: "Удобства", contact: "Контакты проекта",
        contactName: "Имя контактного лица", contactPhone: "Телефон", contactEmail: "Эл. почта",
        paymentPlan: "План оплаты", handoverDate: "Дата сдачи",
        documents: "Документы (макс. 5)", docsHint: "Техническая спецификация, поэтажные планы и т.д.",
      },
    },
  };
  const t = tLabels[lang as keyof typeof tLabels] ?? tLabels.en;

  const inputStyle = {
    width: "100%", padding: "10px 14px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 8, color: "#F1F5F9",
    fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };

  async function handleSave() {
    if (!form.title || !form.city || !form.project_type) { setError(lang === "tr" ? "Zorunlu alanları doldurun." : lang === "ru" ? "Заполните обязательные поля." : "Fill in required fields."); return; }
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
      citizenship_eligible: form.citizenship_eligible,
      payment_plan: form.payment_plan || null,
      handover_date: form.handover_date || null,
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
    if (projectId && docFiles.length > 0) {
      for (let i = 0; i < docFiles.length; i++) {
        const url = await uploadFile("project-pdfs", docFiles[i], `${profile.id}/${timestamp}_doc_${i}_${docFiles[i].name}`);
        if (url) await supabase.from("project_documents").insert({ project_id: projectId, name: docFiles[i].name, url });
      }
    }
    onSave();
  }

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
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

          {/* İkamet + Citizenship */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div onClick={() => set("ikamet_eligible", !form.ikamet_eligible)}
                style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.ikamet_eligible ? accent : borderColor, position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: form.ikamet_eligible ? 23 : 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: form.ikamet_eligible ? "#0F1923" : textMuted, transition: "left 0.2s" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: form.ikamet_eligible ? accent : "#F1F5F9" }}>{t.fields.ikamet}</div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div onClick={() => set("citizenship_eligible", !form.citizenship_eligible)}
                style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.citizenship_eligible ? accent : borderColor, position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: form.citizenship_eligible ? 23 : 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: form.citizenship_eligible ? "#0F1923" : textMuted, transition: "left 0.2s" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: form.citizenship_eligible ? accent : "#F1F5F9" }}>{t.fields.citizenship}</div>
            </label>
          </div>

          {/* Payment Plan + Handover Date */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.handoverDate}</label>
              <input style={inputStyle} type="date" value={form.handover_date} onChange={e => set("handover_date", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.fields.paymentPlan}</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} value={form.payment_plan} onChange={e => set("payment_plan", e.target.value)}
                placeholder={lang === "tr" ? "%30 Peşinat + 36 ay taksit\n%50 Peşinat + %5 indirim\nNakit + %8 indirim" : "35% Down + 36 months\n50% Down + 5% discount\nCash + 10% discount"} />
            </div>
          </div>

          {/* Amenities */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 14, color: accent }}>{t.fields.amenities}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {AMENITIES.map(a => (
                <label key={a.tr} onClick={() => toggleAmenity(a.tr)}
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, backgroundColor: form.amenities.includes(a.tr) ? `${accent}18` : "transparent", border: `1px solid ${form.amenities.includes(a.tr) ? accent : borderColor}`, transition: "all 0.15s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${form.amenities.includes(a.tr) ? accent : borderColor}`, backgroundColor: form.amenities.includes(a.tr) ? accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form.amenities.includes(a.tr) && <span style={{ color: "#0F1923", fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: form.amenities.includes(a.tr) ? "#F1F5F9" : textMuted }}>{lang === "en" ? a.en : lang === "ru" ? a.ru : a.tr}</span>
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
              <input type="file" accept=".pdf" onChange={e => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.type !== "application/pdf") { alert("Sadece PDF / Only PDF"); return; }
  if (f.size > 50 * 1024 * 1024) { alert("Maksimum 50 MB / Maximum 50 MB"); return; }
  setPdfFile(f);
}} style={{ display: "none" }} />
            </label>
          </div>

          {/* Dokumente */}
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>{t.fields.documents}</label>
            <p style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>{t.fields.docsHint}</p>
            {existingDocs.map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 12px", backgroundColor: bgPrimary, borderRadius: 7 }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span style={{ fontSize: 13, color: "#F1F5F9", flex: 1 }}>{d.name}</span>
                <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: accent }}>↗</a>
              </div>
            ))}
            {docFiles.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 12px", backgroundColor: bgPrimary, borderRadius: 7 }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span style={{ fontSize: 13, color: "#F1F5F9", flex: 1 }}>{f.name}</span>
                <button onClick={() => setDocFiles(d => d.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
            {(existingDocs.length + docFiles.length) < 5 && (
              <label style={{ display: "block", padding: "9px 14px", backgroundColor: bgPrimary, border: `1px dashed ${borderColor}`, borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 13, color: textMuted }}>
                {lang === "tr" ? `+ Belge Ekle (${existingDocs.length + docFiles.length}/5)` : `+ Add Document (${existingDocs.length + docFiles.length}/5)`}
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 50 * 1024 * 1024) { alert("Max 50 MB"); return; }
                  setDocFiles(d => [...d, f]);
                  e.target.value = "";
                }} style={{ display: "none" }} />
              </label>
            )}
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
