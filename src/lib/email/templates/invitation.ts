import { baseTemplate } from "./base";

interface InvitationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  appUrl: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  manager: "Manager",
  commercial: "Commercial",
};

export function invitationTemplate(data: InvitationData): string {
  const roleLabel = ROLE_LABELS[data.role] || data.role;

  const content = `
    <h2>Bienvenue chez ZENITH ECO !</h2>
    <p>Bonjour <strong>${data.firstName} ${data.lastName}</strong>,</p>
    <p>Votre compte a &eacute;t&eacute; cr&eacute;&eacute; sur la plateforme CRM ZENITH ECO. Voici vos identifiants de connexion :</p>

    <div class="info-box">
      <p><strong>Email :</strong> ${data.email}</p>
      <p><strong>Mot de passe :</strong> ${data.password}</p>
      <p><strong>R&ocirc;le :</strong> ${roleLabel}</p>
    </div>

    <p style="text-align: center;">
      <a href="${data.appUrl}/login" class="btn">Se connecter &rarr;</a>
    </p>

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 13px;">
      <strong>Important :</strong> Nous vous recommandons de changer votre mot de passe d&egrave;s votre premi&egrave;re connexion pour des raisons de s&eacute;curit&eacute;.
    </p>
    <p style="color: #6b7280; font-size: 13px;">
      Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, veuillez ignorer cet email.
    </p>
  `;

  return baseTemplate(content, "Vos identifiants de connexion ZENITH ECO");
}
