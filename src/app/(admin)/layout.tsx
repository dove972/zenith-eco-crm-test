"use client";

import { useState } from "react";
import { AdminNav, SidebarContext } from "@/components/layout/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-4 pt-6 lg:p-8">{children}</div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
