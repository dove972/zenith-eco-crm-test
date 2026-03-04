import { CommercialNav } from "@/components/layout/CommercialNav";

export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CommercialNav />
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
