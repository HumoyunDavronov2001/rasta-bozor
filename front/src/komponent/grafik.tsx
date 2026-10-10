"use client";

import { useEffect, useRef, useState } from "react";

import { pulQisqa } from "@/lib/format";

/* SVG kengligi konteynerdan o'lchanadi — 1 birlik = 1 px, yozuv hamma joyda 11 px.
   Ilgari viewBox 760 ga qotirilgan edi: tor kartochkada o'q yozuvlari ~8 px ga,
   telefonda 4–5 px ga kichrayib o'qib bo'lmasdi, keng ekranda esa 15 px ga
   kattalashardi (27.09.2026). */
const YOZUV = 11;
// Pastki hoshiya 28: o'qdagi «0» va sana/oy yozuvi orasi yozuv balandligidan (15 px) katta —
// 22 da ular 3 px ustma-ust tushardi.

function useKenglik(sukut = 760) {
  const ref = useRef<HTMLDivElement>(null);
  const [kenglik, setKenglik] = useState(sukut);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kuzat = new ResizeObserver(([y]) => {
      const e = Math.round(y.contentRect.width);
      if (e > 0) setKenglik(e);
    });
    kuzat.observe(el);
    return () => kuzat.disconnect();
  }, []);
  return [ref, kenglik] as const;
}

/* ── Oylik ustun grafigi: ijara to'lovi / kunlik joy haqi ───────────── */
export function UstunGrafik({ malumot, balandlik = 220 }: {
  malumot: { nom: string; ijara: number; kunlik: number }[];
  balandlik?: number;
}) {
  const [ref, E] = useKenglik();
  if (!malumot.length) return <p className="py-8 text-center text-sm text-xira">{"Ma'lumot yo'q"}</p>;
  const B = balandlik, chap = 56, past = 28, tepa = 12;
  const eng = Math.max(...malumot.map((m) => Math.max(m.ijara, m.kunlik)), 1);
  const maydonE = E - chap - 8, maydonB = B - past - tepa;
  const qadam = maydonE / malumot.length;
  const ustunE = Math.min(qadam * 0.34, 26);
  const y = (q: number) => tepa + maydonB - (q / eng) * maydonB;
  // Tor joyda («Sen 26» ~40 px) oy yozuvlari siyraklashadi; oxirgi oy doim yoziladi
  const har = Math.max(1, Math.ceil(44 / qadam));

  return (
    <div ref={ref} className="w-full">
    <svg viewBox={`0 0 ${E} ${B}`} className="block w-full" role="img" aria-label="Oylik tushum">
      {[0, 0.25, 0.5, 0.75, 1].map((u) => (
        <g key={u}>
          <line x1={chap} x2={E - 8} y1={y(eng * u)} y2={y(eng * u)} stroke="#e2e8e4" strokeWidth="1" />
          <text x={chap - 6} y={y(eng * u) + 4} textAnchor="end" fontSize={YOZUV} fill="#61736a">
            {pulQisqa(eng * u)}
          </text>
        </g>
      ))}
      {malumot.map((m, i) => {
        const x = chap + i * qadam + qadam / 2;
        return (
          <g key={m.nom}>
            <rect x={x - ustunE - 1} y={y(m.ijara)} width={ustunE}
                  height={Math.max(tepa + maydonB - y(m.ijara), 1)} rx="3" fill="#0f6b45">
              <title>{`${m.nom} · ijara to'lovi: ${pulQisqa(m.ijara)}`}</title>
            </rect>
            <rect x={x + 1} y={y(m.kunlik)} width={ustunE}
                  height={Math.max(tepa + maydonB - y(m.kunlik), 1)} rx="3" fill="#1d4ed8">
              <title>{`${m.nom} · kunlik joy haqi: ${pulQisqa(m.kunlik)}`}</title>
            </rect>
            {(malumot.length - 1 - i) % har === 0 && (
              <text x={x} y={B - 8} textAnchor="middle" fontSize={YOZUV} fill="#61736a">{m.nom}</text>
            )}
          </g>
        );
      })}
      <line x1={chap} x2={E - 8} y1={tepa + maydonB} y2={tepa + maydonB} stroke="#cbd5d0" />
    </svg>
    </div>
  );
}

/* ── Kunlik tushum — maydon grafigi ───────────────────────────────────── */
export function MaydonGrafik({ malumot, balandlik = 170 }: {
  malumot: { sana: string; summa: number }[]; balandlik?: number;
}) {
  const [ref, E] = useKenglik();
  if (malumot.length < 2) return <p className="py-8 text-center text-sm text-xira">{"Grafik uchun ma'lumot yetarli emas"}</p>;
  const B = balandlik, chap = 56, past = 28, tepa = 10;
  const eng = Math.max(...malumot.map((m) => m.summa), 1);
  const maydonE = E - chap - 8, maydonB = B - past - tepa;
  const x = (i: number) => chap + (i / (malumot.length - 1)) * maydonE;
  const y = (q: number) => tepa + maydonB - (q / eng) * maydonB;
  const chiziq = malumot.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(m.summa).toFixed(1)}`).join(" ");
  const maydon = `${chiziq} L${x(malumot.length - 1).toFixed(1)},${tepa + maydonB} L${chap},${tepa + maydonB} Z`;
  // Sana yozuvi («04.09») ~34 px — kenglikka qarab 2…7 ta
  const nechta = Math.min(7, Math.max(2, Math.floor(maydonE / 60)));
  const belgilar = malumot.filter((_, i) => i % Math.ceil(malumot.length / nechta) === 0);

  return (
    <div ref={ref} className="w-full">
    <svg viewBox={`0 0 ${E} ${B}`} className="block w-full" role="img" aria-label="Kunlik tushum">
      <defs>
        <linearGradient id="tushum" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f6b45" stopOpacity=".28" />
          <stop offset="100%" stopColor="#0f6b45" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((u) => (
        <g key={u}>
          <line x1={chap} x2={E - 8} y1={y(eng * u)} y2={y(eng * u)} stroke="#e2e8e4" />
          <text x={chap - 6} y={y(eng * u) + 4} textAnchor="end" fontSize={YOZUV} fill="#61736a">{pulQisqa(eng * u)}</text>
        </g>
      ))}
      <path d={maydon} fill="url(#tushum)" />
      <path d={chiziq} fill="none" stroke="#0f6b45" strokeWidth="2" strokeLinejoin="round" />
      {malumot.map((m, i) => (
        <circle key={m.sana} cx={x(i)} cy={y(m.summa)} r="7" fill="transparent">
          <title>{`${m.sana}: ${pulQisqa(m.summa)} so'm`}</title>
        </circle>
      ))}
      {belgilar.map((m) => {
        const i = malumot.indexOf(m);
        return (
          <text key={m.sana} x={x(i)} y={B - 6} textAnchor="middle" fontSize={YOZUV} fill="#61736a">
            {m.sana.slice(8, 10)}.{m.sana.slice(5, 7)}
          </text>
        );
      })}
    </svg>
    </div>
  );
}

/* ── Halqa (to'lov usullari) ──────────────────────────────────────────── */
const HALQA_RANG = ["#0f6b45", "#1d4ed8", "#b25e09", "#7c3aed", "#0891b2"];

export function Halqa({ malumot }: { malumot: { nom: string; qiymat: number }[] }) {
  const jami = malumot.reduce((s, m) => s + m.qiymat, 0);
  if (!jami) return <p className="py-8 text-center text-sm text-xira">{"Ma'lumot yo'q"}</p>;
  const R = 52, ich = 33, markaz = 70;

  // Burchaklarni JSX dan tashqarida hisoblaymiz — render ichida o'zgaruvchi o'zgarmasin
  const bolaklar: { nom: string; qiymat: number; bosh: number; tugash: number }[] = [];
  let yigindi = 0;
  for (const m of malumot) {
    const bosh = -Math.PI / 2 + (yigindi / jami) * Math.PI * 2;
    yigindi += m.qiymat;
    bolaklar.push({ ...m, bosh, tugash: -Math.PI / 2 + (yigindi / jami) * Math.PI * 2 });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-[140px] w-[140px] shrink-0" role="img" aria-label="To'lov usullari">
        {bolaklar.map((b, i) => {
          const katta = b.tugash - b.bosh > Math.PI ? 1 : 0;
          const [x1, y1] = [markaz + R * Math.cos(b.bosh), markaz + R * Math.sin(b.bosh)];
          const [x2, y2] = [markaz + R * Math.cos(b.tugash), markaz + R * Math.sin(b.tugash)];
          const [x3, y3] = [markaz + ich * Math.cos(b.tugash), markaz + ich * Math.sin(b.tugash)];
          const [x4, y4] = [markaz + ich * Math.cos(b.bosh), markaz + ich * Math.sin(b.bosh)];
          return (
            <path key={b.nom} fill={HALQA_RANG[i % HALQA_RANG.length]}
                  d={`M${x1},${y1} A${R},${R} 0 ${katta} 1 ${x2},${y2} L${x3},${y3} A${ich},${ich} 0 ${katta} 0 ${x4},${y4} Z`}>
              <title>{`${b.nom}: ${pulQisqa(b.qiymat)} (${Math.round((b.qiymat / jami) * 100)}%)`}</title>
            </path>
          );
        })}
        <text x={markaz} y={markaz - 2} textAnchor="middle" fontSize="13" fontWeight="600" fill="#16211c">
          {pulQisqa(jami)}
        </text>
        <text x={markaz} y={markaz + 12} textAnchor="middle" fontSize="9" fill="#61736a">jami</text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {malumot.map((m, i) => (
          <li key={m.nom} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: HALQA_RANG[i % HALQA_RANG.length] }} />
            <span className="text-matn">{m.nom}</span>
            <span className="raqam text-xira">{pulQisqa(m.qiymat)} · {Math.round((m.qiymat / jami) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Gorizontal ulush chizig'i ────────────────────────────────────────── */
export function Ulush({ qism, jami, rang = "#0f6b45" }: { qism: number; jami: number; rang?: string }) {
  const foiz = jami ? Math.min((qism / jami) * 100, 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-fon">
      <div className="h-full rounded-full transition-[width]" style={{ width: `${foiz}%`, background: rang }} />
    </div>
  );
}
