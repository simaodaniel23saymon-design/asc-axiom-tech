import type { Metadata } from "next";
import { ascBrand } from "@/lib/data/branding";
import HomePage from "@/components/home/HomePage";

const homeTitle = "ASC AXIOM TECH | A Base S\u00f3lida da Sua Performance Digital";
const homeDescription =
  "Desenvolvemos plataformas tecnol\u00f3gicas, sistemas robustos e solu\u00e7\u00f5es orientadas por IA, automa\u00e7\u00e3o, SaaS e Web3 para neg\u00f3cios, opera\u00e7\u00f5es e produtos com ambi\u00e7\u00e3o global.";
const socialImage = ascBrand.logo;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [
    "ASC Axiom Tech",
    "SaaS",
    "Intelig\u00eancia Artificial",
    "Automatiza\u00e7\u00e3o",
    "Web3",
    "Desenvolvimento de Software",
    "Consultoria IA",
    "Tecnologia em Angola",
  ],
  authors: [{ name: "ASC AXIOM TECH" }],
  creator: "ASC AXIOM TECH",
  publisher: "ASC AXIOM TECH",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homeTitle,
    description:
      "Desenvolvemos plataformas tecnol\u00f3gicas, sistemas robustos e solu\u00e7\u00f5es orientadas por IA, automa\u00e7\u00e3o, SaaS e Web3 para neg\u00f3cios com ambi\u00e7\u00e3o global.",
    url: "https://ascaxiomtech.com",
    siteName: "ASC AXIOM TECH",
    locale: "pt_AO",
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "ASC AXIOM TECH - Performance Digital",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASC AXIOM TECH | Performance Digital",
    description: "Sistemas robustos e solu\u00e7\u00f5es orientadas por IA, automa\u00e7\u00e3o, SaaS e Web3.",
    images: [socialImage],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Page() {
  return <HomePage />;
}
