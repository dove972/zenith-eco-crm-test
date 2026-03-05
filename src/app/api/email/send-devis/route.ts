import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDevisEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientEmail,
      clientFirstName,
      clientLastName,
      devisNumber,
      montantTotal,
      description,
      pdfUrl,
    } = body;

    if (!clientEmail || !clientFirstName || !clientLastName || !devisNumber) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Récupérer les infos du commercial
    const { data: commercialProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", user.id)
      .single();

    const commercialName = commercialProfile
      ? `${commercialProfile.first_name} ${commercialProfile.last_name}`
      : "Un conseiller ZENITH ECO";

    // Télécharger le PDF si URL fournie
    let pdfBuffer: Buffer | undefined;
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        if (pdfResponse.ok) {
          const arrayBuffer = await pdfResponse.arrayBuffer();
          pdfBuffer = Buffer.from(arrayBuffer);
        }
      } catch (e) {
        console.warn("[API] Impossible de télécharger le PDF:", e);
      }
    }

    const result = await sendDevisEmail({
      clientEmail,
      clientFirstName,
      clientLastName,
      devisNumber,
      montantTotal: montantTotal || "N/A",
      commercialName,
      commercialPhone: commercialProfile?.phone,
      description,
      pdfBuffer,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Erreur envoi email: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Devis envoyé à ${clientEmail}`,
    });
  } catch (error) {
    console.error("[API] Erreur send-devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
