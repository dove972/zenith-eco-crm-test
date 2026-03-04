"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  {
    href: "/manager/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/manager/equipe",
    label: "Équipe",
    icon: Users,
  },
  {
    href: "/manager/profil",
    label: "Profil",
    icon: User,
  },
];

export function ManagerNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#E0E0E0] bg-white shadow-card px-4">
        <div className="flex items-center gap-3">
          <Link href="/manager/dashboard" className="flex items-center">
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
              (item.href !== "/manager/profil" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-[#FA7800] font-bold"
                    : "text-[#888]"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
