import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "sonner";
import { PwaInstallPrompt } from "@/components/features/PwaInstallPrompt";
import { ServiceWorkerRegistration } from "@/components/features/ServiceWorkerRegistration";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ZENITH ECO - CRM",
  description: "CRM et simulateur de toiture pour commerciaux ZENITH ECO",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FA7800",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${nunitoSans.variable} ${outfit.variable} font-sans`}>
        {children}
        <PwaInstallPrompt />
        <Toaster richColors position="top-center" />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
