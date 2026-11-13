import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learnova — Nigerian Digital School & Live Learning Platform",
  description:
    "Interactive live classrooms, WAEC, NECO & JAMB preparation, curriculum-aligned subjects, and Nova AI tutoring built for Nigerian students, teachers, and schools.",
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
      <body className="font-sans bg-[#F7F8FA] text-[#0F1F38] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
