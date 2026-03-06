"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Plus, Receipt, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  {
    href: "/commercial/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/commercial/simulations",
    label: "Simulations",
    icon: FileText,
  },
  {
    href: "/commercial/simulations/new",
    label: "Nouveau",
    icon: Plus,
    accent: true,
  },
  {
    href: "/commercial/devis",
    label: "Devis",
    icon: Receipt,
  },
  {
    href: "/commercial/profil",
    label: "Profil",
    icon: User,
  },
];

export function CommercialNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#E0E0E0] bg-white shadow-card px-4">
        <div className="flex items-center gap-3">
          <Link href="/commercial/dashboard" className="flex items-center">
            <Image src="/logo-zenith.png" alt="Zenith Eco" width={120} height={44} className="object-contain" priority />
          </Link>
          <span className="text-xs font-medium text-[#888]">
            {profile?.first_name} {profile?.last_name}
          </span>
        </div>
        <button
          onClick={signOut}
          className="rounded-[8px] p-2 text-[#888] transition-colors hover:bg-[#F2F0ED] hover:text-[#464646]"
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E0E0E0] bg-white pb-safe">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/commercial/simulations" &&
                pathname.startsWith("/commercial/simulations") &&
                pathname !== "/commercial/simulations/new") ||
              (item.href === "/commercial/dashboard" &&
                pathname.startsWith("/commercial/dashboard")) ||
              (item.href === "/commercial/devis" &&
                pathname.startsWith("/commercial/devis"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                  item.accent && !isActive
                    ? "text-[#FA7800]"
                    : isActive
                      ? "text-[#FA7800] font-bold"
                      : "text-[#888]"
                )}
              >
                {item.accent ? (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FA7800] text-white shadow-md">
                    <item.icon className="h-5 w-5" />
                  </div>
                ) : (
                  <item.icon className="h-5 w-5" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
