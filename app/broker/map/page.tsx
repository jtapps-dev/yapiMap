"use client";
import { useEffect, useState, useRef } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/i18n/LanguageContext";
import ReferralBox from "@/app/components/ReferralBox";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const TYPE_LABELS: Record<string, { tr: string; en: string; ru: string }> = {
  daire:      { tr: "Daire",     en: "Apartment", ru: "Квартира" },
  villa:      { tr: "Villa",     en: "Villa",      ru: "Вилла" },
  rezidans:   { tr: "Rezidans",  en: "Residence",  ru: "Резиденция" },
  ofis:       { tr: "Ofis",      en: "Office",     ru: "Офис" },
  townhouse:  { tr: "Townhouse", en: "Townhouse",  ru: "Таунхаус" },
  loft:       { tr: "Loft",      en: "Loft",       ru: "Лофт" },
};
const PROJECT_TYPES = Object.keys(TYPE_LABELS);

const DEFAULT_RATES: Record<string, number> = { TRY: 1, USD: 40, EUR: 43 };

type Project = {
  id: string; title: string; city: string; district: string;
  project_type: string; min_price: number; max_price: number;
  lat: number; lng: number; ikamet_eligible: boolean;
  cover_image_url: string | null;
  developer_logo_url: string | null;
};
type Profile = { full_name: string; status: string; role: string; subscription_status: string | null; referral_code: string | null };

export default function BrokerMapPage() {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [filters, setFilters] = useState({ city: "", district: "", type: "", minPrice: "", maxPrice: "", ikamet: false, citizenship: false });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<"filter" | "list">("filter");
  const [showPaywall, setShowPaywall] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const subscribed = profile?.subscription_status === "active";

  const tLabels = {
    tr: {
      signout: "Çıkış", showProjects: "Detayları Gör", filter: "Filtrele",
      city: "Şehir", district: "İlçe", type: "Proje Tipi", minPrice: "Min Fiyat", maxPrice: "Max Fiyat",
      apply: "Uygula", reset: "Sıfırla", allTypes: "Tüm Tipler",
      paywallTitle: "Premium Özellik", paywallText: "Detayları görmek için abonelik gereklidir.",
      subscribe: "Abone Ol", cancel: "Vazgeç", ikamet: "İkamet İzni Uygun", citizenship: "Vatandaşlık Yatırımı Uygun",
      loading: "Yükleniyor...", projectsFound: "proje bulundu", noProjects: "Proje bulunamadı",
      profile: "Profil",
    },
    en: {
      signout: "Sign Out", showProjects: "View Details", filter: "Filter",
      city: "City", district: "District", type: "Project Type", minPrice: "Min Price", maxPrice: "Max Price",
      apply: "Apply", reset: "Reset", allTypes: "All Types",
      paywallTitle: "Premium Feature", paywallText: "A subscription is required to view project details.",
      subscribe: "Subscribe", cancel: "Cancel", ikamet: "Residence Permit Eligible", citizenship: "Eligible for Citizenship by Investment",
      loading: "Loading...", projectsFound: "projects found", noProjects: "No projects found",
      profile: "Profile",
    },
    ru: {
      signout: "Выйти", showProjects: "Подробнее", filter: "Фильтр",
      city: "Город", district: "Район", type: "Тип проекта", minPrice: "Мин. цена", maxPrice: "Макс. цена",
      apply: "Применить", reset: "Сбросить", allTypes: "Все типы",
      paywallTitle: "Премиум функция", paywallText: "Для просмотра деталей требуется подписка.",
      subscribe: "Подписаться", cancel: "Отмена", ikamet: "Подходит для ВНЖ", citizenship: "Подходит для гражданства через инвестиции",
      loading: "Загрузка...", projectsFound: "проектов найдено", noProjects: "Проекты не найдены",
      profile: "Профиль",
    },
  } as const;
  const t = (tLabels as any)[lang] ?? tLabels.en;

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/EUR")
      .then(r => r.json())
      .then(data => {
        const usdPerEur = data.rates?.USD;
        const tryPerEur = data.rates?.TRY;
        if (tryPerEur && usdPerEur) {
          setRates({ TRY: 1, USD: tryPerEur / usdPerEur, EUR: tryPerEur });
        }
      })
      .catch(() => {
        // Fallback: frankfurter.app
        fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,TRY")
          .then(r => r.json())
          .then(data => {
            if (data.rates?.TRY && data.rates?.USD) {
              setRates({ TRY: 1, USD: data.rates.TRY / data.rates.USD, EUR: data.rates.TRY });
            }
          }).catch(() => {});
      });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("full_name, status, role, subscription_status, referral_code, privacy_accepted_at").eq("id", user.id).single()
        .then(async ({ data }) => {
          if (!data || data.status !== "active") { router.push("/pending"); return; }
          if (data.role === "admin") { router.push("/admin"); return; }
          if (data.role !== "broker") { router.push("/developer"); return; }
          if (!data.privacy_accepted_at) { router.replace("/consent"); return; }
          setProfile(data);
        });
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadProjects({ city: "", district: "", type: "", minPrice: "", maxPrice: "", ikamet: false, citizenship: false });
  }, [profile]);

  function loadProjects(f: typeof filters, currentRates = rates, currentCurrency = currency) {
    const supabase = createClient();
    let q = supabase.from("projects")
      .select("id, title, city, district, project_type, min_price, max_price, lat, lng, ikamet_eligible, cover_image_url, profiles(logo_url)")
      .eq("status", "published");
    if (f.city) q = q.ilike("city", `%${f.city.trim()}%`);
    if (f.district) q = q.ilike("district", `%${f.district.trim()}%`);
    if (f.type) q = q.eq("project_type", f.type);
    const minTRY = f.minPrice ? parseFloat(f.minPrice) * currentRates[currentCurrency] : null;
    const maxTRY = f.maxPrice ? parseFloat(f.maxPrice) * currentRates[currentCurrency] : null;
    if (minTRY) q = q.gte("max_price", minTRY);
    if (maxTRY) q = q.lte("min_price", maxTRY);
    if (f.ikamet) q = q.eq("ikamet_eligible", true);
    if (f.citizenship) q = q.eq("citizenship_eligible", true);
    q.then(({ data, error }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: Project[] = ((data as any[]) || []).map((p: any) => ({
        ...p,
        developer_logo_url: p.profiles?.logo_url ?? null,
      }));
      setProjects(results);
      // Karte zu Ergebnissen fliegen
      if (results.length === 1) {
        mapRef.current?.flyTo({ center: [results[0].lng, results[0].lat], zoom: 13, duration: 1000 });
      } else if (results.length > 1) {
        // Bounds berechnen
        const lngs = results.map(p => p.lng);
        const lats = results.map(p => p.lat);
        mapRef.current?.fitBounds(
          [[Math.min(...lngs) - 0.5, Math.min(...lats) - 0.5], [Math.max(...lngs) + 0.5, Math.max(...lats) + 0.5]],
          { duration: 1000, padding: 60 }
        );
      }
    });
  }

  function applyFilters() { loadProjects(filters, rates, currency); }
  function resetFilters() {
    const empty = { city: "", district: "", type: "", minPrice: "", maxPrice: "", ikamet: false, citizenship: false };
    setFilters(empty);
    loadProjects(empty, rates, currency);
  }

  function formatPrice(p: number) {
    const converted = p / rates[currency];
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function generatePDF() {
    if (!subscribed) { setShowPaywall(true); return; }
    const ids = Array.from(selectedIds).join(",");
    router.push(`/broker/catalog?projects=${ids}&lang=${lang}`);
  }

  function handleSelectToggle(id: string) {
    if (!subscribed) { setShowPaywall(true); return; }
    toggleSelect(id);
  }

  if (!profile) return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: textMuted }}>{t.loading}</p>
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "8px 10px", backgroundColor: bgPrimary,
    border: `1px solid ${borderColor}`, borderRadius: 7, color: "#F1F5F9",
    fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: bgPrimary, fontFamily: "system-ui, sans-serif" }}>

      {/* Paywall Modal */}
      {showPaywall && (
        <div onClick={() => setShowPaywall(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: bgCard, borderRadius: 16, padding: 40, maxWidth: 420, width: "90%", textAlign: "center", border: `1px solid ${borderColor}` }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 10 }}>{t.paywallTitle}</h2>
            <p style={{ color: textMuted, fontSize: 15, marginBottom: 28 }}>{t.paywallText}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => router.push("/subscribe")}
                style={{ padding: "12px 28px", backgroundColor: accent, color: bgPrimary, fontWeight: 800, fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer" }}>
                {t.subscribe}
              </button>
              <button onClick={() => setShowPaywall(false)}
                style={{ padding: "12px 20px", backgroundColor: "transparent", color: textMuted, fontSize: 14, borderRadius: 10, border: `1px solid ${borderColor}`, cursor: "pointer" }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span onClick={() => router.push("/")} style={{ color: accent, fontSize: 20, fontWeight: 800, cursor: "pointer" }}>YapıMap</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {(["tr", "en", "ru"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${lang === l ? accent : borderColor}`, backgroundColor: lang === l ? `${accent}22` : "transparent", color: lang === l ? accent : textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ color: textMuted, fontSize: 13 }}>{profile.full_name}</span>
          <button onClick={() => router.push("/profile")}
            style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
            {t.profile}
          </button>
          <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = "/"; })}
            style={{ color: textMuted, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
            {t.signout}
          </button>
        </div>
      </nav>

      {/* Referral Banner */}
      {profile.referral_code && <ReferralBox referralCode={profile.referral_code} lang={lang} />}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: 280, backgroundColor: bgCard, borderRight: `1px solid ${borderColor}`, flexShrink: 0, display: "flex", flexDirection: "column" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
            {(["filter", "list"] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                style={{ flex: 1, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: "transparent", color: sidebarTab === tab ? accent : textMuted, borderBottom: sidebarTab === tab ? `2px solid ${accent}` : "2px solid transparent" }}>
                {tab === "filter" ? (lang === "tr" ? "Filtre" : "Filter") : (lang === "tr" ? `Liste (${projects.length})` : `List (${projects.length})`)}
              </button>
            ))}
          </div>

          {/* PDF Button wenn Projekte ausgewählt */}
          {selectedIds.size > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
              <button onClick={generatePDF}
                style={{ width: "100%", padding: "9px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 13, borderRadius: 7, border: "none", cursor: "pointer" }}>
                📄 {lang === "tr" ? `PDF Oluştur (${selectedIds.size})` : `Generate PDF (${selectedIds.size})`}
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
          {sidebarTab === "filter" && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Währung */}
          <div>
            <label style={{ fontSize: 11, color: textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              {lang === "tr" ? "Para Birimi" : "Currency"}
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["TRY", "USD", "EUR"] as const).map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${currency === c ? accent : borderColor}`, backgroundColor: currency === c ? `${accent}22` : "transparent", color: currency === c ? accent : textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {c === "TRY" ? "₺" : c === "USD" ? "$" : "€"} {c}
                </button>
              ))}
            </div>
            {currency !== "TRY" && (
              <div style={{ fontSize: 10, color: textMuted, marginTop: 4, textAlign: "center" }}>
                1 {currency === "USD" ? "$" : "€"} = {Math.round(rates[currency])} ₺
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${borderColor}` }} />

          {/* Anzahl */}
          <div style={{ fontSize: 12, color: textMuted, textAlign: "center", padding: "6px 0", backgroundColor: `${accent}11`, borderRadius: 6 }}>
            <span style={{ color: accent, fontWeight: 700 }}>{projects.length}</span> {t.projectsFound}
          </div>

          {/* City */}
          <div>
            <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.city}</label>
            <input style={inputStyle} value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} />
          </div>

          {/* District */}
          <div>
            <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.district}</label>
            <input style={inputStyle} value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>{t.type}</label>
            <select style={{ ...inputStyle }} value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">{t.allTypes}</option>
              {PROJECT_TYPES.map(tp => <option key={tp} value={tp}>{TYPE_LABELS[tp]?.[lang as "tr"|"en"|"ru"] || tp}</option>)}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>
              {t.minPrice} ({currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"})
            </label>
            <input style={inputStyle} type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 4 }}>
              {t.maxPrice} ({currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€"})
            </label>
            <input style={inputStyle} type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
          </div>

          {/* İkamet */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={filters.ikamet} onChange={e => setFilters(f => ({ ...f, ikamet: e.target.checked }))}
              style={{ width: 15, height: 15, accentColor: accent }} />
            <span style={{ fontSize: 13, color: "#F1F5F9" }}>{t.ikamet}</span>
          </label>

          {/* Citizenship */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={filters.citizenship} onChange={e => setFilters(f => ({ ...f, citizenship: e.target.checked }))}
              style={{ width: 15, height: 15, accentColor: accent }} />
            <span style={{ fontSize: 13, color: "#F1F5F9" }}>{t.citizenship}</span>
          </label>

          {/* Buttons */}
          <button onClick={applyFilters}
            style={{ width: "100%", padding: "10px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 13, borderRadius: 8, border: "none", cursor: "pointer" }}>
            {t.apply}
          </button>
          <button onClick={resetFilters}
            style={{ width: "100%", padding: "9px", backgroundColor: "transparent", color: textMuted, fontSize: 13, borderRadius: 8, border: `1px solid ${borderColor}`, cursor: "pointer" }}>
            {t.reset}
          </button>

          </div>
          )}

          {sidebarTab === "list" && (
            <div>
              {projects.map((p, i) => (
                <div key={p.id}
                  onClick={() => { if (!subscribed) { setShowPaywall(true); return; } setSelected(p); mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 13, duration: 800 }); }}
                  style={{ padding: "14px 16px", borderBottom: `1px solid ${borderColor}`, cursor: subscribed ? "pointer" : "default", backgroundColor: selected?.id === p.id ? `${accent}11` : "transparent", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Checkbox — nur für Subscribed */}
                  {subscribed ? (
                    <div onClick={e => { e.stopPropagation(); handleSelectToggle(p.id); }}
                      style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedIds.has(p.id) ? accent : borderColor}`, backgroundColor: selectedIds.has(p.id) ? accent : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      {selectedIds.has(p.id) && <span style={{ color: "#0F1923", fontSize: 11, fontWeight: 900 }}>✓</span>}
                    </div>
                  ) : (
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${borderColor}`, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: textMuted }}>
                      🔒
                    </div>
                  )}
                  {/* Cover thumb — gesperrt wenn nicht subscribed */}
                  {subscribed ? (
                    p.cover_image_url
                      ? <div style={{ width: 48, height: 48, backgroundColor: "#0F1923", borderRadius: 6, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 3 }}><img src={p.cover_image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /></div>
                      : <div style={{ width: 48, height: 48, backgroundColor: bgPrimary, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏢</div>
                  ) : (
                    <div style={{ width: 48, height: 48, backgroundColor: bgPrimary, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, filter: "blur(0px)" }}>🔒</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {subscribed ? (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: selected?.id === p.id ? accent : "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>{p.district}, {p.city}</div>
                        <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{formatPrice(p.min_price)} – {formatPrice(p.max_price)}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: textMuted }}>
                          {lang === "tr" ? `Proje ${i + 1}` : lang === "ru" ? `Проект ${i + 1}` : `Project ${i + 1}`}
                        </div>
                        <div style={{ fontSize: 11, color: borderColor, marginBottom: 2, userSelect: "none" }}>{"█".repeat(8)}</div>
                        <div style={{ fontSize: 11, color: accent, fontWeight: 600, opacity: 0.5 }}>
                          {lang === "tr" ? "Abonelik gerekli" : lang === "ru" ? "Нужна подписка" : "Subscription required"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: textMuted, fontSize: 13 }}>
                  {t.noProjects}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: 35.2433, latitude: 38.9637, zoom: 5.5 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            <NavigationControl position="bottom-right" />

            {projects.map(p => (
              <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); if (!subscribed) { setShowPaywall(true); return; } setSelected(p); }}>
                <div style={{
                  backgroundColor: !subscribed ? accent : selectedIds.has(p.id) ? "#10B981" : selected?.id === p.id ? "#fff" : accent,
                  color: "#0F1923", fontSize: 11, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  transform: selected?.id === p.id ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                  outline: selectedIds.has(p.id) ? "2px solid #fff" : "none",
                }}>
                  {!subscribed ? "🔒 " : selectedIds.has(p.id) ? "✓ " : ""}{p.city}
                </div>
              </Marker>
            ))}

            {selected && (
              <Popup longitude={selected.lng} latitude={selected.lat} anchor="top"
                onClose={() => setSelected(null)} closeButton closeOnClick={false} maxWidth="260px">
                <div style={{ backgroundColor: bgCard, borderRadius: 10, padding: 14, width: 230, color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
                  {selected.developer_logo_url && (
                    <div style={{ width: "100%", height: 80, backgroundColor: "#0F1923", borderRadius: 7, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
                      <img src={selected.developer_logo_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  {selected.cover_image_url && !selected.developer_logo_url && (
                    <div style={{ width: "100%", height: 90, backgroundColor: "#0F1923", borderRadius: 7, marginBottom: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={selected.cover_image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{selected.title}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>{selected.district}, {selected.city}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>{TYPE_LABELS[selected.project_type]?.[lang as "tr"|"en"|"ru"] || selected.project_type}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: accent, marginBottom: 8 }}>
                    {formatPrice(selected.min_price)} – {formatPrice(selected.max_price)}
                  </div>
                  {selected.ikamet_eligible && (
                    <div style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, backgroundColor: "#10B98120", color: "#10B981", display: "inline-block", marginBottom: 10 }}>
                      ✓ {t.ikamet}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { if (!subscribed) { setShowPaywall(true); } else { router.push(`/projects/${selected.id}`); } }}
                      style={{ flex: 1, padding: "8px", backgroundColor: accent, color: "#0F1923", fontWeight: 700, fontSize: 13, borderRadius: 7, border: "none", cursor: "pointer" }}>
                      {subscribed ? t.showProjects : "🔒 " + t.showProjects}
                    </button>
                    <button onClick={() => handleSelectToggle(selected.id)}
                      style={{ padding: "8px 10px", backgroundColor: selectedIds.has(selected.id) ? "#10B981" : "transparent", color: selectedIds.has(selected.id) ? "#fff" : accent, fontWeight: 700, fontSize: 12, borderRadius: 7, border: `1px solid ${selectedIds.has(selected.id) ? "#10B981" : accent}`, cursor: "pointer", whiteSpace: "nowrap" }}>
                      {selectedIds.has(selected.id) ? "✓ PDF" : "+ PDF"}
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
