"use client";
import { useState } from "react";

const accent = "#E8B84B";
const bgPrimary = "#0F1923";
const textMuted = "#94A3B8";
const borderColor = "#2A3F55";

type Props = {
  referralCode: string | null;
  lang: string;
};

export default function ReferralBox({ referralCode, lang }: Props) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!referralCode) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${referralCode}`
    : `/register?ref=${referralCode}`;

  const shareText = lang === "tr"
    ? `YapıMap'e katılın ve €20 indirim kazanın! Referral kodum: ${referralCode} — ${shareUrl}`
    : lang === "ru"
    ? `Присоединяйтесь к YapıMap и получите скидку €20! Мой реферальный код: ${referralCode} — ${shareUrl}`
    : `Join YapıMap and get €20 off! My referral code: ${referralCode} — ${shareUrl}`;

  const labels = {
    tr: { invite: "Arkadaşını Davet Et", earn: "€100 kazan", code: "Kodun:", copy: "Kopyala", copied: "✓", whatsapp: "WhatsApp", copyLink: "Link Kopyala", linkCopied: "✓ Kopyalandı" },
    en: { invite: "Invite Friends", earn: "Earn €100", code: "Your code:", copy: "Copy", copied: "✓", whatsapp: "WhatsApp", copyLink: "Copy Link", linkCopied: "✓ Copied" },
    ru: { invite: "Пригласить друзей", earn: "€100 бонус", code: "Ваш код:", copy: "Копировать", copied: "✓", whatsapp: "WhatsApp", copyLink: "Копировать ссылку", linkCopied: "✓ Скопировано" },
  } as const;

  const t = labels[lang as keyof typeof labels] ?? labels.en;

  function copyCode() {
    navigator.clipboard.writeText(referralCode!);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareText);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }

  return (
    <div style={{
      backgroundColor: "#111f2e",
      borderBottom: `1px solid ${accent}33`,
      padding: "9px 24px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap" as const,
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
        <span style={{ fontSize: 15 }}>🎁</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{t.invite}</span>
        <span style={{ fontSize: 11, color: textMuted, backgroundColor: `${accent}15`, border: `1px solid ${accent}33`, borderRadius: 6, padding: "1px 7px" }}>{t.earn} / Person</span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, backgroundColor: borderColor, flexShrink: 0 }} />

      {/* Code */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: textMuted }}>{t.code}</span>
        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, letterSpacing: 2, color: accent }}>{referralCode}</span>
        <button onClick={copyCode} style={{
          padding: "3px 10px",
          backgroundColor: codeCopied ? "#10B981" : `${accent}22`,
          color: codeCopied ? "#fff" : accent,
          fontWeight: 700,
          fontSize: 11,
          borderRadius: 6,
          border: `1px solid ${codeCopied ? "#10B981" : accent}`,
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap" as const,
        }}>
          {codeCopied ? t.copied : t.copy}
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, backgroundColor: borderColor, flexShrink: 0 }} />

      {/* Share buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 10px",
            backgroundColor: "#25D36620",
            color: "#25D366",
            fontWeight: 700,
            fontSize: 11,
            borderRadius: 6,
            border: "1px solid #25D36644",
            textDecoration: "none",
            whiteSpace: "nowrap" as const,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {t.whatsapp}
        </a>
        <button onClick={copyLink} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 10px",
          backgroundColor: linkCopied ? "#10B98120" : "transparent",
          color: linkCopied ? "#10B981" : textMuted,
          fontWeight: 600,
          fontSize: 11,
          borderRadius: 6,
          border: `1px solid ${linkCopied ? "#10B981" : borderColor}`,
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap" as const,
        }}>
          🔗 {linkCopied ? t.linkCopied : t.copyLink}
        </button>
      </div>
    </div>
  );
}
