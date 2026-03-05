const LOGO_URL =
  (process.env.NEXT_PUBLIC_APP_URL ||
    "https://zenith-eco-crm-test.vercel.app") + "/logo-zenith.png";

export function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ZENITH ECO</title>
  ${preheader ? `<!--[if !mso]><!--><span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span><!--<![endif]-->` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0f2f5;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(145deg,#1a472a 0%,#166534 40%,#15803d 100%);padding:28px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="ZENITH ECO" width="180" height="auto" style="display:block;margin:0 auto 12px;max-width:180px;height:auto;" />
              <table role="presentation" width="60" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="height:2px;background-color:rgba(255,255,255,0.3);border-radius:1px;"></td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;">Solutions &eacute;nerg&eacute;tiques &amp; R&eacute;novation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;color:#1f2937;line-height:1.7;font-size:15px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8faf9;padding:24px 40px;border-top:1px solid #e8ebe9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <img src="${LOGO_URL}" alt="ZENITH ECO" width="80" height="auto" style="display:block;margin:0 auto 10px;max-width:80px;height:auto;opacity:0.5;" />
                    <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;line-height:1.5;">&copy; ${new Date().getFullYear()} ZENITH ECO &mdash; Tous droits r&eacute;serv&eacute;s</p>
                    <p style="color:#b0b5b2;font-size:11px;margin:0;line-height:1.5;">Guadeloupe &bull; crm@zenitheco.fr</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Container -->

      </td>
    </tr>
  </table>
  <!-- /Wrapper -->

</body>
</html>`;
}
