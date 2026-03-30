import "./globals.css";
import type { Metadata, Viewport } from "next";
import SwRegister from "./sw-register";

export const metadata: Metadata = {
  title: "Fintex",
  description: "Gestão financeira inteligente para bares e restaurantes",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fintex",
  },
};

export const viewport: Viewport = {
  themeColor: "#041328",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
