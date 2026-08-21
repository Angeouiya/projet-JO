import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buildify — Construction & Architecture",
  description: "Votre projet de construction, bien construit. Villas, duplex, immeubles, promotion immobilière, VRD, hydraulique.",
  keywords: ["construction", "BTP", "villa", "duplex", "immeuble", "Côte d'Ivoire", "Abidjan", "architecture"],
  authors: [{ name: "Buildify" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Buildify",
  },
  icons: {
    icon: "/icons/buildify-logo.png",
    apple: "/icons/buildify-logo.png",
  },
  openGraph: {
    title: "Buildify — Construction & Architecture",
    description: "Votre projet de construction, bien construit.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
