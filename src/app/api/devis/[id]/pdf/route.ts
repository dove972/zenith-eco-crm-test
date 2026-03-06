import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generatePdfBuffer } from "@/lib/pdf/generateQuotePdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: devis, error: devisError } = await supabase
    .from("devis")
    .select("*")
    .eq("id", id)
    .single();

  if (devisError || !devis) {
    return NextResponse.json(
      { error: "Devis non trouvé" },
      { status: 404 }
    );
  }

  const { data: simulation, error: simError } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", devis.simulation_id)
    .single();

  if (simError || !simulation) {
    return NextResponse.json(
      { error: "Simulation non trouvée" },
      { status: 404 }
    );
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("first_name, last_name, address, postal_code, city, phone")
    .eq("id", simulation.client_id)
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Client non trouvé" },
      { status: 404 }
    );
  }

  const { data: commercial, error: comError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", simulation.commercial_id)
    .single();

  if (comError || !commercial) {
    return NextResponse.json(
      { error: "Commercial non trouvé" },
      { status: 404 }
    );
  }

  const [{ data: simProducts }, { data: devisLineProducts }] = await Promise.all([
    supabase
      .from("simulation_products")
      .select("quantity, unit_price, total_price, product:complementary_products(name, tva_rate)")
      .eq("simulation_id", simulation.id),
    supabase
      .from("complementary_products")
      .select("name, unit_price_sell, tva_rate, unit_label, sort_order, active, quantity_mode, inclusion_condition, devis_group, sheet_type_variant")
      .eq("is_devis_line", true)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const products = (simProducts || []).map((sp: any) => ({
    name: sp.product?.name || "Produit",
    quantity: sp.quantity,
    unit_price: sp.unit_price,
    total_price: sp.total_price,
    tva_rate: sp.product?.tva_rate ?? 2.1,
  }));

  const devisLineItems = (devisLineProducts || []).map((p: any) => ({
    name: p.name as string,
    unit_price_sell: p.unit_price_sell as number,
    tva_rate: p.tva_rate as number,
    unit_label: p.unit_label as string,
    sort_order: p.sort_order as number,
    active: p.active as boolean,
    quantity_mode: p.quantity_mode as "manual" | "fixed" | "surface",
    inclusion_condition: p.inclusion_condition as "always" | "needs_framework" | "eligible_109" | "eligible_106" | null,
    devis_group: p.devis_group as string | null,
    sheet_type_variant: p.sheet_type_variant as "acier" | "alu" | null,
  }));

  try {
    const pdfBuffer = await generatePdfBuffer({
      devis: {
        devis_number: devis.devis_number,
        created_at: devis.created_at,
        payment_mode: devis.payment_mode,
        payment_schedule: devis.payment_schedule,
        report_type: devis.report_type,
        financing_months: devis.financing_months,
        monthly_payment: devis.monthly_payment,
        deposit_amount: devis.deposit_amount,
        legal_mentions: devis.legal_mentions,
      },
      simulation: {
        sheet_type: simulation.sheet_type,
        needs_framework: simulation.needs_framework,
        surface_m2: simulation.surface_m2,
        total_ht: simulation.total_ht,
        total_tva: simulation.total_tva,
        total_ttc: simulation.total_ttc,
        remise_zenith_eco: simulation.remise_zenith_eco,
        prime_cee_106: simulation.prime_cee_106,
        prime_cee_109: simulation.prime_cee_109,
        prime_mpr_106: simulation.prime_mpr_106,
        prime_mpr_109: simulation.prime_mpr_109,
        reste_a_charge: simulation.reste_a_charge,
        already_isolated_106: simulation.already_isolated_106,
        already_isolated_109: simulation.already_isolated_109,
      },
      client,
      commercial,
      products,
      devisLineItems,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="devis-${devis.devis_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Erreur génération PDF :", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
