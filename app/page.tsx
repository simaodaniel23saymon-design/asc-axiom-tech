import type { Metadata } from "next";
import { ascBrand } from "@/lib/data/branding";
import HomePage from "@/components/home/HomePage";

const homeTitle = "ASC AXIOM TECH | Tecnologia Construída para o Próximo Nível";
const homeDescription =
  "Construímos software, infraestrutura digital e sistemas inteligentes para empresas e produtos com ambição global — combinando IA, automação, SaaS, Web3 e segurança.";
const socialImage = ascBrand.logo;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [
    "ASC Axiom Tech",
    "Global Technology Company",
    "SaaS",
    "Inteligência Artificial",
    "Automação",
    "Web3",
    "Desenvolvimento de Software",
    "Consultoria IA",
    "Infraestrutura Digital",
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
      "Construímos software, infraestrutura digital e sistemas inteligentes para empresas e produtos com ambição global — combinando IA, automação, SaaS, Web3 e segurança.",
    url: "https://ascaxiomtech.com",
    siteName: "ASC AXIOM TECH",
    locale: "pt_PT",
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "ASC AXIOM TECH - Tecnologia Construída para o Próximo Nível",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASC AXIOM TECH | Tecnologia Construída para o Próximo Nível",
    description: "Software, infraestrutura digital e sistemas inteligentes para empresas com ambição global.",
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
