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
    <h2>${data.title}</h2>
    <p>Bonjour <strong>${data.recipientName}</strong>,</p>
    <p>${data.message}</p>

    ${
      data.ctaText && data.ctaUrl
        ? `<p style="text-align: center;">
            <a href="${data.ctaUrl}" class="btn">${data.ctaText}</a>
          </p>`
        : ""
    }

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 13px;">
      Cet email a &eacute;t&eacute; envoy&eacute; automatiquement par la plateforme CRM ZENITH ECO.
    </p>
  `;

  return baseTemplate(content, data.title);
}
