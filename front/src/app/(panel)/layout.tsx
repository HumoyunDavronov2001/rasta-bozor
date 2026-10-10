"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SESSIYA_HODISASI, useMalumot, yuborish } from "@/lib/api";
import { MenKontekst } from "@/lib/kontekst";
import { ROL_NOMI } from "@/lib/format";
import type { Bozor, MenJavobi } from "@/lib/turlar";
import { Aylanma, Xato } from "@/komponent/asos";
import { PastMenyu } from "@/komponent/mobil";

const MENYU = [
  { yol: "/", nom: "Boshqaruv paneli", belgi: "panel" },
  { yol: "/tezkor", nom: "Tezkor (mobil)", belgi: "tezkor" },
  { yol: "/chekchi", nom: "Chekchi (mobil)", belgi: "chek" },
  { yol: "/plan", nom: "Bozor plani", belgi: "plan" },
  { yol: "/rastalar", nom: "Rastalar", belgi: "rasta" },
  { yol: "/ijarachilar", nom: "Ijarachilar", belgi: "odam" },
  { yol: "/shartnomalar", nom: "Shartnomalar", belgi: "hujjat" },
  { yol: "/arizalar", nom: "Arizalar", belgi: "navbat" },
  { yol: "/tolovlar", nom: "To'lovlar", belgi: "pul" },
  { yol: "/kassa", nom: "Kassa", belgi: "kassa" },
  { yol: "/tariflar", nom: "Tariflar", belgi: "hisob" },
  { yol: "/kameralar", nom: "Kameralar", belgi: "kamera" },
  { yol: "/belgilar", nom: "Belgilar", belgi: "bayroq" },
  { yol: "/analitika", nom: "Analitika", belgi: "grafik" },
  { yol: "/sozlama", nom: "Sozlamalar", belgi: "sozlama" },
];

export default function PanelKarkasi({ children }: { children: React.ReactNode }) {
  const yonaltir = useRouter();
  const yol = usePathname();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<MenJavobi>("/api/men");
  const bozorlarJavob = useMalumot<{ bozorlar: Bozor[] }>(malumot?.men ? "/api/bozorlar" : null);
  const [bozorId, setBozorId] = useState<number | null>(null);
  const [menyuOchiq, setMenyuOchiq] = useState(false);

  const men = malumot?.men ?? null;

  useEffect(() => {
    if (yuklanmoqda || men) return;
    yonaltir.replace(malumot?.sessiya_tugadi ? "/kirish?sabab=sessiya" : "/kirish");
  }, [yuklanmoqda, men, malumot, yonaltir]);

  // Ish paytida sessiya tugasa (12 soat yoki admin parolni almashtirsa) —
  // xato matni o'rniga kirish sahifasiga olib chiqamiz.
  useEffect(() => {
    const ishlov = () => yonaltir.replace("/kirish?sabab=sessiya");
    window.addEventListener(SESSIYA_HODISASI, ishlov);
    return () => window.removeEventListener(SESSIYA_HODISASI, ishlov);
  }, [yonaltir]);


  if (yuklanmoqda) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-xira">
        <Aylanma /> Yuklanmoqda…
      </div>
    );
  }
  if (xato) {
    return <div className="mx-auto max-w-lg p-8"><Xato matn={xato} qayta={qayta} /></div>;
  }
  if (!men) return null;

  const bozorlar = bozorlarJavob.malumot?.bozorlar ?? [];
  const tanlangan = men.bozor ? men.bozor.id : bozorId;

  async function chiqish() {
    try { await yuborish("/api/chiqish"); } catch { /* baribir chiqamiz */ }
    yonaltir.replace("/kirish");
  }

  return (
    <MenKontekst.Provider value={{
      men, bozorlar, bozorId: tanlangan,
      bozorTanla: setBozorId,
      bozorSorov: tanlangan ? `bozor=${tanlangan}` : "",
      yangila: qayta,
    }}>
      <div className="min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
        {/* Yon menyu */}
        {/* Katta ekranda menyu YOPISHIB TURADI: sahifa pastga tushsa ham joyida qoladi.
            Buning uchun `sticky` + `h-screen` + `self-start` kerak — grid elementi
            sukut bo'yicha cho'ziladi va sticky ishlamay qoladi. Menyu ichi flex ustun:
            ro'yxat uzun bo'lsa o'zi aylanadi, foydalanuvchi bloki pastda qoladi. */}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r
                           border-chiziq bg-karta transition-transform
                           lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start
                           ${menyuOchiq ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-chiziq px-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-asos text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M2 9.5 4 4h16l2 5.5M4 12v8h16v-8M9.5 20v-5h5v5" stroke="currentColor"
                      strokeWidth="1.9" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-none tracking-tight">RASTA</p>
              <p className="mt-0.5 text-[11px] text-xira">bozor boshqaruvi</p>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {MENYU.map((m) => {
              const faol = m.yol === "/" ? yol === "/" : yol.startsWith(m.yol);
              return (
                <Link key={m.yol} href={m.yol} onClick={() => setMenyuOchiq(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition
                                  ${faol ? "bg-asos-och text-asos" : "text-matn hover:bg-fon"}`}>
                  <Nishon nom={m.belgi} />
                  {m.nom}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-chiziq p-3">
            <p className="truncate text-[13px] font-medium">{men.fio}</p>
            <p className="text-[11.5px] text-xira">{ROL_NOMI[men.rol]}</p>
            {men.bozor && <p className="mt-0.5 truncate text-[11.5px] text-xira">{men.bozor.nomi}</p>}
            <button onClick={chiqish}
                    className="mt-2 w-full rounded-lg border border-chiziq px-3 py-1.5 text-[13px] hover:bg-fon">
              Chiqish
            </button>
          </div>
        </aside>

        {menyuOchiq && (
          <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMenyuOchiq(false)} />
        )}

        <div className="min-w-0">
          {/* Yuqori panel */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-chiziq bg-karta/95 px-4 backdrop-blur">
            <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                                      bg-asos text-white lg:hidden" aria-label="Boshqaruv paneli">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M2 9.5 4 4h16l2 5.5M4 12v8h16v-8M9.5 20v-5h5v5" stroke="currentColor"
                      strokeWidth="1.9" strokeLinejoin="round" />
              </svg>
            </Link>

            {men.bozor ? (
              <span className="truncate text-sm font-medium">{men.bozor.nomi}</span>
            ) : (
              // min-w-0 — telefonda uzun bozor nomi sarlavhani ekrandan chiqarib yubormasin
              <select value={bozorId ?? ""} onChange={(e) => setBozorId(e.target.value ? Number(e.target.value) : null)}
                      aria-label="Bozor"
                      className="min-w-0 flex-1 truncate rounded-lg border border-chiziq bg-karta px-3 py-1.5 text-sm
                                 outline-none focus:border-asos sm:max-w-xs sm:flex-none">
                <option value="">Barcha bozorlar</option>
                {bozorlar.map((b) => <option key={b.id} value={b.id}>{b.nomi}</option>)}
              </select>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {men.rejim === "demo" && (
                <span className="rounded-md bg-sariq-och px-2 py-1 text-[11.5px] font-semibold text-sariq"
                      title={"Bazadagi ma'lumot namoyish uchun to'ldirilgan — haqiqiy emas"}>
                  <span className="sm:hidden">DEMO</span>
                  <span className="hidden sm:inline">{"DEMO MA'LUMOT"}</span>
                </span>
              )}
            </div>
          </header>

          {/* pb-20 — pastdagi mobil menyu kontentni yopib qolmasligi uchun */}
          <main className="p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
        </div>

        <PastMenyu men={men} menyuOch={() => setMenyuOchiq(true)} />
      </div>
    </MenKontekst.Provider>
  );
}

function Nishon({ nom }: { nom: string }) {
  const yollar: Record<string, React.ReactNode> = {
    panel: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
    plan: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></>,
    rasta: <><path d="M3 9.5 5 5h14l2 4.5M5 11v9h14v-9" /><path d="M10 20v-4h4v4" /></>,
    odam: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" /></>,
    hujjat: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></>,
    pul: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /></>,
    grafik: <><path d="M4 20V9M10 20V4M16 20v-7M22 20H2" /></>,
    kamera: <><path d="M3 7h4l2-2h6l2 2h4v12H3z" /><circle cx="12" cy="13" r="3.5" /></>,
    bayroq: <><path d="M5 21V4M5 4h11l-2 3.5L16 11H5" /></>,
    kassa: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 8V5h10v3M7 14h4" /></>,
    chek: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
    tezkor: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    navbat: <><path d="M4 6h16M4 12h10M4 18h7" /><circle cx="18.5" cy="15.5" r="3.2" /><path d="M18.5 14v1.7l1.2.8" /></>,
    hisob: <><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 7h8M8 11h3M8 15h3M14.5 11v5M12.5 13.5h4" /></>,
    sozlama: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" /></>,
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {yollar[nom]}
    </svg>
  );
}
