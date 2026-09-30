import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DepthProvider } from "@/components/Depth";
import { SiteHeader, TabBar } from "@/components/SiteChrome";
import { Footer } from "@/components/Footer";

const archivo = localFont({
  src: [
    { path: "./fonts/archivo-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/archivo-latin-ext.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "./fonts/geist-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/geist-mono-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/geist-mono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://humanfactorysettings.com"),
  title: {
    default: "Human Factory Settings · How your body works, made simple",
    template: "%s · Human Factory Settings",
  },
  description:
    "How your body works and how to keep it running well, in plain words and real 3D pictures. Free, with every fact checked and linked to its source.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Human Factory Settings",
    description: "You came with factory settings. See how you work, in plain words and real 3D pictures, and learn how to reset what drifted.",
    images: [{ url: "/img/home_desktop.jpg", width: 2880, height: 1800, alt: "A 3D human body: skeleton, organs, arteries and veins" }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${instrument.variable} ${geistMono.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <DepthProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <Footer />
          <TabBar />
        </DepthProvider>
      </body>
    </html>
  );
}
