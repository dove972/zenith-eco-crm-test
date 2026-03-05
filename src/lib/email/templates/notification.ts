import { baseTemplate } from "./base";

interface NotificationData {
  recipientName: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function notificationTemplate(data: NotificationData): string {
  const content = `
    <!-- Title -->
    <h2 style="color:#1a472a;font-size:22px;margin:0 0 8px;font-weight:700;">${data.title}</h2>
    <p style="color:#4b5563;margin:0 0 6px;font-size:15px;line-height:1.6;">
      Bonjour <strong style="color:#1a472a;">${data.recipientName}</strong>,
    </p>
    <p style="color:#4b5563;margin:0 0 28px;font-size:15px;line-height:1.6;">${data.message}</p>

    ${
      data.ctaText && data.ctaUrl
        ? `
    <!-- CTA Button -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background:linear-gradient(135deg,#166534 0%,#15803d 100%);border-radius:10px;box-shadow:0 4px 14px rgba(22,101,52,0.3);">
                <a href="${data.ctaUrl}" target="_blank" style="display:inline-block;color:#ffffff;text-decoration:none;padding:14px 40px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                  ${data.ctaText} &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
        : ""
    }

    <!-- Divider -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="height:1px;background:linear-gradient(to right,transparent,#d1d5db,transparent);"></td>
      </tr>
    </table>

    <!-- Auto-send notice -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
          <p style="color:#6b7280;font-size:12px;margin:0;line-height:1.5;">
            &#129302; Cet email a &eacute;t&eacute; envoy&eacute; automatiquement par la plateforme CRM ZENITH ECO.
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseTemplate(content, data.title);
}
