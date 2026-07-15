import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.URL ?? "http://localhost:3000"),
  title: {
    default: "How Risky Is Today? · Delhi/NCR",
    template: "%s · How Risky Is Today?",
  },
  description:
    "An internal Delhi/NCR civic-risk prototype combining current conditions with location-filtered risk events.",
  applicationName: "How Risky Is Today?",
  openGraph: {
    title: "How Risky Is Today? · Delhi/NCR",
    description:
      "Read Delhi through current conditions, located risk events and civic-risk context.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#041014",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
