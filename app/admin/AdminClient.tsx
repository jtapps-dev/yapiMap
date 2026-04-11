"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const bgCard = "#1E2D3D";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

type Profile = {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

export default function AdminClient({ initialProfiles }: { initialProfiles: Profile[] }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [filter, setFilter] = useState<"pending" | "active" | "rejected" | "all">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function approve(userId: string) {
    setActionLoading(userId);
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setProfiles(json.profiles || []);
    setActionLoading(null);
  }

  async function reject(userId: string) {
    setActionLoading(userId);
    await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setProfiles(json.profiles || []);
    setActionLoading(null);
  }

  const filtered = filter === "all" ? profiles : profiles.filter(p => p.status === filter);
  const pendingCount = profiles.filter(p => p.status === "pending").length;

  const statusColor = (s: string) => ({ pending: "#F59E0B", active: "#10B981", rejected: "#EF4444" }[s] || textMuted);

  return (
    <div style={{ backgroundColor: bgPrimary, minHeight: "100vh", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>

      <nav style={{ backgroundColor: "#162030", borderBottom: `1px solid ${borderColor}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: accent, fontSize: 22, fontWeight: 800 }}>YapiMap Admin</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {pendingCount > 0 && (
            <span style={{ backgroundColor: "#EF4444", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
              {pendingCount} bekliyor
            </span>
          )}
          <button
            onClick={() => fetch("/api/auth/signout").then(() => router.push("/"))}
            style={{ color: textMuted, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}
          >
            Çıkış
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["pending", "active", "rejected", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: `1px solid ${filter === f ? accent : borderColor}`,
                backgroundColor: filter === f ? `${accent}18` : "transparent",
                color: filter === f ? accent : textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
              {f === "pending" ? `Bekliyor (${pendingCount})` : f === "active" ? "Aktif" : f === "rejected" ? "Reddedildi" : "Tümü"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 16, padding: 48, textAlign: "center" }}>
            <p style={{ color: textMuted }}>Kullanıcı bulunamadı</p>
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
                      {p.role === "broker" ? "🏠 Emlakçı" : "🏗️ Geliştirici"}
                    </span>
                  </div>
                  <p style={{ color: textMuted, fontSize: 14, marginBottom: 2 }}>{p.company_name}</p>
                  <p style={{ color: textMuted, fontSize: 13 }}>{p.email} · {p.phone}</p>
                  <p style={{ color: textMuted, fontSize: 12, marginTop: 4 }}>
                    {new Date(p.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {p.status === "pending" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => approve(p.id)} disabled={actionLoading === p.id}
                      style={{ backgroundColor: accent, color: "#0F1923", fontWeight: 700, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, opacity: actionLoading === p.id ? 0.6 : 1 }}>
                      {actionLoading === p.id ? "..." : "✓ Onayla"}
                    </button>
                    <button onClick={() => reject(p.id)} disabled={actionLoading === p.id}
                      style={{ backgroundColor: "transparent", color: "#EF4444", fontWeight: 600, padding: "10px 20px", borderRadius: 8, border: "1px solid #EF4444", cursor: "pointer", fontSize: 14 }}>
                      ✗ Reddet
                    </button>
                  </div>
                )}
                {p.status === "active" && <span style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>✓ Aktif</span>}
                {p.status === "rejected" && (
                  <button onClick={() => approve(p.id)}
                    style={{ color: accent, fontSize: 13, background: "none", border: `1px solid ${borderColor}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>
                    Tekrar Onayla
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
