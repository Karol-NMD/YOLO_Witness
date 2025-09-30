import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CameraProvider } from "@/context/cameraContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Witness - Surveillance Intelligence",
  description: "Advanced AI-powered surveillance monitoring system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <CameraProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <main className="flex-1 bg-slate-950">{children}</main>
          </SidebarProvider>
        </CameraProvider>
      </body>
    </html>
  );
}
