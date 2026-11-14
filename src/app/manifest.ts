import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Learnova — Nigerian Digital School & Live Learning Platform",
    short_name: "Learnova",
    description:
      "Interactive classrooms, WAEC/JAMB CBT drills, video lessons, study notebook, and Nova AI tutoring built for Nigerian students and schools.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F5F4FB",
    theme_color: "#070D24",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
