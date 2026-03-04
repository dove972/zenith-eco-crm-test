import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  FileCheck,
  Users,
  Euro,
  PlusCircle,
  FileText,
  ChevronRight,
  Tag,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [simulationsRes, devisRes, commerciauxRes, caRes, recentSimsRes] =
    await Promise.all([
      supabase.from("simulations").select("*", { count: "exact", head: true }),
      supabase
        .from("devis")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepte"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "commercial")
        .eq("active", true),
      supabase
        .from("simulations")
        .select("reste_a_charge")
        .eq("status", "accepte"),
      supabase
        .from("simulations")
        .select("*, client:clients(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const totalSimulations = simulationsRes.count ?? 0;
  const devisAcceptes = devisRes.count ?? 0;
  const commerciauxActifs = commerciauxRes.count ?? 0;
  const chiffreAffaires = (caRes.data ?? []).reduce(
    (sum, row) => sum + (row.reste_a_charge ?? 0),
    0
  );
  const recentSimulations = recentSimsRes.data ?? [];

  return (
    <div className="space-y-8">
      {/* Header + CTA */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.6rem] font-extrabold text-[#464646]">Tableau de bord</h1>
          <p className="text-sm text-[#888] mt-1">
            Vue d&apos;ensemble de votre activité
          </p>
        </div>
        <Link
          href="/admin/simulations/new"
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#FA7800] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#e06e00] hover:shadow-lg active:scale-[0.98]"
        >
          <PlusCircle className="h-5 w-5" />
          Nouvelle simulation
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Simulations", value: totalSimulations, icon: BarChart3, color: "#FA7800" },
          { label: "Devis acceptés", value: devisAcceptes, icon: FileCheck, color: "#43A047" },
          { label: "Commerciaux", value: commerciauxActifs, icon: Users, color: "#1565C0" },
          { label: "Chiffre d'affaires", value: formatCurrency(chiffreAffaires), icon: Euro, color: "#FAA032" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[14px] bg-white p-6 shadow-card"
            style={{ borderTop: `4px solid ${kpi.color}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
            </div>
            <p className="font-heading text-[2rem] font-extrabold leading-none text-[#464646]">
              {typeof kpi.value === "number" ? kpi.value.toLocaleString("fr-FR") : kpi.value}
            </p>
            <p className="text-[13px] text-[#888] mt-2 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Raccourcis */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#464646]">Accès rapide</h2>
          {[
            { label: "Simulations", desc: "Toutes les simulations", href: "/admin/simulations", icon: FileText },
            { label: "Tarifs", desc: "Prix au m²", href: "/admin/tarifs", icon: Tag },
            { label: "Utilisateurs", desc: "Comptes et rôles", href: "/admin/utilisateurs", icon: Users },
            { label: "Paramètres", desc: "Barèmes, primes, crédit", href: "/admin/baremes-mpr", icon: Settings },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-4 rounded-[14px] bg-white p-4 shadow-card transition-all hover:-translate-y-px hover:shadow-md cursor-pointer">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FA7800]/8">
                  <item.icon className="h-5 w-5 text-[#FA7800]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#464646]">{item.label}</p>
                  <p className="text-xs text-[#888]">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#E0E0E0]" />
              </div>
            </Link>
          ))}
        </div>

        {/* Dernières simulations */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#464646]">Dernières simulations</h2>
            <Link
              href="/admin/simulations"
              className="text-xs font-bold text-[#FA7800] hover:underline"
            >
              Voir tout →
            </Link>
          </div>

          <div className="rounded-[14px] bg-white shadow-card overflow-hidden">
            {recentSimulations.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F5]">
                  <FileText className="h-6 w-6 text-[#E0E0E0]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#888]">
                  Aucune simulation
                </p>
                <p className="text-xs text-[#ccc] mt-1">
                  Créez votre première simulation
                </p>
              </div>
            ) : (
              recentSimulations.map((sim: Record<string, unknown>, i: number) => {
                const client = sim.client as {
                  first_name: string;
                  last_name: string;
                } | null;
                return (
                  <Link
                    key={sim.id as string}
                    href={`/admin/simulations/${sim.id}`}
                    className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-[#FAFAFA] ${
                      i > 0 ? "border-t border-[#F5F5F5]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-xs font-bold text-[#505050]">
                        {client
                          ? `${client.first_name[0]}${client.last_name[0]}`
                          : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#464646]">
                          {client
                            ? `${client.first_name} ${client.last_name}`
                            : "Client"}
                        </p>
                        <p className="text-xs text-[#888]">
                          {new Date(
                            sim.created_at as string
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-full bg-[#FA7800]/10 px-3 py-1 text-xs font-bold text-[#FA7800]">
                        {formatCurrency((sim.reste_a_charge as number) ?? 0)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#E0E0E0]" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
