import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import path from "path";

// ─── Types ───

export interface QuotePdfProps {
  devis: {
    devis_number: string;
    created_at: string;
    payment_mode: string;
    payment_schedule: any;
    report_type: string | null;
    financing_months: number | null;
    monthly_payment: number | null;
    deposit_amount: number;
    legal_mentions: string;
  };
  simulation: {
    sheet_type: string;
    needs_framework: boolean;
    surface_m2: number;
    total_ht: number;
    total_tva: number;
    total_ttc: number;
    remise_zenith_eco: number;
    prime_cee_106: number;
    prime_cee_109: number;
    prime_mpr_106: number;
    prime_mpr_109: number;
    reste_a_charge: number;
    already_isolated_106: boolean;
    already_isolated_109: boolean;
  };
  client: {
    first_name: string;
    last_name: string;
    address: string;
    postal_code: string;
    city: string;
    phone: string;
  };
  commercial: {
    first_name: string;
    last_name: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    tva_rate?: number;
  }>;
  devisLineItems: Array<{
    name: string;
    unit_price_sell: number;
    tva_rate: number;
    unit_label: string;
    sort_order: number;
    active: boolean;
    quantity_mode: "manual" | "fixed" | "surface";
    inclusion_condition: "always" | "needs_framework" | "eligible_109" | "eligible_106" | null;
    devis_group: string | null;
    sheet_type_variant: "acier" | "alu" | null;
  }>;
}

// ─── Internal types ───

interface LineItem {
  label: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
  ht: number;
  tva: number;
  ttc: number;
}

interface ItemGroup {
  title: string;
  items: LineItem[];
  subtotalHt: number;
  subtotalTva: number;
  subtotalTtc: number;
}

// ─── Formatting helpers ───

function fmt(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${formatted},${decPart} €`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function fmtRate(rate: number): string {
  return rate.toFixed(1).replace(".", ",") + "%";
}

// ─── Line item builders ───

function makeLine(
  label: string,
  qty: number,
  pu: number,
  tvaRate: number
): LineItem {
  const ttc = qty * pu;
  const tva = ttc * (tvaRate / 100);
  const ht = ttc - tva;
  return { label, quantity: qty, unitPrice: pu, tvaRate, ht, tva, ttc };
}

function makeGroup(title: string, items: LineItem[]): ItemGroup {
  return {
    title,
    items,
    subtotalHt: items.reduce((s, i) => s + i.ht, 0),
    subtotalTva: items.reduce((s, i) => s + i.tva, 0),
    subtotalTtc: items.reduce((s, i) => s + i.ttc, 0),
  };
}

function buildGroups(props: QuotePdfProps): ItemGroup[] {
  const { simulation, products, devisLineItems } = props;
  const { sheet_type, needs_framework, surface_m2 } = simulation;
  const groups: ItemGroup[] = [];

  // Filter by active + sheet_type_variant only (keep all inclusion conditions)
  const applicable = devisLineItems
    .filter((item) => item.active)
    .filter((item) => {
      if (item.sheet_type_variant && item.sheet_type_variant !== sheet_type) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  // Group by devis_group
  const groupMap = new Map<string, typeof applicable>();
  for (const item of applicable) {
    const groupName = item.devis_group || "Autres";
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }
    groupMap.get(groupName)!.push(item);
  }

  // Build ItemGroup[] — items whose inclusion_condition is not met get quantity = 0
  for (const [groupName, items] of groupMap) {
    const lines = items.map((item) => {
      const conditionMet = (() => {
        switch (item.inclusion_condition) {
          case "always":
            return true;
          case "needs_framework":
            return needs_framework;
          case "eligible_109":
            return !simulation.already_isolated_109;
          case "eligible_106":
            return !simulation.already_isolated_106;
          default:
            return true;
        }
      })();

      let quantity = 0;
      if (conditionMet) {
        quantity = item.quantity_mode === "surface" ? surface_m2 : 1;
      }
      return makeLine(item.name, quantity, item.unit_price_sell, item.tva_rate);
    });
    groups.push(makeGroup(groupName, lines));
  }

  // Add complementary products group at the end
  if (products.length > 0) {
    groups.push(
      makeGroup(
        "Produits annexes",
        products.map((p) =>
          makeLine(p.name, p.quantity, p.unit_price, p.tva_rate ?? 2.1)
        )
      )
    );
  }

  return groups;
}

// ─── Colors ───

const ORANGE = "#FA7800";
const ORANGE_LIGHT = "#FFF5EB";
const DARK = "#464646";
const GRAY = "#888888";
const GRAY_LIGHT = "#F5F5F5";
const GRAY_BORDER = "#E0E0E0";
const GREEN = "#43A047";
const WHITE = "#FFFFFF";

// ─── Styles ───

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: DARK,
    paddingTop: 25,
    paddingBottom: 45,
    paddingHorizontal: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: ORANGE,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  companyInfo: {},
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    letterSpacing: 1,
  },
  companySubtitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Oblique",
    color: DARK,
    marginBottom: 3,
  },
  companyDetail: {
    fontSize: 7,
    color: GRAY,
    lineHeight: 1.4,
  },
  devisInfoBox: {
    alignItems: "flex-end",
    paddingTop: 2,
  },
  devisTag: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    backgroundColor: ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    marginBottom: 6,
  },
  devisNumber: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },
  devisInfoLine: {
    fontSize: 7.5,
    color: GRAY,
    marginBottom: 1.5,
  },

  // Client
  clientSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: ORANGE_LIGHT,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
  },
  clientTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    marginBottom: 5,
    textTransform: "uppercase" as any,
    letterSpacing: 0.5,
  },
  clientLine: {
    fontSize: 8.5,
    marginBottom: 1.5,
    lineHeight: 1.4,
  },
  clientLabel: {
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },

  // Table
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ORANGE,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderText: {
    color: WHITE,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as any,
  },
  groupHeader: {
    flexDirection: "row",
    backgroundColor: "#FDE8CD",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_BORDER,
  },
  groupHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_BORDER,
  },
  tableRowAlt: {
    backgroundColor: GRAY_LIGHT,
  },
  subtotalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: "#FFF0DD",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },

  colDesignation: { width: "42%", paddingRight: 4 },
  colQ: { width: "7%", textAlign: "center" },
  colPU: { width: "12%", textAlign: "right", paddingRight: 4 },
  colTVA: { width: "9%", textAlign: "center" },
  colHT: { width: "15%", textAlign: "right", paddingRight: 4 },
  colTTC: { width: "15%", textAlign: "right" },

  cellText: { fontSize: 7 },
  cellTextBold: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Totals
  totalsSection: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 260,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_BORDER,
  },
  totalRowHighlight: {
    backgroundColor: ORANGE_LIGHT,
  },
  totalRowFinal: {
    backgroundColor: ORANGE,
    borderBottomWidth: 0,
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  totalValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "right",
  },
  totalLabelFinal: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  totalValueFinal: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "right",
  },
  primeLabel: {
    fontSize: 8,
    color: GREEN,
    fontFamily: "Helvetica-Oblique",
  },
  primeValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textAlign: "right",
  },

  // Financing
  financingSection: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: DARK,
    borderRadius: 6,
  },
  financingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  financingTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    textTransform: "uppercase" as any,
    letterSpacing: 0.5,
  },
  financingMonthly: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
  },
  financingPerMonth: {
    fontSize: 8,
    color: "#AAAAAA",
  },
  financingDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  financingDetailLabel: {
    fontSize: 8,
    color: "#AAAAAA",
  },
  financingDetailValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },

  // Payment
  paymentSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: ORANGE,
    textTransform: "uppercase" as any,
    letterSpacing: 0.5,
  },
  paymentLine: {
    fontSize: 8,
    marginBottom: 1.5,
    lineHeight: 1.4,
    color: DARK,
  },
  bankDetails: {
    marginTop: 6,
    padding: 8,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: ORANGE,
  },
  bankLine: {
    fontSize: 7.5,
    marginBottom: 1,
    lineHeight: 1.4,
    color: DARK,
  },

  // Legal
  legalText: {
    fontSize: 6.5,
    color: GRAY,
    lineHeight: 1.5,
    marginBottom: 8,
  },

  // Signature
  signatureSection: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureCol: {
    width: "45%",
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },
  signatureBox: {
    height: 55,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 3,
    padding: 6,
  },
  signatureHint: {
    fontSize: 7,
    color: GRAY,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 6.5,
    color: GRAY,
    borderTopWidth: 1,
    borderTopColor: ORANGE,
    paddingTop: 5,
  },
});

const PAYMENT_MODE_LABELS: Record<string, string> = {
  credit_moderne: "Crédit Moderne",
  fonds_propres_banque: "Fonds propres (Banque)",
  fonds_propres_cheque: "Fonds propres (Chèque)",
  virement: "Virement",
  comptant: "Comptant",
  multipaiement: "Multi-paiement",
  financement: "Financement",
  cheque: "Chèque",
  especes: "Espèces",
};

// ─── PDF Document ───

export function QuotePdfDocument(props: QuotePdfProps) {
  const { devis, simulation, client, commercial } = props;
  const groups = buildGroups(props);

  const brutTotalHt = groups.reduce((s, g) => s + g.subtotalHt, 0);
  const brutTotalTva = groups.reduce((s, g) => s + g.subtotalTva, 0);
  const brutTotalTtc = groups.reduce((s, g) => s + g.subtotalTtc, 0);

  const totalPrimesCee = simulation.prime_cee_106 + simulation.prime_cee_109;
  const totalPrimesMpr = simulation.prime_mpr_106 + simulation.prime_mpr_109;
  const totalPrimes = totalPrimesCee + totalPrimesMpr;

  const logoPath = path.join(process.cwd(), "public", "logo-zenith.png");

  const hasFinancing =
    (devis.payment_mode === "financement" || devis.payment_mode === "credit_moderne") &&
    devis.monthly_payment != null &&
    devis.financing_months != null;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image style={s.logo} src={logoPath} />
            <View style={s.companyInfo}>
              <Text style={s.companyName}>ZENITH ECO</Text>
              <Text style={s.companySubtitle}>By ENRFREE</Text>
              <Text style={s.companyDetail}>32 rue du Bocage</Text>
              <Text style={s.companyDetail}>97200 FORT DE FRANCE</Text>
              <Text style={s.companyDetail}>Tél : 0696 66 94 44</Text>
              <Text style={s.companyDetail}>
                SIRET : 901 309 518 00032
              </Text>
            </View>
          </View>
          <View style={s.devisInfoBox}>
            <Text style={s.devisTag}>DEVIS</Text>
            <Text style={s.devisNumber}>{devis.devis_number}</Text>
            <Text style={s.devisInfoLine}>
              Date : {fmtDate(devis.created_at)}
            </Text>
            <Text style={s.devisInfoLine}>
              Validité : 30 jours
            </Text>
            <Text style={s.devisInfoLine}>
              Commercial : {commercial.first_name} {commercial.last_name}
            </Text>
          </View>
        </View>

        {/* ── Client ── */}
        <View style={s.clientSection}>
          <Text style={s.clientTitle}>Client</Text>
          <Text style={s.clientLine}>
            <Text style={s.clientLabel}>Nom : </Text>
            {client.first_name} {client.last_name}
          </Text>
          <Text style={s.clientLine}>
            <Text style={s.clientLabel}>Adresse : </Text>
            {client.address}, {client.postal_code} {client.city}
          </Text>
          <Text style={s.clientLine}>
            <Text style={s.clientLabel}>Tél : </Text>
            {client.phone}
          </Text>
        </View>

        {/* ── Financing (prominent, before table) ── */}
        {hasFinancing && (
          <View style={s.financingSection} wrap={false}>
            <View style={s.financingHeader}>
              <View>
                <Text style={s.financingTitle}>Votre financement</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.financingMonthly}>
                  {fmt(devis.monthly_payment!)}
                </Text>
                <Text style={s.financingPerMonth}>
                  par mois sur {devis.financing_months} mois
                </Text>
              </View>
            </View>
            <View style={s.financingDetailRow}>
              <Text style={s.financingDetailLabel}>Report</Text>
              <Text style={s.financingDetailValue}>
                {devis.report_type === "30j" ? "30 jours" : "90 jours"}
              </Text>
            </View>
            <View style={s.financingDetailRow}>
              <Text style={s.financingDetailLabel}>Durée</Text>
              <Text style={s.financingDetailValue}>
                {devis.financing_months} mois (
                {Math.floor(devis.financing_months! / 12)} ans
                {devis.financing_months! % 12 > 0
                  ? ` ${devis.financing_months! % 12} mois`
                  : ""}
                )
              </Text>
            </View>
            {devis.deposit_amount > 0 && (
              <View style={s.financingDetailRow}>
                <Text style={s.financingDetailLabel}>Acompte</Text>
                <Text style={s.financingDetailValue}>
                  {fmt(devis.deposit_amount)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Tableau des postes ── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <View style={s.colDesignation}>
              <Text style={s.tableHeaderText}>Désignation</Text>
            </View>
            <View style={s.colQ}>
              <Text style={s.tableHeaderText}>Qté</Text>
            </View>
            <View style={s.colPU}>
              <Text style={s.tableHeaderText}>P.U.</Text>
            </View>
            <View style={s.colTVA}>
              <Text style={s.tableHeaderText}>TVA</Text>
            </View>
            <View style={s.colHT}>
              <Text style={s.tableHeaderText}>Montant HT</Text>
            </View>
            <View style={s.colTTC}>
              <Text style={s.tableHeaderText}>Montant TTC</Text>
            </View>
          </View>

          {groups.map((group, gi) => (
            <View key={`g-${gi}`} wrap={false}>
              <View style={s.groupHeader}>
                <Text style={s.groupHeaderText}>{group.title}</Text>
              </View>

              {group.items.map((item, ii) => (
                <View
                  key={`i-${gi}-${ii}`}
                  style={[s.tableRow, ii % 2 === 1 && s.tableRowAlt]}
                >
                  <View style={s.colDesignation}>
                    <Text style={s.cellText}>{item.label}</Text>
                  </View>
                  <View style={s.colQ}>
                    <Text style={s.cellText}>{item.quantity}</Text>
                  </View>
                  <View style={s.colPU}>
                    <Text style={s.cellText}>{fmt(item.unitPrice)}</Text>
                  </View>
                  <View style={s.colTVA}>
                    <Text style={s.cellText}>{fmtRate(item.tvaRate)}</Text>
                  </View>
                  <View style={s.colHT}>
                    <Text style={s.cellText}>{fmt(item.ht)}</Text>
                  </View>
                  <View style={s.colTTC}>
                    <Text style={s.cellText}>{fmt(item.ttc)}</Text>
                  </View>
                </View>
              ))}

              <View style={s.subtotalRow}>
                <View style={s.colDesignation}>
                  <Text style={s.cellTextBold}>Sous-total</Text>
                </View>
                <View style={s.colQ}>
                  <Text style={s.cellText} />
                </View>
                <View style={s.colPU}>
                  <Text style={s.cellText} />
                </View>
                <View style={s.colTVA}>
                  <Text style={s.cellText} />
                </View>
                <View style={s.colHT}>
                  <Text style={s.cellTextBold}>
                    {fmt(group.subtotalHt)}
                  </Text>
                </View>
                <View style={s.colTTC}>
                  <Text style={s.cellTextBold}>
                    {fmt(group.subtotalTtc)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Totaux ── */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total HT</Text>
              <Text style={s.totalValue}>{fmt(brutTotalHt)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TVA</Text>
              <Text style={s.totalValue}>{fmt(brutTotalTva)}</Text>
            </View>
            <View style={[s.totalRow, s.totalRowHighlight]}>
              <Text style={s.totalLabel}>Total TTC</Text>
              <Text style={s.totalValue}>{fmt(brutTotalTtc)}</Text>
            </View>

            {simulation.remise_zenith_eco > 0 && (
              <View style={s.totalRow}>
                <Text style={s.primeLabel}>
                  Remise ZENITH ECO incluse
                </Text>
                <Text style={s.primeValue}>
                  - {fmt(simulation.remise_zenith_eco)}
                </Text>
              </View>
            )}

            <View style={[s.totalRow, s.totalRowFinal]}>
              <Text style={s.totalLabelFinal}>MONTANT À RÉGLER</Text>
              <Text style={s.totalValueFinal}>
                {fmt(simulation.total_ttc)}
              </Text>
            </View>

            {totalPrimes > 0 && (
              <View
                style={[
                  s.totalRow,
                  { backgroundColor: "#E8F5E9", borderBottomWidth: 0 },
                ]}
              >
                <Text style={s.primeLabel}>
                  Primes éligibles (versées après travaux)
                </Text>
                <Text style={s.primeValue}>{fmt(totalPrimes)}</Text>
              </View>
            )}

            {totalPrimesCee > 0 && (
              <View
                style={[
                  s.totalRow,
                  {
                    backgroundColor: "#E8F5E9",
                    paddingVertical: 2,
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <Text
                  style={[s.primeLabel, { fontSize: 7, paddingLeft: 8 }]}
                >
                  Primes CEE
                </Text>
                <Text style={[s.primeValue, { fontSize: 7 }]}>
                  {fmt(totalPrimesCee)}
                </Text>
              </View>
            )}

            {totalPrimesMpr > 0 && (
              <View
                style={[
                  s.totalRow,
                  {
                    backgroundColor: "#E8F5E9",
                    paddingVertical: 2,
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <Text
                  style={[s.primeLabel, { fontSize: 7, paddingLeft: 8 }]}
                >
                  Primes MPR
                </Text>
                <Text style={[s.primeValue, { fontSize: 7 }]}>
                  {fmt(totalPrimesMpr)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Modalités de règlement ── */}
        <View style={s.paymentSection} wrap={false}>
          <Text style={s.sectionTitle}>Modalités de règlement</Text>
          <Text style={s.paymentLine}>
            Mode de règlement :{" "}
            {PAYMENT_MODE_LABELS[devis.payment_mode] || devis.payment_mode}
          </Text>
          {devis.deposit_amount > 0 && (
            <Text style={s.paymentLine}>
              Acompte à la commande : {fmt(devis.deposit_amount)}
            </Text>
          )}

          {Array.isArray(devis.payment_schedule) &&
            devis.payment_schedule.length > 0 && (
              <View style={{ marginTop: 3 }}>
                <Text
                  style={[
                    s.paymentLine,
                    { fontFamily: "Helvetica-Bold" },
                  ]}
                >
                  Échéancier :
                </Text>
                {devis.payment_schedule.map(
                  (item: Record<string, any>, i: number) => (
                    <Text key={`ech-${i}`} style={s.paymentLine}>
                      {"  "}• {item.label || `Échéance ${i + 1}`} :{" "}
                      {fmt(item.amount || 0)}
                    </Text>
                  )
                )}
              </View>
            )}

          <View style={s.bankDetails}>
            <Text
              style={[s.bankLine, { fontFamily: "Helvetica-Bold" }]}
            >
              Coordonnées bancaires :
            </Text>
            <Text style={s.bankLine}>Banque : BRED MARTINIQUE</Text>
            <Text style={s.bankLine}>BIC : BREDFRPPXXX</Text>
            <Text style={s.bankLine}>
              IBAN : FR 76 1010 7003 8000 3300 6276 408
            </Text>
          </View>
        </View>

        {/* ── Mentions légales ── */}
        <View wrap={false}>
          <Text style={s.legalText}>{devis.legal_mentions}</Text>
          <Text style={s.legalText}>
            Conditions de paiement : Le paiement est dû à réception de
            facture, sauf conditions particulières mentionnées ci-dessus.
            Tout retard de paiement entraînera l&apos;application de
            pénalités de retard au taux annuel de 12% ainsi qu&apos;une
            indemnité forfaitaire de 40 € pour frais de recouvrement. Pas
            d&apos;escompte pour paiement anticipé.
          </Text>
        </View>

        {/* ── Signature ── */}
        <View style={s.signatureSection} wrap={false}>
          <View style={s.signatureCol}>
            <Text style={s.signatureTitle}>Le professionnel</Text>
            <View style={s.signatureBox}>
              <Text style={s.signatureHint}>
                ZENITH ECO By ENRFREE
              </Text>
            </View>
          </View>
          <View style={s.signatureCol}>
            <Text style={s.signatureTitle}>
              Le client (bon pour accord)
            </Text>
            <View style={s.signatureBox}>
              <Text style={s.signatureHint}>
                Lu et approuvé, bon pour accord
              </Text>
              <Text style={[s.signatureHint, { marginTop: 4 }]}>
                Date : _____ / _____ / _________
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `ZENITH ECO By ENRFREE — 32 rue du Bocage, 97200 Fort-de-France — SIRET : 901 309 518 00032 — TVA : FR22901309518 — RCS Fort-de-France — Page ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function generatePdfBuffer(
  props: QuotePdfProps
): Promise<Buffer> {
  return renderToBuffer(<QuotePdfDocument {...props} />);
}
