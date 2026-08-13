import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SparkLab — Il punto di gravità dell'innovazione italiana",
    short_name: "SparkLab",
    description:
      "La community dove studenti con idee incontrano studenti con competenze. Pubblica la tua startup, raccogli stelle, trova il tuo co-founder.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#f97316",
    lang: "it",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
