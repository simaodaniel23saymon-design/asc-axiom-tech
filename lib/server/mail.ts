import { Resend } from "resend";

export type SiteLang = "pt" | "en" | "es";
export type MailKind = "contact" | "investors";

type MailConfig = {
  from: string;
  to: string;
};

const DEFAULT_FROM = "hello@ascaxiomtech.com";
const DEFAULT_TO = "hello@ascaxiomtech.com";

export function normalizeLang(value: unknown): SiteLang {
  return value === "en" || value === "es" ? value : "pt";
}

export function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getMailConfig(kind: MailKind): { resend: Resend; config: MailConfig } {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  const to =
    (kind === "contact" ? process.env.RESEND_CONTACT_TO_EMAIL : process.env.RESEND_INVESTORS_TO_EMAIL) ||
    process.env.RESEND_TO_EMAIL ||
    DEFAULT_TO;

  return {
    resend: new Resend(apiKey),
    config: { from, to },
  };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderAdminEmail(title: string, intro: string, fields: Array<{ label: string; value: string }>) {
  const rows = fields
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #dbe4f0;background:#f8fbff;font-weight:700;color:#0f172a;width:180px;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border:1px solid #dbe4f0;color:#1e293b;">${escapeHtml(value || "-")}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:16px;padding:28px;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;margin-bottom:12px;">ASC Axiom Tech</div>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 24px;color:#475569;line-height:1.7;">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;border-spacing:0;">
          ${rows}
        </table>
      </div>
    </div>
  `;
}

export function renderAutoReply(title: string, body: string, ctaLabel: string, ctaHref: string) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:16px;padding:28px;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;margin-bottom:12px;">ASC Axiom Tech</div>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 24px;color:#475569;line-height:1.7;">${escapeHtml(body)}</p>
        <a href="${ctaHref}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">
          ${escapeHtml(ctaLabel)}
        </a>
      </div>
    </div>
  `;
}
