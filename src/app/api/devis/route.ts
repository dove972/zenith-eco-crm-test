import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();

  const requiredFields = [
    "simulation_id",
    "payment_mode",
  ] as const;

  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Le champ ${field} est requis` },
        { status: 400 }
      );
    }
  }

  const { data: numberResult } = await supabase.rpc("generate_devis_number");

  const devisNumber =
    numberResult ||
    `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  const legalMentions = [
    "ZENITH ECO By ENRFREE",
    "32 rue du Bocage, FORT DE FRANCE",
    "SIRET : 901 309 518 00032",
    "NUM TVA : FR22901309518",
    "RCS : 901 309 518 R.C.S. Fort-de-France",
    "Tél : 0696 66 94 44",
  ].join("\n");

  const { data: devis, error } = await supabase
    .from("devis")
    .insert({
      simulation_id: body.simulation_id,
      devis_number: devisNumber,
      status: "brouillon",
      payment_mode: body.payment_mode,
      payment_schedule: body.payment_schedule || [],
      report_type: body.report_type || null,
      financing_months: body.financing_months || null,
      deposit_amount: body.deposit_amount || 0,
      monthly_payment: body.monthly_payment || null,
      legal_mentions: legalMentions,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase
    .from("simulations")
    .update({ status: "devis_envoye" })
    .eq("id", body.simulation_id);

  return NextResponse.json({ success: true, data: devis });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: "Les champs id et status sont requis" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("devis")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  if (data && (status === "accepte" || status === "refuse")) {
    await supabase
      .from("simulations")
      .update({ status })
      .eq("id", data.simulation_id);
  }

  return NextResponse.json({ success: true, data });
}
