import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";

export const metadata: Metadata = {
  title: "Cakrawala CBT - Seleksi Nasional MAN Insan Cendekia",
  description:
    "Sistem Ujian Berbasis Komputer (CBT) Simulasi SNPDB MAN Insan Cendekia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <SiteLayoutWrapper>{children}</SiteLayoutWrapper>
      </body>
    </html>
  );
}
