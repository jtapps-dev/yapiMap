"use client";
import { useEffect, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/i18n/LanguageContext";
import ProjectForm from "./ProjectForm";
import ReferralBox from "@/app/components/ReferralBox";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const DEFAULT_RATES: Record<string, number> = { TRY: 1, USD: 38, EUR: 52 };

type Project = {
  id: string; title: string; city: string; district: string;
  project_type: string; min_price: number; max_price: number;
  lat: number; lng: number; status: string; ikamet_eligible: boolean;
  created_at: string; cover_image_url: string | null;
  pdf_url: string | null; description: string | null;
  amenities: string[] | null;
  contact_name: string | null; contact_phone: string | null; contact_email: string | null;
};
type Profile = { id: string; full_name: string; role: string; status: string; logo_url: string | null; subscription_status: string | null; created_at: string; referral_code: string | null };

export default function DeveloperPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [brokerCount, setBrokerCount] = useState<number | null>(null);

  const tLabels = {
    tr: {
      title: "Projelerim", add: "+ Yeni Proje", signout: "Çıkış", loading: "Yükleniyor...",
      noProjects: "Henüz proje eklemediniz.",
      draft: "Taslak", published: "Yayında", archived: "Arşiv",
      ikamet: "İkamet İzni", edit: "Düzenle", publish: "Yayınla", archive: "Arşivle",
      unpublish: "Taslağa Al", delete: "Sil",
      confirmDelete: "Bu projeyi silmek istediğinizden emin misiniz?",
      allTypes: "Tüm Tipler", allStatus: "Tüm Durumlar",
      trialDays: (d: number) => `🎁 Ücretsiz deneme süreniz: ${d} gün kaldı`,
      trialLastDay: "⚠️ Ücretsiz deneme süreniz bugün bitiyor!",
      trialSubscribe: "Abone Ol",
    },
    en: {
      title: "My Projects", add: "+ New Project", signout: "Sign Out", loading: "Loading...",
      noProjects: "No projects yet.",
      draft: "Draft", published: "Published", archived: "Archived",
      ikamet: "Residence Permit", edit: "Edit", publish: "Publish", archive: "Archive",
      unpublish: "Unpublish", delete: "Delete",
      confirmDelete: "Are you sure you want to delete this project?",
      allTypes: "All Types", allStatus: "All Status",
      trialDays: (d: number) => `🎁 Free trial: ${d} days remaining`,
      trialLastDay: "⚠️ Your free trial ends today!",
      trialSubscribe: "Subscribe",
    },
    ru: {
      title: "Мои проекты", add: "+ Новый проект", signout: "Выйти", loading: "Загрузка...",
      noProjects: "Проектов пока нет.",
      draft: "Черновик", published: "Опубликован", archived: "Архив",
      ikamet: "ВНЖ", edit: "Изменить", publish: "Опубликовать", archive: "В архив",
      unpublish: "Снять с публикации", delete: "Удалить",
      confirmDelete: "Вы уверены, что хотите удалить этот проект?",
      allTypes: "Все типы", allStatus: "Все статусы",
      trialDays: (d: number) => `🎁 Пробный период: осталось ${d} дней`,
      trialLastDay: "⚠️ Пробный период заканчивается сегодня!",
      trialSubscribe: "Подписаться",
    },
  };
  const t = tLabels[lang as keyof typeof tLabels] ?? tLabels.en;

  const PROJECT_TYPES = ["daire", "villa", "rezidans", "ofis", "townhouse", "loft", "karma"];

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=TRY&to=USD,EUR")
      .then(r => r.json())
      .then(data => {
        if (data.rates) {
          setRates({ TRY: 1, USD: 1 / data.rates.USD, EUR: 1 / data.rates.EUR });
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("id, full_name, role, status, logo_url, subscription_status, created_at, referral_code").eq("id", user.id).single()
        .then(({ data }) => {
          if (!data || data.status !== "active") { router.push("/pending"); return; }
          if (data.role !== "developer") { router.push("/broker/map"); return; }
          // 3 Monate Gratis-Testphase prüfen
          const trialEnd = new Date(data.created_at);
          trialEnd.setMonth(trialEnd.getMonth() + 3);
          const trialActive = new Date() < trialEnd;
          if (!trialActive && data.subscription_status !== "active") {
            router.push("/subscribe");
            return;
          }
          setProfile(data);
          loadProjects(data.id);
          // Makler-Anzahl laden
          supabase.from("profiles").select("id", { count: "exact", head: true })
            .eq("role", "broker").eq("status", "active")
            .then(({ count }) => setBrokerCount(count ?? 0));
        });
    });
  }, []);

  function loadProjects(userId: string) {
    const supabase = createClient();
    supabase.from("projects")
      .select("id, title, city, district, project_type, min_price, max_price, lat, lng, status, ikamet_eligible, created_at, cover_image_url, pdf_url, description, amenities, contact_name, contact_phone, contact_email")
      .eq("developer_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects(data || []));
  }

  async function toggleStatus(project: Project, newStatus: string) {
    const supabase = createClient();
    await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);
    if (profile) loadProjects(profile.id);
  }

  async function deleteProject(id: string) {
    if (!confirm(t.confirmDelete)) return;
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", id);
    if (profile) loadProjects(profile.id);
    if (selected?.id === id) setSelected(null);
  }

  // Trial Banner berechnen
  const trialDaysLeft = (() => {
    if (!profile || profile.subscription_status === "active") return null;
    const trialEnd = new Date(profile.created_at);
    trialEnd.setMonth(trialEnd.getMonth() + 3);
    const diff = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  const statusColor = (s: string) => ({ draft: "#F59E0B", published: "#10B981", archived: textMuted }[s] || textMuted);
  const statusLabel = (s: string) => ({ draft: t.draft, published: t.published, archived: t.archived }[s] || s);

  function formatPrice(p: number | null) {
    if (!p) return "–";
    const converted = p / rates[currency];
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  }

  const filtered = projects.filter(p => {
    if (filterType && p.project_type !== filterType) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  async function handleLogoUpload(file: File) {
    if (!profile) return;
    setLogoUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      await supabase.from("profiles").update({ logo_url: data.publicUrl }).eq("id", profile.id);
      setProfile(p => p ? { ...p, logo_url: data.publicUrl } : p);
    }
    setLogoUploading(false);
  }

  if (!profile) return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: textMuted }}>{t.loading}</p>
    </div>
  );

  if (showForm || editProject) {
    return (
      <ProjectForm
        profile={profile}
        project={editProject}
        onSave={() => { setShowForm(false); setEditProject(null); loadProjects(profile.id); }}
        onCancel={() => { setShowForm(false); setEditProject(null); }}
        lang={lang}
      />
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: bgPrimary, fontFamily: "system-ui, sans-serif", color: "#F1F5F9" }}>

      {/* Trial Banner */}
      {trialDaysLeft !== null && (
        <div style={{
          background: trialDaysLeft <= 7
            ? "linear-gradient(90deg, #7F1D1D, #991B1B)"
            : trialDaysLeft <= 30
            ? "linear-gradient(90deg, #78350F, #92400E)"
            : "linear-gradient(90deg, #14532D, #166534)",
          padding: "10px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {trialDaysLeft === 0 ? t.trialLastDay : t.trialDays(trialDaysLeft)}
            </div>
            {/* Progress Bar */}
            <div style={{ width: 120, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${Math.min(100, (trialDaysLeft / 90) * 100)}%`,
                backgroundColor: trialDaysLeft <= 7 ? "#FCA5A5" : trialDaysLeft <= 30 ? "#FCD34D" : "#6EE7B7",
              }} />
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              {trialDaysLeft}/90
            </span>
          </div>
          <button onClick={() => router.push("/subscribe")}
            style={{ padding: "6px 16px", backgroundColor: accent, color: bgPrimary, fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            {t.trialSubscribe} →
          </button>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label title="Firma logosunu yükle / Upload company logo" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {profile.logo_url
              ? <img src={profile.logo_url} alt="logo" style={{ height: 32, maxWidth: 100, objectFit: "contain", borderRadius: 4, border: `1px solid ${borderColor}`, padding: 2, backgroundColor: "#0F1923" }} />
              : <div style={{ height: 32, padding: "0 10px", border: `1px dashed ${borderColor}`, borderRadius: 4, display: "flex", alignItems: "center", color: textMuted, fontSize: 12 }}>
                  {logoUploading ? "..." : "+ Logo"}
                </div>
            }
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
          </label>
          <span style={{ color: textMuted, fontSize: 13 }}>{profile.full_name}</span>
          <button onClick={() => router.push("/profile")}
            style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
            {lang === "tr" ? "Profil" : "Profile"}
          </button>
          <button onClick={() => createClient().auth.signOut().then(() => router.push("/"))}
            style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
            {t.signout}
          </button>
        </div>
      </nav>

      {/* Referral Banner */}
      {profile.referral_code && <ReferralBox referralCode={profile.referral_code} lang={lang} />}

      {/* Stat Banner */}
      {brokerCount !== null && brokerCount > 0 && (
        <div style={{ backgroundColor: "#0F2336", borderBottom: `1px solid ${borderColor}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontSize: 13, color: textMuted }}>
            {lang === "tr" ? `Platformda şu an ` : lang === "ru" ? `На платформе ` : `Platform has `}
            <span style={{ color: accent, fontWeight: 700 }}>{brokerCount}</span>
            {lang === "tr" ? ` aktif emlakçı var` : lang === "ru" ? ` активных маклеров` : ` active brokers`}
          </span>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Project List */}
        <div style={{ width: 380, borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t.title} ({projects.length})</span>
            <button onClick={() => setShowForm(true)}
              style={{ padding: "7px 14px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 13, borderRadius: 7, border: "none", cursor: "pointer" }}>
              {t.add}
            </button>
          </div>

          {/* Filters */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${borderColor}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ flex: 1, padding: "6px 8px", backgroundColor: bgPrimary, border: `1px solid ${borderColor}`, borderRadius: 6, color: "#F1F5F9", fontSize: 12, outline: "none" }}>
              <option value="">{t.allStatus}</option>
              <option value="draft">{t.draft}</option>
              <option value="published">{t.published}</option>
              <option value="archived">{t.archived}</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ flex: 1, padding: "6px 8px", backgroundColor: bgPrimary, border: `1px solid ${borderColor}`, borderRadius: 6, color: "#F1F5F9", fontSize: 12, outline: "none" }}>
              <option value="">{t.allTypes}</option>
              {PROJECT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
            <div style={{ display: "flex", gap: 4 }}>
              {(["TRY", "USD", "EUR"] as const).map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  style={{ padding: "5px 8px", borderRadius: 5, border: `1px solid ${currency === c ? accent : borderColor}`, backgroundColor: currency === c ? `${accent}22` : "transparent", color: currency === c ? accent : textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {c === "TRY" ? "₺" : c === "USD" ? "$" : "€"}
                </button>
              ))}
            </div>
          </div>

          {/* Project List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: textMuted, marginBottom: 16 }}>{t.noProjects}</p>
                <button onClick={() => setShowForm(true)}
                  style={{ padding: "9px 20px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 13, borderRadius: 7, border: "none", cursor: "pointer" }}>
                  {t.add}
                </button>
              </div>
            ) : filtered.map(p => (
              <div key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  padding: "14px 20px", borderBottom: `1px solid ${borderColor}`, cursor: "pointer",
                  backgroundColor: selected?.id === p.id ? `${accent}10` : "transparent",
                  borderLeft: `3px solid ${selected?.id === p.id ? accent : "transparent"}`,
                  transition: "background 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, backgroundColor: `${statusColor(p.status)}20`, color: statusColor(p.status) }}>
                        {statusLabel(p.status)}
                      </span>
                      {p.ikamet_eligible && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, backgroundColor: "#10B98120", color: "#10B981" }}>İkamet</span>}
                    </div>
                    <p style={{ color: textMuted, fontSize: 12, marginBottom: 2 }}>{p.district}, {p.city} · {p.project_type}</p>
                    <p style={{ color: accent, fontSize: 12, fontWeight: 600 }}>{formatPrice(p.min_price)} – {formatPrice(p.max_price)}</p>
                  </div>
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt="" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 6, flexShrink: 0, backgroundColor: bgPrimary }} />
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditProject(p)}
                    style={{ padding: "4px 10px", backgroundColor: "transparent", color: accent, fontSize: 11, fontWeight: 600, borderRadius: 5, border: `1px solid ${accent}`, cursor: "pointer" }}>
                    {t.edit}
                  </button>
                  {p.status === "draft" && (
                    <button onClick={() => toggleStatus(p, "published")}
                      style={{ padding: "4px 10px", backgroundColor: "#10B98120", color: "#10B981", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "1px solid #10B981", cursor: "pointer" }}>
                      {t.publish}
                    </button>
                  )}
                  {p.status === "published" && (
                    <button onClick={() => toggleStatus(p, "draft")}
                      style={{ padding: "4px 10px", backgroundColor: "transparent", color: textMuted, fontSize: 11, borderRadius: 5, border: `1px solid ${borderColor}`, cursor: "pointer" }}>
                      {t.unpublish}
                    </button>
                  )}
                  {p.status !== "archived" && (
                    <button onClick={() => toggleStatus(p, "archived")}
                      style={{ padding: "4px 10px", backgroundColor: "transparent", color: textMuted, fontSize: 11, borderRadius: 5, border: `1px solid ${borderColor}`, cursor: "pointer" }}>
                      {t.archive}
                    </button>
                  )}
                  <button onClick={() => deleteProject(p.id)}
                    style={{ padding: "4px 10px", backgroundColor: "transparent", color: "#EF4444", fontSize: 11, borderRadius: 5, border: "1px solid #EF4444", cursor: "pointer" }}>
                    {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: 35.2433, latitude: 38.9637, zoom: 5.5 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            <NavigationControl position="bottom-right" />

            {projects.filter(p => p.lat && p.lng).map(p => (
              <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setSelected(p); }}>
                <div style={{
                  backgroundColor: selected?.id === p.id ? "#fff" : p.status === "published" ? accent : p.status === "draft" ? "#F59E0B" : textMuted,
                  color: "#0F1923", fontSize: 11, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  transform: selected?.id === p.id ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                }}>
                  {p.title || p.city}
                </div>
              </Marker>
            ))}

            {selected && selected.lat && (
              <Popup longitude={selected.lng} latitude={selected.lat} anchor="top"
                onClose={() => setSelected(null)} closeButton closeOnClick={false} maxWidth="260px">
                <div style={{ backgroundColor: bgCard, borderRadius: 10, padding: 14, width: 230, color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
                  {selected.cover_image_url && (
                    <div style={{ width: "100%", height: 80, backgroundColor: "#0F1923", borderRadius: 7, marginBottom: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={selected.cover_image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{selected.title}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>{selected.district}, {selected.city}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: accent }}>{formatPrice(selected.min_price)} – {formatPrice(selected.max_price)}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={() => setEditProject(selected)}
                      style={{ flex: 1, padding: "7px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer" }}>
                      {t.edit}
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>
    </div>
  );
}
