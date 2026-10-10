"use client";

/* Mobil qobiq — bozorda YURIB ishlaydigan odam uchun.
 *
 * Nega alohida: yig'uvchi bozor bo'ylab yuradi, bir qo'lida telefon, ikkinchi
 * qo'lida pul. Unga stol ustidagi jadval emas, YIRIK tugma va bitta ustunli
 * ro'yxat kerak. Shuning uchun:
 *   · pastda doimiy menyu (barmoq yetadigan joyda),
 *   · jadval o'rniga kartochka ro'yxati (yonga surish yo'q),
 *   · asosiy amal — «to'lov» — bir tegishda ochiladi.
 * Katta ekranda bularning hammasi yashiriladi va odatiy panel ko'rinadi.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { tolovQabulQiladi } from "@/lib/kontekst";
import type { Men } from "@/lib/turlar";

const NISHON: Record<string, ReactNode> = {
  tezkor: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  chek: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  kassa: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 8V5h10v3M7 14h4" /></>,
  plan: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></>,
  pul: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /></>,
  menyu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};

/** Pastdagi doimiy menyu — faqat telefonda ko'rinadi. */
export function PastMenyu({ men, menyuOch }: { men: Men; menyuOch: () => void }) {
  const yol = usePathname();
  const punktlar: { yol?: string; nom: string; belgi: string; amal?: () => void }[] = [
    { yol: "/tezkor", nom: "Tezkor", belgi: "tezkor" },
    // Chekchi — pul qabul qiladigan xodimning asosiy ekrani
    ...(tolovQabulQiladi(men)
      ? [{ yol: "/chekchi", nom: "Chek", belgi: "chek" },
         { yol: "/kassa", nom: "Kassa", belgi: "kassa" }]
      : [{ yol: "/plan", nom: "Plan", belgi: "plan" }]),
    { yol: "/tolovlar", nom: "To'lovlar", belgi: "pul" },
    { nom: "Menyu", belgi: "menyu", amal: menyuOch },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-chiziq
                    bg-karta/97 backdrop-blur lg:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
         aria-label="Asosiy menyu">
      {punktlar.map((p) => {
        const faol = p.yol && (p.yol === "/" ? yol === "/" : yol.startsWith(p.yol));
        const ichi = (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {NISHON[p.belgi]}
            </svg>
            <span className="text-[11px] leading-none">{p.nom}</span>
          </>
        );
        const sinf = `flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px]
                      ${faol ? "text-asos" : "text-xira"}`;
        return p.yol
          ? <Link key={p.nom} href={p.yol} className={sinf}>{ichi}</Link>
          : <button key={p.nom} onClick={p.amal} className={sinf}>{ichi}</button>;
      })}
    </nav>
  );
}

/** Mobil kartochka ro'yxati: jadval o'rniga bitta ustun.
 *  Katta ekranda yashiriladi — u yerda jadval o'qishga qulayroq. */
export function MobilRoyxat({ children, bosh }: { children: ReactNode; bosh?: ReactNode }) {
  return (
    <div className="space-y-2 sm:hidden">
      {children}
      {bosh}
    </div>
  );
}

/** Bitta kartochka. `ong` — o'ng tomondagi asosiy raqam (summa).
 *  Butun kartochka bosiladigan bo'lsa `havola` yoki `bos` beriladi. */
export function MobilKarta({ sarlavha, tavsif, ong, ongIzoh, belgi, havola, bos, amallar }: {
  sarlavha: ReactNode; tavsif?: ReactNode; ong?: ReactNode; ongIzoh?: ReactNode;
  belgi?: ReactNode; havola?: string; bos?: () => void; amallar?: ReactNode;
}) {
  const ichi = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[14.5px] font-medium">{sarlavha}</span>
          {belgi}
        </div>
        {tavsif && <div className="mt-0.5 text-[12.5px] text-xira">{tavsif}</div>}
      </div>
      {(ong || ongIzoh) && (
        <div className="shrink-0 text-right">
          <div className="raqam text-[15px] font-semibold">{ong}</div>
          {ongIzoh && <div className="text-[11.5px] text-xira">{ongIzoh}</div>}
        </div>
      )}
    </div>
  );

  const asos = "block w-full rounded-xl border border-chiziq bg-karta px-3.5 py-3 text-left";
  if (havola) return <Link href={havola} className={`${asos} active:bg-fon`}>{ichi}</Link>;
  if (bos) return <button onClick={bos} className={`${asos} active:bg-fon`}>{ichi}</button>;
  return (
    <div className={asos}>
      {ichi}
      {amallar && <div className="mt-2.5 flex flex-wrap gap-2">{amallar}</div>}
    </div>
  );
}

/** Ko'rsatkichlar telefonda ikki ustunli kichik plitka bo'lib turadi. */
export function MobilPlitkalar({ qatorlar }: {
  qatorlar: { nom: string; qiymat: ReactNode; rang?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:hidden">
      {qatorlar.map((q) => (
        <div key={q.nom} className="rounded-xl border border-chiziq bg-karta px-3 py-2.5">
          <p className="text-[11.5px] text-xira">{q.nom}</p>
          <p className={`raqam mt-0.5 text-[17px] font-semibold ${q.rang ?? ""}`}>{q.qiymat}</p>
        </div>
      ))}
    </div>
  );
}
