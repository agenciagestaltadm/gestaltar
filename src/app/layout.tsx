import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "GUESTALT AR | Realidade Aumentada",
  description:
    "Aponte para o quadro. Veja a imagem ganhar vida. Experiência de realidade aumentada com vídeos interativos.",
  keywords: [
    "AR",
    "realidade aumentada",
    "WebAR",
    "vídeo interativo",
    "GUESTALT",
  ],
  authors: [{ name: "Gestalt Comunicação" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "GUESTALT AR | Realidade Aumentada",
    description: "Aponte para o quadro. Veja a imagem ganhar vida.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "GUESTALT AR Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  // iOS specific meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GUESTALT AR",
    startupImage: [
      { url: "/icons/icon-512x512.png" },
    ],
  },
  // Prevent phone number detection
  formatDetection: {
    telephone: false,
  },
  // PWA specific
  applicationName: "GUESTALT AR",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // iOS safe area support
  viewportFit: "cover",
  // Theme color for mobile browsers
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${inter.variable}`}>
      <head>
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* iOS splash screens */}
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        
        {/* Prevent zoom on iOS input focus */}
        <style dangerouslySetInnerHTML={{ __html: `
          input, select, textarea { font-size: 16px; }
        `}} />
      </head>
      <body className="bg-guestalt-black text-guestalt-white antialiased">
        {children}
        
        {/* Service Worker Registration */}
        <Script id="service-worker-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            console.log('New version available!');
                          }
                        });
                      }
                    });
                  })
                  .catch(function(error) {
                    console.log('SW registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
