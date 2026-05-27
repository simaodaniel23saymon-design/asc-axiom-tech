import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ASC Axiom Tech — A Base Sólida da Sua Performance Digital", template: "%s | ASC Axiom Tech" },
  description: "Desenvolvemos plataformas de tecnologia que transformam negócios africanos. Hubscuvala, AutomateAO e NzonChain — AI, automação e blockchain para África.",
  keywords: ["ASC Axiom Tech", "Hubscuvala", "AutomateAO", "NzonChain", "tecnologia Angola", "AI Africa", "SaaS Angola"],
  authors: [{ name: "Simão Mbulo" }],
  creator: "ASC Axiom Tech",
  openGraph: {
    title: "ASC Axiom Tech",
    description: "A base sólida da sua performance digital.",
    url: "https://ascaxiomtech.com",
    siteName: "ASC Axiom Tech",
    locale: "pt_PT",
    type: "website",
    /* [LOGO] og:image → coloca URL da imagem OG (1200×630px) */
  },
  twitter: { card: "summary_large_image", title: "ASC Axiom Tech", description: "A base sólida da sua performance digital." },
  /* [FAVICON] → substitui pelo teu favicon real em /public/ */
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
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
