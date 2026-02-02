import type { Metadata, Viewport } from "next";
import { Rajdhani, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Jhoom It - Spotify Gesture Controller",
  description: "Touchless music control interface powered by Computer Vision",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Jhoom It",
    description: "Control Spotify with hand gestures using MediaPipe and React.",
    siteName: "Jhoom It",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jhoom It",
    description: "Touchless music control interface.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rajdhani.variable} ${shareTechMono.variable} antialiased bg-black overflow-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
