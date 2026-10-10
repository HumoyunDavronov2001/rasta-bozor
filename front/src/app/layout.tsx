import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RASTA — bozorlarni raqamlashtirish",
  description: "Rasta va do'konlar reyestri, ijara shartnomalari, to'lovlar, bozor plani va analitika.",
  // Telefonda «ilova» bo'lib ochilishi uchun (Add to Home screen)
  appleWebApp: { capable: true, title: "RASTA", statusBarStyle: "default" },
  icons: { icon: "/belgi.svg", apple: "/belgi-192.png" },
};

/** Mobil qurilma uchun: yaqinlashtirish o'chirilmaydi (ko'rish qulayligi),
 *  lekin ilk ko'rinish qurilma kengligiga moslanadi. `viewportFit: cover` —
 *  iPhone da pastdagi menyu «xavfsiz hudud» ichida qoladi. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f6b45",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
