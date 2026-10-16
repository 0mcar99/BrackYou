import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "BrackYou — Adaptive Learning & Assessment Portal",
  description: "Knowledge-tracing adaptive curriculum, hardened code sandbox, and keystroke forensic telemetry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-textPrimary min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
