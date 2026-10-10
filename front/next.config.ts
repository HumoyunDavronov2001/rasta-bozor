import type { NextConfig } from "next";

/** API — Python serveri (server/api.py, 8090-port).
 *  Rewrites tufayli front va API bitta manbada ko'rinadi:
 *  shu sabab CORS kerak emas va sessiya cookie'si yo'qolmaydi. */
const API = process.env.RASTA_API ?? "http://127.0.0.1:8090";

const nextConfig: NextConfig = {
  // Docker uchun: RASTA_STANDALONE=1 da faqat kerakli fayllar .next/standalone ga
  // yig'iladi (node_modules'siz). Mahalliy `next dev` / `next start` ga ta'sir qilmaydi.
  // DIQQAT: next.config yig'ish paytida o'qiladi — RASTA_API ham yig'ishda berilsin.
  output: process.env.RASTA_STANDALONE === "1" ? "standalone" : undefined,
  // Ishlab chiqish ko'rsatkichi (pastki chapdagi doira) mobil ko'rinishda
  // pastdagi menyuning birinchi tugmasini yopib qo'yadi — o'chirildi.
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:yol*", destination: `${API}/api/:yol*` }];
  },
};

export default nextConfig;
