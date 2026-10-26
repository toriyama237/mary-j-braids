import type { MetadataRoute } from "next";

// Permet d'« installer » l'application sur l'écran d'accueil du téléphone,
// avec son icône et une ouverture en plein écran (sans barre du navigateur).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mary J Braids — Gestion du salon",
    short_name: "Mary J Braids",
    description: "Clients, passages, fidélité et finances du salon Mary J Braids.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf6f2",
    theme_color: "#8a2846",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Nouveau passage",
        url: "/passages/nouveau",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      { name: "Clients", url: "/clients", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
