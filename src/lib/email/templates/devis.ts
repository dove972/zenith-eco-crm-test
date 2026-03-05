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
    <h2>Votre devis ZENITH ECO</h2>
    <p>Bonjour <strong>${data.clientFirstName} ${data.clientLastName}</strong>,</p>
    <p>Nous avons le plaisir de vous transmettre votre devis pour votre projet de toiture/&eacute;nergie.</p>

    <div class="info-box">
      <p><strong>N&deg; de devis :</strong> ${data.devisNumber}</p>
      <p><strong>Montant total :</strong> ${data.montantTotal} &euro;</p>
      ${data.description ? `<p><strong>Description :</strong> ${data.description}</p>` : ""}
    </div>

    <p>Vous trouverez le d&eacute;tail complet de votre devis en pi&egrave;ce jointe au format PDF.</p>

    <div class="divider"></div>

    <p>Pour toute question concernant ce devis, n'h&eacute;sitez pas &agrave; contacter votre conseiller :</p>
    <div class="info-box">
      <p><strong>Conseiller :</strong> ${data.commercialName}</p>
      ${data.commercialPhone ? `<p><strong>T&eacute;l&eacute;phone :</strong> ${data.commercialPhone}</p>` : ""}
      <p><strong>Email :</strong> crm@zenitheco.fr</p>
    </div>

    <p style="color: #6b7280; font-size: 13px;">
      Ce devis est valable 30 jours &agrave; compter de sa date d'&eacute;mission.
    </p>
  `;

  return baseTemplate(content, `Votre devis ZENITH ECO n\u00b0${data.devisNumber}`);
}
