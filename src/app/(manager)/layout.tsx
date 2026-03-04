import { ManagerNav } from "@/components/layout/ManagerNav";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ManagerNav />
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
