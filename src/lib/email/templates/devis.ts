import { baseTemplate } from "./base";

interface DevisEmailData {
  clientFirstName: string;
  clientLastName: string;
  devisNumber: string;
  montantTotal: string;
  commercialName: string;
  commercialPhone?: string;
  description?: string;
  appUrl: string;
}

export function devisTemplate(data: DevisEmailData): string {
  const content = `
    <!-- Badge devis -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;padding:6px 18px;">
                <span style="color:#1e40af;font-size:13px;font-weight:600;">&#128196;&nbsp; Devis n&deg;${data.devisNumber}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Greeting -->
    <h2 style="color:#1a472a;font-size:22px;margin:0 0 8px;font-weight:700;">Bonjour ${data.clientFirstName} ${data.clientLastName},</h2>
    <p style="color:#4b5563;margin:0 0 24px;font-size:15px;line-height:1.6;">
      Nous avons le plaisir de vous transmettre votre devis pour votre projet de toiture et d'&eacute;nergie avec <strong style="color:#166534;">ZENITH ECO</strong>.
    </p>

    <!-- Devis details card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#fafdfb;border:1px solid #d1e7d9;border-radius:12px;padding:0;overflow:hidden;">

          <!-- Card header -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color:#166534;padding:12px 24px;">
                <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">&#128203;&nbsp; D&Eacute;TAILS DU DEVIS</span>
              </td>
            </tr>
          </table>

          <!-- Detail rows -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:20px 24px;">
            <tr>
              <td style="padding-bottom:14px;">
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;font-weight:600;">Num&eacute;ro de devis</p>
                <p style="color:#1a472a;font-size:16px;margin:0;font-weight:600;font-family:'Courier New',monospace;background-color:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px dashed #bbf7d0;">${data.devisNumber}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;font-weight:600;">Montant total TTC</p>
                <p style="color:#1a472a;font-size:20px;margin:0;font-weight:700;background-color:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px dashed #bbf7d0;">${data.montantTotal} &euro;</p>
              </td>
            </tr>
            ${data.description ? `
            <tr>
              <td>
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;font-weight:600;">Description</p>
                <p style="color:#374151;font-size:14px;margin:0;line-height:1.5;background-color:#f0fdf4;padding:8px 12px;border-radius:6px;border:1px dashed #bbf7d0;">${data.description}</p>
              </td>
            </tr>` : ""}
          </table>

        </td>
      </tr>
    </table>

    <p style="color:#4b5563;margin:0 0 24px;font-size:15px;line-height:1.6;">
      Vous trouverez le d&eacute;tail complet de votre devis en pi&egrave;ce jointe au format PDF.
    </p>

    <!-- Divider -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="height:1px;background:linear-gradient(to right,transparent,#d1d5db,transparent);"></td>
      </tr>
    </table>

    <!-- Contact card -->
    <h3 style="color:#374151;font-size:14px;margin:0 0 14px;font-weight:700;">&#128222; Votre conseiller</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#f8faf9;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td>
                <p style="color:#1a472a;font-size:15px;margin:0 0 6px;font-weight:700;">${data.commercialName}</p>
                ${data.commercialPhone ? `<p style="color:#4b5563;font-size:14px;margin:0 0 4px;">&#128222;&nbsp; ${data.commercialPhone}</p>` : ""}
                <p style="color:#4b5563;font-size:14px;margin:0;">&#9993;&nbsp; crm@zenitheco.fr</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Validity notice -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
          <p style="color:#92400e;font-size:12px;margin:0;line-height:1.5;">
            &#9200; <strong>Validit&eacute; :</strong> Ce devis est valable 30 jours &agrave; compter de sa date d'&eacute;mission.
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseTemplate(content, `Votre devis ZENITH ECO n\u00b0${data.devisNumber}`);
}
