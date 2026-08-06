import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.TEND_BASE_URL ?? "http://localhost:3000"),
  title: {
    default: "TEND — Persistent community stewardship",
    template: "%s · TEND",
  },
  description:
    "TEND remembers people, context, and the kind of community a creator is trying to build.",
  openGraph: {
    type: "website",
    siteName: "TEND",
    title: "TEND — Persistent community stewardship",
    description:
      "A persistent community steward that remembers context, proposes proportionate repair, and follows up.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TEND — Persistent community stewardship",
    description: "Moderation shouldn’t reset with every message.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17201b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
