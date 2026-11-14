import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Money",
    short_name: "My Money",
    description:
      "A calm, private income and expense tracker. Bilingual Thai and English.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2eee3",
    theme_color: "#0b3c2d",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
