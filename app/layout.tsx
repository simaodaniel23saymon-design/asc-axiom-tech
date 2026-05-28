import type { Metadata } from "next";
import { ascBrand } from "@/lib/data/branding";
import "./globals.css";

const siteTitle = "ASC Axiom Tech | Consultoria em Desenvolvimento Tecnológico, IA, SaaS e Web3";
const siteDescription =
  "Empresa de consultoria em desenvolvimento tecnológico. Criamos sistemas robustos, soluções sob medida e produtos de IA, SaaS e Web3 com tecnologias de ponta.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ascaxiomtech.com"),
  title: { default: siteTitle, template: "%s | ASC Axiom Tech" },
  description: siteDescription,
  applicationName: "ASC Axiom Tech",
  keywords: [
    "ASC Axiom Tech",
    "consultoria em desenvolvimento tecnológico",
    "desenvolvimento de software sob medida",
    "sistemas robustos",
    "produtos de IA",
    "SaaS",
    "Web3",
    "tecnologia Angola",
    "consultoria tecnológica África",
  ],
  authors: [{ name: "Simão Mbulo" }],
  creator: "ASC Axiom Tech",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://www.ascaxiomtech.com",
    siteName: "ASC Axiom Tech",
    locale: "pt_PT",
    type: "website",
    images: [{ url: ascBrand.logo, alt: "ASC Axiom Tech" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ascBrand.logo],
  },
  alternates: { canonical: "https://www.ascaxiomtech.com" },
  icons: {
    icon: [{ url: ascBrand.icon, type: "image/svg+xml" }],
    shortcut: [ascBrand.icon],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <div className="ambient-wrap" aria-hidden="true">
          <div className="ambient-orbit" />
          <div className="ambient-stars" />
        </div>
        {children}
      </body>
    </html>
  );
}
