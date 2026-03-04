"use client";

import { usePathname } from "next/navigation";

export function useSimulationBasePath() {
  const pathname = usePathname();
  return pathname.startsWith("/admin")
    ? "/admin/simulations"
    : "/commercial/simulations";
}
