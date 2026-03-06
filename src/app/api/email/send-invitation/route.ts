import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification via le client SSR (cookies de session)
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Seul un admin peut envoyer des invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const result = await sendInvitationEmail({
      email,
      password: password || "TempPass123!",
      firstName,
      lastName,
      role,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Erreur envoi email: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Invitation envoyée" });
  } catch (error) {
    console.error("[API] Erreur send-invitation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
