export function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZENITH ECO</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0px;overflow:hidden;">${preheader}</span>` : ""}
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f7f6; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #166534 0%, #15803d 50%, #22c55e 100%); padding: 30px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px; letter-spacing: 0.5px; }
    .body { padding: 40px; color: #1f2937; line-height: 1.7; font-size: 15px; }
    .body h2 { color: #166534; font-size: 22px; margin: 0 0 20px; }
    .body p { margin: 0 0 16px; }
    .info-box { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .info-box p { margin: 6px 0; }
    .info-box strong { color: #166534; }
    .btn { display: inline-block; background: linear-gradient(135deg, #166534, #22c55e); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; }
    .btn:hover { opacity: 0.9; }
    .divider { height: 1px; background-color: #e5e7eb; margin: 28px 0; }
    .footer { background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
    .footer a { color: #166534; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { margin: 0 16px; }
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ZENITH ECO</h1>
        <p>Simulateur Toiture &amp; CRM</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ZENITH ECO - Tous droits r&eacute;serv&eacute;s</p>
        <p>Solutions &eacute;nerg&eacute;tiques &amp; r&eacute;novation en Guadeloupe</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
