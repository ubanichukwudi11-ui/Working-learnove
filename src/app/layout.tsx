import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/outfit/800.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/600-italic.css";
import "@fontsource/source-serif-4/700.css";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#070D24",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Learnova — Nigerian Digital School & Live Learning Platform",
  description:
    "Interactive live classrooms, WAEC, NECO & JAMB preparation, curriculum-aligned subjects, and Nova AI tutoring built for Nigerian students, teachers, and schools.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learnova",
  },
  icons: {
    icon: [
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Learnova — Nigerian Digital School & Live Learning Platform",
    description:
      "Interactive live classrooms, WAEC, NECO & JAMB preparation, curriculum-aligned subjects, and Nova AI tutoring built for Nigerian students, teachers, and schools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="landing-body bg-[#F5F4FB] text-[#0B1230] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
