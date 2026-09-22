import type { Metadata } from "next";
import { ascBrand } from "@/lib/data/branding";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ascaxiomtech.com"),
  title: {
    default: "ASC AXIOM TECH",
    template: "%s | ASC AXIOM TECH",
  },
  applicationName: "ASC AXIOM TECH",
  authors: [{ name: "ASC AXIOM TECH" }],
  creator: "ASC AXIOM TECH",
  publisher: "ASC AXIOM TECH",
  icons: {
    icon: [{ url: ascBrand.icon, type: "image/svg+xml" }],
    shortcut: [ascBrand.icon],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7992581885872919"
          crossOrigin="anonymous"
        ></script>
      </head>
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
