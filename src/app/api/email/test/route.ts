import { NextResponse } from "next/server";
import { verifySmtpConnection, sendNotificationEmail } from "@/lib/email";

export async function GET() {
  try {
    // Vérifier la connexion SMTP
    const smtpCheck = await verifySmtpConnection();

    if (!smtpCheck.success) {
      return NextResponse.json(
        {
          success: false,
          smtp: false,
          error: smtpCheck.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      smtp: true,
      message: "Connexion SMTP OVH OK",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM_EMAIL,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Adresse email destinataire requise" },
        { status: 400 }
      );
    }

    const result = await sendNotificationEmail({
      to,
      recipientName: "Test",
      title: "Test email ZENITH ECO CRM",
      message:
        "Ceci est un email de test envoy&eacute; depuis la plateforme CRM ZENITH ECO. Si vous recevez cet email, la configuration SMTP est fonctionnelle !",
      ctaText: "Acc&eacute;der au CRM",
      ctaUrl:
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://zenith-eco-crm-test.vercel.app",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${to}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
