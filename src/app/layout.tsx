import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";

const friendlySans = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Construtiva",
  description:
    "Construtiva: gestão visual de obras com cronogramas editáveis, gráficos de Gantt e validação em campo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${friendlySans.variable} ${geistMono.variable} antialiased bg-surface text-foreground`}
      >
        <div className="relative min-h-screen bg-grid before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.08),transparent_60%)]">
          <div className="relative">{children}</div>
        </div>
      </body>
    </html>
  );
}
