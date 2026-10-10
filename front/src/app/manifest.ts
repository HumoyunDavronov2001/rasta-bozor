import type { MetadataRoute } from "next";

/** Telefonga «ilova» sifatida o'rnatish uchun (Add to Home screen).
 *  `display: standalone` — brauzer manzil satri ko'rinmaydi, ya'ni mobil
 *  ilovadan farqi bilinmaydi. Ikonka SVG: qo'shimcha fayl talab qilmaydi. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RASTA — bozor boshqaruvi",
    short_name: "RASTA",
    description: "Rasta va do'konlar, ijara to'lovlari, kassa smenasi va bozor plani.",
    start_url: "/tezkor",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6f5",
    theme_color: "#0f6b45",
    lang: "uz",
    icons: [
      { src: "/belgi.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/belgi-192.png", sizes: "192x192", type: "image/png" },
      { src: "/belgi-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
