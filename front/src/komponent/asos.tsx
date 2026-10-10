"use client";

import { cloneElement, isValidElement, ReactElement, ReactNode, useId } from "react";

/* ── Kartochka ────────────────────────────────────────────────────────── */
export function Kartochka({ sarlavha, ong, children, sinf = "" }: {
  sarlavha?: ReactNode; ong?: ReactNode; children: ReactNode; sinf?: string;
}) {
  return (
    // min-w-0: grid/flex ichida keng jadval kartochkani ekrandan kengaytirib
    // yubormasin (telefonda analitika 80px yonga siljirdi) — jadval o'zi aylanadi.
    <section className={`min-w-0 rounded-xl border border-chiziq bg-karta shadow-[0_1px_2px_rgba(16,24,40,.04)] ${sinf}`}>
      {(sarlavha || ong) && (
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-chiziq px-4 py-3">
          <h2 className="text-[15px] font-semibold text-matn">{sarlavha}</h2>
          {ong}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ── Ko'rsatkich kartochkasi ──────────────────────────────────────────── */
export function Korsatkich({ nom, qiymat, izoh, rang = "asos", belgi }: {
  nom: string; qiymat: ReactNode; izoh?: ReactNode; rang?: "asos" | "qizil" | "sariq" | "kok"; belgi?: ReactNode;
}) {
  const ranglar = {
    asos: "text-asos bg-asos-och", qizil: "text-qizil bg-qizil-och",
    sariq: "text-sariq bg-sariq-och", kok: "text-kok bg-kok-och",
  }[rang];
  return (
    <div className="rounded-xl border border-chiziq bg-karta p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-xira">{nom}</p>
        {belgi && <span className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${ranglar}`}>{belgi}</span>}
      </div>
      <p className="raqam mt-2 text-[26px] font-semibold leading-tight text-matn">{qiymat}</p>
      {izoh && <p className="mt-1 text-[12px] text-xira">{izoh}</p>}
    </div>
  );
}

/* ── Belgi (status) ───────────────────────────────────────────────────── */
const BELGI_RANG: Record<string, string> = {
  bosh: "bg-kok-och text-kok",
  band: "bg-asos-och text-asos",
  tamir: "bg-sariq-och text-sariq",
  bloklangan: "bg-neutral-200 text-neutral-700",
  faol: "bg-asos-och text-asos",
  tugagan: "bg-neutral-200 text-neutral-700",
  bekor: "bg-qizil-och text-qizil",
  qizil: "bg-qizil-och text-qizil",
  ogoh: "bg-sariq-och text-sariq",
  xolis: "bg-neutral-100 text-xira",
};

export function Belgi({ tur, children }: { tur: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium whitespace-nowrap ${BELGI_RANG[tur] ?? BELGI_RANG.xolis}`}>
      {children}
    </span>
  );
}

/* ── Tugma ────────────────────────────────────────────────────────────── */
export function Tugma({ children, uslub = "asosiy", kichik = false, sinf = "", ...qolgan }: {
  children: ReactNode; uslub?: "asosiy" | "ikkilamchi" | "xatarli" | "shaffof"; kichik?: boolean; sinf?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const uslublar = {
    asosiy: "bg-asos text-white hover:bg-asos-quyuq border-asos",
    ikkilamchi: "bg-karta text-matn hover:bg-fon border-chiziq",
    xatarli: "bg-qizil text-white hover:brightness-90 border-qizil",
    shaffof: "bg-transparent text-asos hover:bg-asos-och border-transparent",
  }[uslub];
  return (
    <button
      {...qolgan}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition
        disabled:cursor-not-allowed disabled:opacity-50
        ${kichik ? "px-2.5 py-1.5 text-[13px]" : "px-3.5 py-2 text-sm"} ${uslublar} ${sinf}`}
    >
      {children}
    </button>
  );
}

/* ── Maydon (input/select) ────────────────────────────────────────────── */
/** Yorliq va maydonni id orqali bog'laydi, izohni esa aria-describedby bilan
 *  ALOHIDA beradi — aks holda izoh matni maydon nomiga qo'shilib ketadi
 *  (skrinrider "Yangi parol kamida 8 belgi" deb o'qiydi). */
export function Maydon({ yorliq, izoh, children }: { yorliq: string; izoh?: ReactNode; children: ReactNode }) {
  const id = useId();
  const izohId = `${id}-izoh`;
  const bola = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id, "aria-describedby": izoh ? izohId : undefined,
      })
    : children;
  return (
    <div className="block">
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-matn">{yorliq}</label>
      {bola}
      {izoh && <span id={izohId} className="mt-1 block text-[12px] text-xira">{izoh}</span>}
    </div>
  );
}

const KIRITISH_ASOS =
  "rounded-lg border border-chiziq bg-karta px-3 py-2 text-sm text-matn outline-none " +
  "placeholder:text-xira/70 focus:border-asos focus:ring-2 focus:ring-asos/15";

/** Forma maydonlari uchun — butun kenglikni egallaydi. */
export const KIRITISH_SINF = `w-full ${KIRITISH_ASOS}`;
/** Asboblar paneli uchun — kengligi mazmuniga qarab (w-full bermaydi). */
export const KIRITISH_TOR = KIRITISH_ASOS;

/* ── Holatlar ─────────────────────────────────────────────────────────── */
export function Aylanma({ olcham = 18 }: { olcham?: number }) {
  return (
    <svg className="aylanma" width={olcham} height={olcham} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Yuklanmoqda({ matn = "Yuklanmoqda…" }: { matn?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-xira">
      <Aylanma /> {matn}
    </div>
  );
}

export function Xato({ matn, qayta }: { matn: string; qayta?: () => void }) {
  return (
    <div className="rounded-lg border border-qizil/25 bg-qizil-och px-4 py-3 text-sm text-qizil">
      <p className="font-medium">Xato: {matn}</p>
      {qayta && (
        <button onClick={qayta} className="mt-2 underline underline-offset-2">Qayta urinish</button>
      )}
    </div>
  );
}

export function Bosh({ matn = "Ma'lumot topilmadi" }: { matn?: string }) {
  return <p className="py-10 text-center text-sm text-xira">{matn}</p>;
}

/* ── Modal ────────────────────────────────────────────────────────────── */
export function Modal({ sarlavha, yop, children, keng = false }: {
  sarlavha: string; yop: () => void; children: ReactNode; keng?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-[2px]"
         onClick={yop}>
      <div className={`my-8 w-full ${keng ? "max-w-3xl" : "max-w-lg"} rounded-xl border border-chiziq bg-karta shadow-xl`}
           onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-chiziq px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{sarlavha}</h3>
          <button onClick={yop} aria-label="Yopish"
                  className="rounded-md p-1 text-xira hover:bg-fon hover:text-matn">✕</button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Jadval ───────────────────────────────────────────────────────────── */
export type Ustun = { nom: string; ong?: boolean; tor?: boolean };

export function Jadval({ ustunlar, eng = 720, children }: {
  ustunlar: (string | Ustun)[]; eng?: number; children: ReactNode;
}) {
  const normal: Ustun[] = ustunlar.map((u) => (typeof u === "string" ? { nom: u } : u));
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full text-sm" style={{ minWidth: eng }}>
        <thead className="yopishqoq-sarlavha">
          <tr>
            {normal.map((u) => (
              <th key={u.nom}
                  className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-xira
                              ${u.ong ? "text-right" : "text-left"} ${u.tor ? "w-px" : ""}`}>
                {u.nom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-chiziq">{children}</tbody>
      </table>
    </div>
  );
}

export const KATAK = "px-3 py-2.5 align-middle";
export const KATAK_ONG = "px-3 py-2.5 align-middle text-right raqam";

/* ── Sahifalash ───────────────────────────────────────────────────────── */
export function Sahifalash({ jami, chegara, siljish, ozgart }: {
  jami: number; chegara: number; siljish: number; ozgart: (yangi: number) => void;
}) {
  if (jami <= chegara) return null;
  const sahifa = Math.floor(siljish / chegara) + 1;
  const jamiSahifa = Math.ceil(jami / chegara);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-chiziq px-1 pt-3 text-[13px] text-xira">
      <span>{siljish + 1}–{Math.min(siljish + chegara, jami)} / {jami} ta</span>
      <div className="flex items-center gap-1.5">
        <button disabled={siljish === 0} onClick={() => ozgart(Math.max(siljish - chegara, 0))}
                className="rounded-lg border border-chiziq px-2.5 py-1 disabled:opacity-40 hover:bg-fon">←</button>
        <span>{sahifa} / {jamiSahifa}</span>
        <button disabled={siljish + chegara >= jami} onClick={() => ozgart(siljish + chegara)}
                className="rounded-lg border border-chiziq px-2.5 py-1 disabled:opacity-40 hover:bg-fon">→</button>
      </div>
    </div>
  );
}
