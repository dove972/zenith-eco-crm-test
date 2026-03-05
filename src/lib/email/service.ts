import transporter, { FROM_ADDRESS } from "./transporter";
import { invitationTemplate } from "./templates/invitation";
import { devisTemplate } from "./templates/devis";
import { notificationTemplate } from "./templates/notification";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://zenith-eco-crm-test.vercel.app";

// ──────────────────────────────────────────────
// 1. Email d'invitation (nouvel utilisateur)
// ──────────────────────────────────────────────
export async function sendInvitationEmail(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const html = invitationTemplate({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      password: params.password,
      role: params.role,
      appUrl: APP_URL,
    });

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: params.email,
      subject: `Bienvenue chez ZENITH ECO - Vos identifiants de connexion`,
      html,
    });

    console.log(`[EMAIL] Invitation envoyée à ${params.email}`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`[EMAIL] Erreur envoi invitation à ${params.email}:`, message);
    return { success: false, error: message };
  }
}

// ──────────────────────────────────────────────
// 2. Email d'envoi de devis (au client)
// ──────────────────────────────────────────────
export async function sendDevisEmail(params: {
  clientEmail: string;
  clientFirstName: string;
  clientLastName: string;
  devisNumber: string;
  montantTotal: string;
  commercialName: string;
  commercialPhone?: string;
  description?: string;
  pdfBuffer?: Buffer;
  pdfUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const html = devisTemplate({
      clientFirstName: params.clientFirstName,
      clientLastName: params.clientLastName,
      devisNumber: params.devisNumber,
      montantTotal: params.montantTotal,
      commercialName: params.commercialName,
      commercialPhone: params.commercialPhone,
      description: params.description,
      appUrl: APP_URL,
    });

    const attachments: Array<{
      filename: string;
      content?: Buffer;
      path?: string;
    }> = [];

    if (params.pdfBuffer) {
      attachments.push({
        filename: `Devis_${params.devisNumber}_ZENITH_ECO.pdf`,
        content: params.pdfBuffer,
      });
    } else if (params.pdfUrl) {
      attachments.push({
        filename: `Devis_${params.devisNumber}_ZENITH_ECO.pdf`,
        path: params.pdfUrl,
      });
    }

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: params.clientEmail,
      subject: `Votre devis ZENITH ECO n\u00b0${params.devisNumber}`,
      html,
      attachments,
    });

    console.log(
      `[EMAIL] Devis ${params.devisNumber} envoyé à ${params.clientEmail}`
    );
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(
      `[EMAIL] Erreur envoi devis à ${params.clientEmail}:`,
      message
    );
    return { success: false, error: message };
  }
}

// ──────────────────────────────────────────────
// 3. Email de notification générique
// ──────────────────────────────────────────────
export async function sendNotificationEmail(params: {
  to: string;
  recipientName: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const html = notificationTemplate({
      recipientName: params.recipientName,
      title: params.title,
      message: params.message,
      ctaText: params.ctaText,
      ctaUrl: params.ctaUrl,
    });

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.title,
      html,
    });

    console.log(`[EMAIL] Notification envoyée à ${params.to}: ${params.title}`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`[EMAIL] Erreur notification à ${params.to}:`, message);
    return { success: false, error: message };
  }
}

// ──────────────────────────────────────────────
// 4. Vérification de la connexion SMTP
// ──────────────────────────────────────────────
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await transporter.verify();
    console.log("[EMAIL] Connexion SMTP vérifiée avec succès");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[EMAIL] Erreur connexion SMTP:", message);
    return { success: false, error: message };
  }
}
