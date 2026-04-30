import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import SwRegister from "./sw-register";
import { LoadingProvider } from "@/lib/loading-store";
import GlobalLoadingOverlay from "@/components/global-loading-overlay";
import TapFeedback from "@/components/tap-feedback";

export const metadata: Metadata = {
  title: "Fintex",
  description: "Gestão financeira inteligente para bares e restaurantes",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
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
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />

        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "863fdabb-34de-4625-bb77-037371b5327c",
              });
            });
          `}
        </Script>

        <SwRegister />
        <TapFeedback />
        <LoadingProvider>
          <GlobalLoadingOverlay />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}