"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Shield,
  Zap,
  CreditCard,
  Hammer,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  FileText,
  PlusCircle,
  User,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

const adminItems = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/tarifs", label: "Tarifs", icon: Tag },
  { href: "/admin/baremes-mpr", label: "Barèmes MPR", icon: Shield },
  { href: "/admin/primes-cee", label: "Primes CEE", icon: Zap },
  { href: "/admin/taux-credit", label: "Taux crédit", icon: CreditCard },
  { href: "/admin/couts-chantier", label: "Coûts chantier", icon: Hammer },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

const commercialItems = [
  { href: "/admin/simulations", label: "Simulations", icon: FileText },
  { href: "/admin/simulations/new", label: "Nouvelle simulation", icon: PlusCircle },
  { href: "/admin/profil", label: "Mon profil", icon: User },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  mini,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  mini: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={mini ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] transition-all duration-150",
        mini && "justify-center px-0",
        active
          ? "bg-[#FA7800] text-white font-semibold"
          : "text-white/60 hover:bg-white/8 hover:text-white font-medium"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!mini && <span className="truncate">{label}</span>}
      {mini && (
        <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-[#555] px-3 py-2 text-xs font-semibold text-white shadow-lg group-hover:block z-[60]">
          {label}
        </div>
      )}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();

  function checkActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/simulations") {
      return (
        pathname === "/admin/simulations" ||
        (pathname.startsWith("/admin/simulations/") && !pathname.endsWith("/new"))
      );
    }
    return (
      pathname === href ||
      (pathname.startsWith(href) &&
        !pathname.startsWith("/admin/simulations") &&
        !pathname.startsWith("/admin/profil"))
    );
  }

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex shrink-0 items-center h-[68px] border-b border-white/8", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/admin" className="block">
          <Image
            src="/logo-zenith.png"
            alt="Zenith Eco"
            width={collapsed ? 32 : 110}
            height={collapsed ? 18 : 60}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-0.5">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
            Administration
          </p>
        )}
        {adminItems.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            active={checkActive(item.href)}
            mini={collapsed}
            onClick={() => setMobileOpen(false)}
          />
        ))}

        <div className="my-4 h-px bg-white/8" />

        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
            Commercial
          </p>
        )}
        {commercialItems.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            active={checkActive(item.href)}
            mini={collapsed}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-white/8 px-3 py-4 space-y-2">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FA7800]/20 text-xs font-bold text-[#FA7800]">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="truncate text-[11px] text-white/35 capitalize">
                {profile.role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          title={collapsed ? "Déconnexion" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-white/40 transition-colors hover:bg-white/8 hover:text-white",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#E0E0E0] bg-white shadow-card px-4 lg:hidden">
        <Link href="/admin" className="flex items-center">
          <Image src="/logo-zenith.png" alt="Zenith Eco" width={120} height={44} className="object-contain" priority />
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 hover:bg-[#F2F0ED]">
          {mobileOpen ? <X className="h-5 w-5 text-[#464646]" /> : <Menu className="h-5 w-5 text-[#464646]" />}
        </button>
      </header>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#333] transition-all duration-200 lg:relative lg:shrink-0",
          collapsed ? "lg:w-[68px]" : "lg:w-[250px]",
          mobileOpen ? "translate-x-0 w-[250px]" : "-translate-x-full w-0 overflow-hidden lg:translate-x-0 lg:overflow-visible"
        )}
      >
        {navContent}

        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-[78px] z-[60] hidden h-7 w-7 items-center justify-center rounded-full bg-[#555] shadow-md border border-[#666] transition-colors hover:bg-[#FA7800] hover:border-[#FA7800] lg:flex"
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5 text-white" />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5 text-white" />
          )}
        </button>
      </aside>
    </>
  );
}
