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

const ROLE_EMOJI: Record<string, string> = {
  admin: "&#128272;",
  manager: "&#128202;",
  commercial: "&#128188;",
};

export function invitationTemplate(data: InvitationData): string {
  const roleLabel = ROLE_LABELS[data.role] || data.role;
  const roleEmoji = ROLE_EMOJI[data.role] || "&#9889;";

  const content = `
    <!-- Welcome badge -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:6px 18px;">
                <span style="color:#166534;font-size:13px;font-weight:600;">${roleEmoji}&nbsp; Bienvenue dans l'&eacute;quipe !</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Greeting -->
    <h2 style="color:#1a472a;font-size:22px;margin:0 0 8px;font-weight:700;">Bonjour ${data.firstName} ${data.lastName},</h2>
    <p style="color:#4b5563;margin:0 0 24px;font-size:15px;line-height:1.6;">
      Votre compte <strong style="color:#166534;">${roleLabel}</strong> a &eacute;t&eacute; cr&eacute;&eacute; sur la plateforme CRM ZENITH ECO. Vous pouvez d&egrave;s maintenant vous connecter avec les identifiants ci-dessous.
    </p>

    <!-- Credentials card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#fafdfb;border:1px solid #d1e7d9;border-radius:12px;padding:0;overflow:hidden;">

          <!-- Card header -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color:#166534;padding:12px 24px;">
                <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">&#128274;&nbsp; VOS IDENTIFIANTS DE CONNEXION</span>
              </td>
            </tr>
          </table>

          <!-- Credential rows -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:20px 24px;">
            <tr>
              <td style="padding-bottom:14px;">
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;font-weight:600;">Adresse email</p>
                <p style="color:#1a472a;font-size:16px;margin:0;font-weight:600;font-family:'Courier New',monospace;background-color:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px dashed #bbf7d0;">${data.email}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;font-weight:600;">Mot de passe provisoire</p>
                <p style="color:#1a472a;font-size:16px;margin:0;font-weight:600;font-family:'Courier New',monospace;background-color:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px dashed #bbf7d0;">${data.password}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;font-weight:600;">R&ocirc;le attribu&eacute;</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background-color:#dcfce7;border-radius:6px;padding:6px 14px;">
                      <span style="color:#166534;font-size:13px;font-weight:700;">${roleEmoji}&nbsp; ${roleLabel}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background:linear-gradient(135deg,#166534 0%,#15803d 100%);border-radius:10px;box-shadow:0 4px 14px rgba(22,101,52,0.3);">
                <a href="${data.appUrl}/login" target="_blank" style="display:inline-block;color:#ffffff;text-decoration:none;padding:16px 44px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                  Acc&eacute;der &agrave; mon espace &rarr;
                </a>
              </td>
            </tr>
          </table>
          <p style="color:#9ca3af;font-size:12px;margin:10px 0 0;">
            ${data.appUrl}/login
          </p>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="height:1px;background:linear-gradient(to right,transparent,#d1d5db,transparent);"></td>
      </tr>
    </table>

    <!-- Next steps -->
    <h3 style="color:#374151;font-size:14px;margin:0 0 14px;font-weight:700;">&#127919; Prochaines &eacute;tapes</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding-bottom:10px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#dcfce7;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#166534;">1</span>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;"><strong>Connectez-vous</strong> avec les identifiants ci-dessus</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:10px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#dcfce7;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#166534;">2</span>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;"><strong>Changez votre mot de passe</strong> d&egrave;s la premi&egrave;re connexion</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#dcfce7;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#166534;">3</span>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;"><strong>Commencez &agrave; cr&eacute;er</strong> vos simulations et devis</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Security notice -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
      <tr>
        <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
          <p style="color:#92400e;font-size:12px;margin:0;line-height:1.5;">
            &#128274; <strong>S&eacute;curit&eacute; :</strong> Ne partagez jamais vos identifiants. Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez cet email.
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseTemplate(content, `${data.firstName}, votre compte ZENITH ECO est pr\u00eat !`);
}
