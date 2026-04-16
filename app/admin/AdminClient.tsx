"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/app/i18n/LanguageContext";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

const t = {
  tr: {
    title: "YapıMap Admin",
    logout: "Çıkış",
    waiting: "bekliyor",
    tabs: { users: "👥 Kullanıcılar", commissions: "💰 Komisyonlar" },
    filters: { pending: "Bekliyor", active: "Aktif", rejected: "Reddedildi", agents: "Ajanlar", developer: "Geliştirici" },
    search: "Ad, e-posta veya telefon ile ara...",
    noUsers: "Kullanıcı bulunamadı",
    role: { broker: "🏠 Emlakçı", developer: "🏗️ Geliştirici" },
    approve: "✓ Onayla",
    reject: "✗ Reddet",
    reapprove: "Tekrar Onayla",
    active: "✓ Aktif",
    tax: "Vergi No",
    ref: "Ref",
    commissions: "Komisyon Ödemeleri",
    pendingPay: "ödeme bekliyor",
    loading: "Yükleniyor...",
    noCommissions: "Henüz komisyon kaydı yok",
    invited: "davet etti",
    noIban: "IBAN girilmemiş",
    markPaid: "✓ Ödendi İşaretle",
    paid: "✓ Ödendi",
    statusPaid: "✓ ÖDENDİ",
    statusPending: "⏳ BEKLİYOR",
    searchCommissions: "Ad veya e-posta ile ara...",
  },
  en: {
    title: "YapıMap Admin",
    logout: "Logout",
    waiting: "waiting",
    tabs: { users: "👥 Users", commissions: "💰 Commissions" },
    filters: { pending: "Pending", active: "Active", rejected: "Rejected", agents: "Agents", developer: "Developer" },
    search: "Search by name, email or phone...",
    noUsers: "No users found",
    role: { broker: "🏠 Broker", developer: "🏗️ Developer" },
    approve: "✓ Approve",
    reject: "✗ Reject",
    reapprove: "Re-approve",
    active: "✓ Active",
    tax: "Tax No",
    ref: "Ref",
    commissions: "Commission Payments",
    pendingPay: "payments pending",
    loading: "Loading...",
    noCommissions: "No commissions yet",
    invited: "invited",
    noIban: "No IBAN entered",
    markPaid: "✓ Mark as Paid",
    paid: "✓ Paid",
    statusPaid: "✓ PAID",
    statusPending: "⏳ PENDING",
    searchCommissions: "Search by name or email...",
  },
  ru: {
    title: "YapıMap Админ",
    logout: "Выход",
    waiting: "ожидает",
    tabs: { users: "👥 Пользователи", commissions: "💰 Комиссии" },
    filters: { pending: "Ожидает", active: "Активен", rejected: "Отклонён", agents: "Агенты", developer: "Застройщики" },
    search: "Поиск по имени, e-mail или телефону...",
    noUsers: "Пользователи не найдены",
    role: { broker: "🏠 Маклер", developer: "🏗️ Застройщик" },
    approve: "✓ Одобрить",
    reject: "✗ Отклонить",
    reapprove: "Одобрить снова",
    active: "✓ Активен",
    tax: "ИНН",
    ref: "Реф",
    commissions: "Выплаты комиссий",
    pendingPay: "ожидают оплаты",
    loading: "Загрузка...",
    noCommissions: "Комиссий пока нет",
    invited: "пригласил",
    noIban: "IBAN не указан",
    markPaid: "✓ Отметить оплаченным",
    paid: "✓ Оплачено",
    statusPaid: "✓ ОПЛАЧЕНО",
    statusPending: "⏳ ОЖИДАЕТ",
    searchCommissions: "Поиск по имени или e-mail...",
  },
} as const;

type Lang = keyof typeof t;

type Profile = {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  tax_number: string | null;
  country: string | null;
  city: string | null;
  iban: string | null;
  referral_code: string | null;
};

type Commission = {
  id: string;
  amount: number;
  status: "pending" | "paid";
  created_at: string;
  referrer: { full_name: string; email: string; iban: string | null } | null;
  referred: { full_name: string; email: string } | null;
};

export default function AdminClient({ initialProfiles }: { initialProfiles: Profile[] }) {
  const router = useRouter();
  const { lang } = useLang();
  const l = t[(lang as Lang) in t ? (lang as Lang) : "en"];

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [filter, setFilter] = useState<"pending" | "active" | "rejected" | "agents" | "developer">("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "commissions">("users");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionSearch, setCommissionSearch] = useState("");

  async function approve(userId: string) {
    setActionLoading(userId);
    await fetch("/api/admin/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setProfiles(json.profiles || []);
    setActionLoading(null);
  }

  async function reject(userId: string) {
    setActionLoading(userId);
    await fetch("/api/admin/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setProfiles(json.profiles || []);
    setActionLoading(null);
  }

  async function loadCommissions() {
    setCommissionsLoading(true);
    const res = await fetch("/api/admin/commissions");
    const json = await res.json();
    setCommissions(json.commissions || []);
    setCommissionsLoading(false);
  }

  async function markPaid(id: string) {
    setActionLoading(id);
    await fetch("/api/admin/commissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await loadCommissions();
    setActionLoading(null);
  }

  useEffect(() => { loadCommissions(); }, []);
  useEffect(() => { if (tab === "commissions") loadCommissions(); }, [tab]);

  const pendingCount = profiles.filter(p => p.status === "pending").length;
  const pendingCommissions = commissions.filter(c => c.status === "pending").length;
  const agentsCount = profiles.filter(p => p.role === "broker").length;
  const developerCount = profiles.filter(p => p.role === "developer").length;
  const statusColor = (s: string) => ({ pending: "#F59E0B", active: "#10B981", rejected: "#EF4444" }[s] || textMuted);

  const filtered = (
    filter === "agents" ? profiles.filter(p => p.role === "broker") :
    filter === "developer" ? profiles.filter(p => p.role === "developer") :
    profiles.filter(p => p.status === filter)
  ).filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q) || p.company_name?.toLowerCase().includes(q));
  });

  const filteredCommissions = commissions.filter(c => {
    if (!commissionSearch) return true;
    const q = commissionSearch.toLowerCase();
    return (c.referrer?.full_name?.toLowerCase().includes(q) || c.referrer?.email?.toLowerCase().includes(q) || c.referred?.full_name?.toLowerCase().includes(q) || c.referred?.email?.toLowerCase().includes(q));
  });

  const inputStyle = { padding: "10px 16px", backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 10, color: "#F1F5F9", fontSize: 14, outline: "none", width: "100%" };

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>

      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: accent, fontSize: 22, fontWeight: 800 }}>{l.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {pendingCount > 0 && (
            <span style={{ backgroundColor: "#EF4444", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
              {pendingCount} {l.waiting}
            </span>
          )}
          <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = "/"; })}
            style={{ color: textMuted, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
            {l.logout}
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${borderColor}`, display: "flex", paddingLeft: 32 }}>
        {(["users", "commissions"] as const).map(key => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "14px 24px", fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: tab === key ? accent : textMuted, borderBottom: tab === key ? `2px solid ${accent}` : "2px solid transparent" }}>
            {l.tabs[key]}
            {key === "commissions" && pendingCommissions > 0 && (
              <span style={{ marginLeft: 8, backgroundColor: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>
                {pendingCommissions}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>

        {/* USERS TAB */}
        {tab === "users" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {(["pending", "active", "rejected", "agents", "developer"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${filter === f ? accent : borderColor}`, backgroundColor: filter === f ? `${accent}18` : "transparent", color: filter === f ? accent : textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {l.filters[f]}
                  {f === "pending" ? ` (${pendingCount})` : ""}
                  {f === "agents" ? ` (${agentsCount})` : ""}
                  {f === "developer" ? ` (${developerCount})` : ""}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <input style={inputStyle} placeholder={l.search} value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
              <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 48, textAlign: "center" }}>
                <p style={{ color: textMuted }}>{l.noUsers}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map(p => (
                  <div key={p.id} style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{p.full_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, backgroundColor: `${statusColor(p.status)}20`, color: statusColor(p.status) }}>
                          {p.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: textMuted, padding: "2px 8px", borderRadius: 999, border: `1px solid ${borderColor}` }}>
                          {p.role === "broker" ? l.role.broker : l.role.developer}
                        </span>
                      </div>
                      <p style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.company_name}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13, color: textMuted }}>
                        <span>📧 {p.email}</span>
                        <span>📞 {p.phone}</span>
                        {(p.country || p.city) && <span>📍 {[p.city, p.country].filter(Boolean).join(", ")}</span>}
                        {p.tax_number && <span>🧾 {l.tax}: <span style={{ color: "#F1F5F9" }}>{p.tax_number}</span></span>}
                        {p.iban && <span>🏦 IBAN: <span style={{ color: accent, fontFamily: "monospace" }}>{p.iban}</span></span>}
                        {p.referral_code && <span>🔗 {l.ref}: <span style={{ color: accent }}>{p.referral_code}</span></span>}
                      </div>
                      <p style={{ color: textMuted, fontSize: 11, marginTop: 6 }}>
                        {new Date(p.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {p.status === "pending" && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => approve(p.id)} disabled={actionLoading === p.id}
                          style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, opacity: actionLoading === p.id ? 0.6 : 1 }}>
                          {actionLoading === p.id ? "..." : l.approve}
                        </button>
                        <button onClick={() => reject(p.id)} disabled={actionLoading === p.id}
                          style={{ backgroundColor: "transparent", color: "#EF4444", fontWeight: 600, padding: "10px 20px", borderRadius: 8, border: "1px solid #EF4444", cursor: "pointer", fontSize: 14 }}>
                          {l.reject}
                        </button>
                      </div>
                    )}
                    {p.status === "active" && <span style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>{l.active}</span>}
                    {p.status === "rejected" && (
                      <button onClick={() => approve(p.id)}
                        style={{ color: accent, fontSize: 13, background: "none", border: `1px solid ${borderColor}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>
                        {l.reapprove}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* COMMISSIONS TAB */}
        {tab === "commissions" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{l.commissions}</h2>
              <span style={{ fontSize: 13, color: textMuted }}>{pendingCommissions} {l.pendingPay}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <input style={inputStyle} placeholder={l.searchCommissions} value={commissionSearch} onChange={e => setCommissionSearch(e.target.value)} />
            </div>

            {commissionsLoading ? (
              <p style={{ color: textMuted }}>{l.loading}</p>
            ) : filteredCommissions.length === 0 ? (
              <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 48, textAlign: "center" }}>
                <p style={{ color: textMuted }}>{l.noCommissions}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredCommissions.map(c => (
                  <div key={c.id} style={{ backgroundColor: bgCard, border: `1px solid ${c.status === "paid" ? borderColor : `${accent}44`}`, borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>€{c.amount}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, backgroundColor: c.status === "paid" ? "#10B98120" : "#F59E0B20", color: c.status === "paid" ? "#10B981" : "#F59E0B" }}>
                          {c.status === "paid" ? l.statusPaid : l.statusPending}
                        </span>
                      </div>
                      <p style={{ color: textMuted, fontSize: 13, marginBottom: 2 }}>
                        <strong style={{ color: "#F1F5F9" }}>{c.referrer?.full_name}</strong> → {c.referred?.full_name} {l.invited}
                      </p>
                      {c.referrer?.iban ? (
                        <p style={{ fontSize: 13, color: accent, fontFamily: "monospace", marginBottom: 2 }}>
                          IBAN: {c.referrer.iban}
                        </p>
                      ) : (
                        <p style={{ fontSize: 12, color: "#EF4444" }}>⚠️ {l.noIban} — {c.referrer?.email}</p>
                      )}
                      <p style={{ fontSize: 11, color: textMuted }}>
                        {new Date(c.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    {c.status === "pending" && (
                      <button onClick={() => markPaid(c.id)} disabled={actionLoading === c.id}
                        style={{ backgroundColor: "#10B981", color: "#fff", fontWeight: 700, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, opacity: actionLoading === c.id ? 0.6 : 1 }}>
                        {actionLoading === c.id ? "..." : l.markPaid}
                      </button>
                    )}
                    {c.status === "paid" && <span style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>{l.paid}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
