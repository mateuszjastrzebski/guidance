import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campaign Layer",
    short_name: "CampaignLayer",
    description: "Narracyjna warstwa kampanii TTRPG.",
    start_url: "/",
    display: "standalone",
    background_color: "#101113",
    theme_color: "#6d28d9",
    lang: "pl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
