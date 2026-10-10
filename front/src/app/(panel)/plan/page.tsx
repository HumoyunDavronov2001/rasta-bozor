"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi, tolovQabulQiladi } from "@/lib/kontekst";
import { pul, HOLAT_NOMI, TUR_NOMI } from "@/lib/format";
import type { Blok, Bozor, KunHolat, KunHolati, PlanObyekt, Rasta } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, KIRITISH_SINF, KIRITISH_TOR, Kartochka, Maydon, Modal,
  Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { Tasdiq } from "@/komponent/tasdiq";
import { TolovModal } from "@/komponent/tolov-modal";

type PlanJavob = {
  bozor: Bozor; bloklar: Blok[]; rastalar: Rasta[];
  obyektlar: PlanObyekt[]; qavatlar: number[];
};

/** Infratuzilma obyekti rastadan ko'rinishi bilan farq qilsin. */
const OBYEKT_RANGI: Record<string, { toldirish: string; matn: string }> = {
  yolak: { toldirish: "#eef1ef", matn: "#8a968f" },
  kirish: { toldirish: "#e6f2ec", matn: "#3f7a5f" },
  chiqish: { toldirish: "#e6f2ec", matn: "#3f7a5f" },
  hojatxona: { toldirish: "#eaf0f8", matn: "#5b7196" },
  ombor: { toldirish: "#f3efe6", matn: "#8a7645" },
  ofis: { toldirish: "#f0ecf6", matn: "#6f5f92" },
  maydon: { toldirish: "#f7f8f7", matn: "#8a968f" },
  avtoturargoh: { toldirish: "#eef1ef", matn: "#6b7a72" },
  boshqa: { toldirish: "#f2f5f3", matn: "#8a968f" },
};
const OBYEKT_NOMI: Record<string, string> = {
  yolak: "Yo'lak", kirish: "Kirish", chiqish: "Chiqish", hojatxona: "Hojatxona",
  ombor: "Ombor", ofis: "Ofis", maydon: "Maydon", avtoturargoh: "Avtoturargoh",
  boshqa: "Boshqa",
};

/** Ko'rinish oynasi — SVG viewBox. Zoom va surish shu qiymatni o'zgartiradi. */
type Korinish = { x: number; y: number; eni: number; boyi: number };

const ENG_KICHIK_ENI = 120;      // eng katta yaqinlashtirish (kattalashtirish chegarasi)

/** Matnni rasta kengligiga sig'diradi (SVG da avtomatik kesish yo'q). */
function qisqart(matn: string, eni: number, olcham: number): string {
  const maks = Math.max(Math.floor((eni - 6) / (olcham * 0.55)), 3);
  return matn.length > maks ? matn.slice(0, maks - 1) + "…" : matn;
}

/** Rasta rangi: faqat holatiga qarab (band / bo'sh / ta'mirda / bloklangan). */
function rang(r: Rasta): { toldirish: string; chegara: string; matn: string } {
  if (r.holat === "bloklangan") return { toldirish: "#d9dedb", chegara: "#a9b3ae", matn: "#4b5650" };
  if (r.holat === "tamir") return { toldirish: "#e8eefb", chegara: "#a9bde8", matn: "#1d4ed8" };
  if (r.holat === "bosh") return { toldirish: "#f2f5f3", chegara: "#c9d3cd", matn: "#61736a" };
  return { toldirish: "#0f6b45", chegara: "#0a4a30", matn: "#ffffff" };
}

/* Patta bozori: rasta rangi BOZOR KUNIDAGI holatdan (kamera + to'lov) — buyurtmachi talabi:
   yashil — to'langan, qizil — ishlayapti/to'lanmagan, sariq — bo'sh, kulrang — kamera ma'lumoti yo'q. */
const KUN_RANGI: Record<KunHolat, { toldirish: string; chegara: string; matn: string; nom: string }> = {
  tolangan: { toldirish: "#16a34a", chegara: "#15803d", matn: "#ffffff", nom: "to'langan" },
  tolanmagan: { toldirish: "#dc2626", chegara: "#b91c1c", matn: "#ffffff", nom: "ishlayapti, to'lanmagan" },
  bosh: { toldirish: "#fde047", chegara: "#ca8a04", matn: "#422006", nom: "bo'sh" },
  nomalum: { toldirish: "#e5e7eb", chegara: "#cbd5e1", matn: "#64748b", nom: "kamera ma'lumoti yo'q" },
  tamir: { toldirish: "#e8eefb", chegara: "#a9bde8", matn: "#1d4ed8", nom: "ta'mirda" },
  bloklangan: { toldirish: "#d9dedb", chegara: "#a9b3ae", matn: "#4b5650", nom: "bloklangan" },
};

export default function PlanSahifasi() {
  const { men, bozorlar, bozorId, bozorTanla } = useMen();
  const faolBozor = bozorId ?? bozorlar[0]?.id ?? null;
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<PlanJavob>(
    faolBozor ? `/api/bozorlar/${faolBozor}/plan` : null);

  const [tanlanganId, setTanlanganId] = useState<number | null>(null);
  const [qidiruv, setQidiruv] = useState("");
  const [tahrir, setTahrir] = useState(false);
  const [tolovUchun, setTolovUchun] = useState<Rasta | null>(null);
  const [kochgan, setKochgan] = useState<Record<number, { x: number; y: number }>>({});
  const [amalXato, setAmalXato] = useState<string | null>(null);
  const [korinish, setKorinish] = useState<Korinish | null>(null);
  const [surilmoqda, setSurilmoqda] = useState(false);
  const [qavat, setQavat] = useState(1);
  const [olchamlar, setOlchamlar] = useState<Record<number, { eni: number; boyi: number }>>({});
  const [qatorOchiq, setQatorOchiq] = useState(false);
  const [sozlamaOchiq, setSozlamaOchiq] = useState(false);
  // Patta bozorida plan bozor kunidagi holatni ko'rsatadi (sana bo'sh — server oxirgi bozor kunini oladi)
  const [kunSana, setKunSana] = useState("");
  const pattaBozor = !!malumot?.bozor.oy_ish_kuni;
  const kun = useMalumot<KunHolati>(pattaBozor && faolBozor
    ? `/api/bozorlar/${faolBozor}/kun-holati${kunSana ? `?sana=${kunSana}` : ""}` : null);
  const kunHolat = (r: Rasta): KunHolat | null => kun.malumot?.holatlar[String(r.id)] ?? null;
  const [obyektUchun, setObyektUchun] = useState<PlanObyekt | "yangi" | null>(null);
  const olcham = useRef<{ id: number; x: number; y: number; eni: number; boyi: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gildirakRef = useRef<(h: WheelEvent) => void>(() => {});
  const sudrash = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const surish = useRef<{ x: number; y: number; korinish: Korinish } | null>(null);

  /** SVG ga g'ildirak tinglovchisini passiv BO'LMAGAN holda ulaymiz.
   *  React ning onWheel i passiv — unda preventDefault ishlamaydi va sahifa
   *  yaqinlashtirish bilan birga siljib ketadi. */
  const svgUlash = useCallback((element: SVGSVGElement | null) => {
    svgRef.current = element;
    if (!element) return;
    const ishlov = (h: WheelEvent) => gildirakRef.current(h);
    element.addEventListener("wheel", ishlov, { passive: false });
    return () => {
      element.removeEventListener("wheel", ishlov);
      svgRef.current = null;
    };
  }, []);

  // G'ildirak bilan yaqinlashtirish. Hook erta qaytishlardan OLDIN turishi shart,
  // shuning uchun mantiq shu yerda — ma'lumot hali kelmagan bo'lsa hech nima qilmaydi.
  useEffect(() => {
    gildirakRef.current = (hodisa: WheelEvent) => {
      const b = malumot?.bozor;
      const svg = svgRef.current;
      if (!b || !svg) return;
      hodisa.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const nuqta = svg.createSVGPoint();
      nuqta.x = hodisa.clientX;
      nuqta.y = hodisa.clientY;
      const n = nuqta.matrixTransform(ctm.inverse());
      const joriy = korinish ?? { x: 0, y: 0, eni: b.plan_eni, boyi: b.plan_boyi };
      const koeffitsiyent = hodisa.deltaY > 0 ? 1.15 : 1 / 1.15;
      const yangiEni = Math.min(Math.max(joriy.eni * koeffitsiyent, ENG_KICHIK_ENI), b.plan_eni * 1.5);
      const nisbat = yangiEni / joriy.eni;
      setKorinish({
        x: n.x - (n.x - joriy.x) * nisbat,
        y: n.y - (n.y - joriy.y) * nisbat,
        eni: yangiEni,
        boyi: (yangiEni * b.plan_boyi) / b.plan_eni,
      });
    };
  });

  if (!faolBozor) return <Bosh matn="Bozor topilmadi" />;
  if (yuklanmoqda) return <Yuklanmoqda matn="Plan yuklanmoqda…" />;
  if (xato) return <Xato matn={xato} qayta={qayta} />;
  if (!malumot) return <Bosh />;

  const { bozor, bloklar, rastalar } = malumot;
  const obyektlar = malumot.obyektlar ?? [];
  const qavatlar = malumot.qavatlar?.length ? malumot.qavatlar : [1];
  // Ko'p qavatli bozorda plan FAQAT tanlangan qavatni ko'rsatadi — aks holda
  // ustma-ust tushgan ikki qavat bir-birini yopib, chizma yolg'on ko'rinadi.
  const qavatda = (q: number | null | undefined) => (q ?? 1) === qavat;
  const korinadigan = qavatlar.length > 1 ? rastalar.filter((r) => qavatda(r.qavat)) : rastalar;
  const korinadiganObyekt = obyektlar.filter((o) => qavatlar.length <= 1 || qavatda(o.qavat));
  const masshtab = bozor.masshtab || 10;
  const metr = (piksel: number) => (piksel / masshtab).toFixed(1);
  const toliqKorinish: Korinish = { x: 0, y: 0, eni: bozor.plan_eni, boyi: bozor.plan_boyi };
  const k = korinish ?? toliqKorinish;
  const kattalik = bozor.plan_eni / k.eni;      // 1 = to'liq plan, 2 = ikki barobar yaqin
  const tanlangan = rastalar.find((r) => r.id === tanlanganId) ?? null;
  const qidiruvPast = qidiruv.trim().toLowerCase();
  const mos = (r: Rasta) => !qidiruvPast ||
    r.raqam.toLowerCase().includes(qidiruvPast) ||
    (r.ijarachi_fio ?? "").toLowerCase().includes(qidiruvPast) ||
    (r.blok_nomi ?? "").toLowerCase().includes(qidiruvPast);

  const bandSoni = rastalar.filter((r) => r.holat === "band").length;

  /** Ekran nuqtasini SVG koordinatasiga o'giradi. */
  function svgNuqta(hodisa: React.PointerEvent): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const n = svg.createSVGPoint();
    n.x = hodisa.clientX;
    n.y = hodisa.clientY;
    const m = n.matrixTransform(ctm.inverse());
    return { x: m.x, y: m.y };
  }

  /** Tugmalar bilan markazdan yaqinlashtirish/uzoqlashtirish. */
  function masshtabla(koeffitsiyent: number) {
    const markazX = k.x + k.eni / 2;
    const markazY = k.y + k.boyi / 2;
    const yangiEni = Math.min(Math.max(k.eni * koeffitsiyent, ENG_KICHIK_ENI), bozor.plan_eni * 1.5);
    const yangiBoyi = (yangiEni * bozor.plan_boyi) / bozor.plan_eni;
    setKorinish({ x: markazX - yangiEni / 2, y: markazY - yangiBoyi / 2, eni: yangiEni, boyi: yangiBoyi });
  }

  /** Tanlangan rastani ko'rinish markaziga olib keladi (qidiruvdan keyin qulay). */
  function markazga(r: Rasta) {
    const p = kochgan[r.id] ?? { x: r.x, y: r.y };
    const eni = Math.max(Math.min(k.eni, bozor.plan_eni / 3), ENG_KICHIK_ENI);
    const boyi = (eni * bozor.plan_boyi) / bozor.plan_eni;
    setKorinish({ x: p.x + r.eni / 2 - eni / 2, y: p.y + r.boyi / 2 - boyi / 2, eni, boyi });
  }

  function fonBosildi(hodisa: React.PointerEvent) {
    if (hodisa.target !== hodisa.currentTarget && !(hodisa.target as Element).classList?.contains("fon"))
      return;
    setTanlanganId(null);
    surish.current = { x: hodisa.clientX, y: hodisa.clientY, korinish: k };
    setSurilmoqda(true);
    (hodisa.currentTarget as Element).setPointerCapture(hodisa.pointerId);
  }

  function bosildi(hodisa: React.PointerEvent, r: Rasta) {
    setTanlanganId(r.id);
    if (!tahrir) return;
    const n = svgNuqta(hodisa);
    if (!n) return;
    const joriy = kochgan[r.id] ?? { x: r.x, y: r.y };
    sudrash.current = { id: r.id, dx: n.x - joriy.x, dy: n.y - joriy.y };
    (hodisa.target as Element).setPointerCapture(hodisa.pointerId);
  }

  function surildi(hodisa: React.PointerEvent) {
    if (surish.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const olcham = svg.getBoundingClientRect();
      const boshlangich = surish.current.korinish;
      setKorinish({
        ...boshlangich,
        x: boshlangich.x - ((hodisa.clientX - surish.current.x) * boshlangich.eni) / olcham.width,
        y: boshlangich.y - ((hodisa.clientY - surish.current.y) * boshlangich.boyi) / olcham.height,
      });
      return;
    }
    if (olcham.current) {
      const n = svgNuqta(hodisa);
      if (!n) return;
      const { id, x, y } = olcham.current;
      setOlchamlar((oldin) => ({
        ...oldin,
        [id]: {
          eni: Math.max(10, Math.round((n.x - x) / 5) * 5),
          boyi: Math.max(10, Math.round((n.y - y) / 5) * 5),
        },
      }));
      return;
    }
    if (!sudrash.current) return;
    const n = svgNuqta(hodisa);
    if (!n) return;
    const { id, dx, dy } = sudrash.current;
    setKochgan((oldin) => ({
      ...oldin,
      [id]: { x: Math.max(0, Math.round((n.x - dx) / 5) * 5), y: Math.max(0, Math.round((n.y - dy) / 5) * 5) },
    }));
  }

  /** O'lcham dastagi bosilganda — sudrash emas, o'lchov o'zgaradi. */
  function olchamBosildi(hodisa: React.PointerEvent, r: Rasta) {
    hodisa.stopPropagation();
    const p = kochgan[r.id] ?? { x: r.x, y: r.y };
    olcham.current = { id: r.id, x: p.x, y: p.y, eni: r.eni, boyi: r.boyi };
    (hodisa.target as Element).setPointerCapture(hodisa.pointerId);
  }

  async function qoyibYuborildi() {
    if (surish.current) {
      surish.current = null;
      setSurilmoqda(false);
    }
    if (olcham.current) {
      const { id } = olcham.current;
      olcham.current = null;
      const yangiOlcham = olchamlar[id];
      const asl = rastalar.find((r) => r.id === id);
      if (yangiOlcham && asl && (yangiOlcham.eni !== asl.eni || yangiOlcham.boyi !== asl.boyi)) {
        try {
          await yuborish(`/api/rastalar/${id}`, yangiOlcham, "PATCH");
          setAmalXato(null);
          qayta();
        } catch (e) {
          setAmalXato((e as Error).message);
          setOlchamlar((oldin) => {
            const nusxa = { ...oldin };
            delete nusxa[id];
            return nusxa;
          });
        }
      }
      return;
    }
    const holat = sudrash.current;
    sudrash.current = null;
    if (!holat) return;
    const yangi = kochgan[holat.id];
    const asl = rastalar.find((r) => r.id === holat.id);
    if (!yangi || !asl || (yangi.x === asl.x && yangi.y === asl.y)) return;
    try {
      await yuborish(`/api/rastalar/${holat.id}`, { x: yangi.x, y: yangi.y }, "PATCH");
      setAmalXato(null);
    } catch (e) {
      setAmalXato((e as Error).message);
      setKochgan((oldin) => {
        const nusxa = { ...oldin };
        delete nusxa[holat.id];
        return nusxa;
      });
    }
  }

  /** Rastani 90° ga buradi. Plan haqiqiy bozorga mos bo'lishi uchun kerak —
   *  ko'p bozorda rastalar burchak ostida joylashgan. */
  async function burilt(r: Rasta, daraja: number) {
    try {
      await yuborish(`/api/rastalar/${r.id}`, { burchak: ((r.burchak ?? 0) + daraja + 360) % 360 }, "PATCH");
      setAmalXato(null);
      qayta();
    } catch (e) {
      setAmalXato((e as Error).message);
    }
  }

  async function holatOzgartir(r: Rasta, yangi: string) {
    try {
      await yuborish(`/api/rastalar/${r.id}`, { holat: yangi }, "PATCH");
      setAmalXato(null);
      qayta();
    } catch (e) {
      setAmalXato((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Bozor plani</h1>
          <p className="mt-1 text-sm text-xira">
            {bozor.nomi}{bozor.manzil ? ` · ${bozor.manzil}` : ""} · {rastalar.length} obyekt ·{" "}
            {pattaBozor && kun.malumot
              ? `${kun.malumot.soni.tolangan} to'lagan · ${kun.malumot.soni.tolanmagan} to'lamagan`
              : `${bandSoni} band`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!men.bozor && bozorlar.length > 1 && (
            <select value={faolBozor} onChange={(e) => { bozorTanla(Number(e.target.value)); setTanlanganId(null); }}
                    className={`${KIRITISH_TOR} max-w-[280px]`}>
              {bozorlar.map((b) => <option key={b.id} value={b.id}>{b.nomi}</option>)}
            </select>
          )}
          <input value={qidiruv} onChange={(e) => setQidiruv(e.target.value)}
                 placeholder="Rasta raqami yoki ijarachi…" className={`${KIRITISH_TOR} w-56`} />
          {qavatlar.length > 1 && (
            <select value={qavat} onChange={(e) => { setQavat(Number(e.target.value)); setTanlanganId(null); }}
                    className={KIRITISH_TOR} aria-label="Qavat">
              {qavatlar.map((q) => <option key={q} value={q}>{q}-qavat</option>)}
            </select>
          )}
          {yozaOladi(men) && (
            <Tugma uslub={tahrir ? "asosiy" : "ikkilamchi"} onClick={() => setTahrir((t) => !t)}>
              {tahrir ? "Tahrirni tugatish" : "Planni tahrirlash"}
            </Tugma>
          )}
        </div>
      </div>

      {tahrir && (
        <div className="rounded-lg border border-kok/25 bg-kok-och px-3 py-2.5 text-[13px] text-kok">
          <p>
            Rastani sudrab joyini o&apos;zgartiring; tanlangan rastaning pastki o&apos;ng
            burchagidan tortib <b>o&apos;lchamini</b> o&apos;zgartiring. Ikki obyekt bir joyda tura
            olmaydi — ustma-ust tushsa server <b>saqlamaydi</b>. 1 m = {masshtab} px.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Tugma kichik onClick={() => setQatorOchiq(true)}>Qator yaratish</Tugma>
            <Tugma kichik uslub="ikkilamchi" onClick={() => setObyektUchun("yangi")}>
              Infratuzilma qo&apos;shish
            </Tugma>
            <Tugma kichik uslub="ikkilamchi" onClick={() => setSozlamaOchiq(true)}>
              Masshtab va chizma
            </Tugma>
          </div>
        </div>
      )}
      {amalXato && <Xato matn={amalXato} />}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Kartochka sarlavha="Plan" ong={<Izohlar patta={pattaBozor} />} sinf="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button onClick={() => masshtabla(1 / 1.3)} aria-label="Yaqinlashtirish"
                      className="rounded-lg border border-chiziq px-2.5 py-1 text-sm hover:bg-fon">+</button>
              <button onClick={() => masshtabla(1.3)} aria-label="Uzoqlashtirish"
                      className="rounded-lg border border-chiziq px-2.5 py-1 text-sm hover:bg-fon">−</button>
              <button onClick={() => setKorinish(null)}
                      className="rounded-lg border border-chiziq px-2.5 py-1 text-[13px] hover:bg-fon">
                Hammasi
              </button>
              {tanlangan && (
                <button onClick={() => markazga(tanlangan)}
                        className="rounded-lg border border-chiziq px-2.5 py-1 text-[13px] hover:bg-fon">
                  Tanlanganga
                </button>
              )}
            </div>
            <span className="raqam text-[12px] text-xira">{Math.round(kattalik * 100)}%</span>
            <span className="text-[12px] text-xira">
              · g&apos;ildirak bilan yaqinlashtiring, bo&apos;sh joyni sudrab suring
            </span>
          </div>
          <div className="overflow-x-auto">
            <svg ref={svgUlash} viewBox={`${k.x} ${k.y} ${k.eni} ${k.boyi}`}
                 data-plan="bozor" role="img"
                 aria-label={`${bozor.nomi} plani: ${rastalar.length} obyekt`}
                 className="w-full min-w-[680px] touch-none select-none"
                 style={{ cursor: surilmoqda ? "grabbing" : "default" }}
                 onPointerDown={fonBosildi}
                 onPointerMove={surildi} onPointerUp={qoyibYuborildi} onPointerCancel={qoyibYuborildi}>
              <rect className="fon" x={-bozor.plan_eni} y={-bozor.plan_boyi}
                    width={bozor.plan_eni * 3} height={bozor.plan_boyi * 3} fill="#fbfcfb" />
              <rect className="fon" x="0" y="0" width={bozor.plan_eni} height={bozor.plan_boyi}
                    fill="#ffffff" stroke="#e2e8e4" strokeWidth={1 / kattalik} />
              {bozor.plan_rasm && (
                /* Haqiqiy chizma — rastalar uning ustiga joylanadi */
                <image href={`/api/fayl/${bozor.plan_rasm}`} x="0" y="0"
                       width={bozor.plan_eni} height={bozor.plan_boyi}
                       opacity={bozor.plan_rasm_shaffof ?? 0.5} preserveAspectRatio="none" />
              )}

              {bloklar.map((b) => {
                const ichi = korinadigan.filter((r) => r.blok_id === b.id);
                if (!ichi.length) return null;
                const y = Math.min(...ichi.map((r) => (kochgan[r.id]?.y ?? r.y)));
                const x = Math.min(...ichi.map((r) => (kochgan[r.id]?.x ?? r.x)));
                return (
                  <text key={b.id} x={x} y={y - 7} fontSize="13" fontWeight="600" fill="#61736a">
                    {b.nomi}
                  </text>
                );
              })}

              {korinadiganObyekt.map((o) => {
                const c = OBYEKT_RANGI[o.tur] ?? OBYEKT_RANGI.boshqa;
                return (
                  <g key={`o-${o.id}`} transform={o.burchak ? `rotate(${o.burchak} ${o.x + o.eni / 2} ${o.y + o.boyi / 2})` : undefined}
                     onPointerDown={(e) => { if (tahrir) { e.stopPropagation(); setObyektUchun(o); } }}
                     style={{ cursor: tahrir ? "pointer" : "default" }}>
                    <rect x={o.x} y={o.y} width={o.eni} height={o.boyi} rx="3"
                          fill={c.toldirish} stroke="#d7dedb" strokeDasharray="4 3" strokeWidth="1" />
                    <text x={o.x + o.eni / 2} y={o.y + o.boyi / 2 + 3.5} textAnchor="middle"
                          fontSize="9.5" fill={c.matn}>
                      {qisqart(o.nomi, o.eni, 9.5)}
                    </text>
                    <title>{o.nomi} · {OBYEKT_NOMI[o.tur] ?? o.tur} (ijaraga berilmaydi)</title>
                  </g>
                );
              })}

              {korinadigan.map((r) => {
                const p = kochgan[r.id] ?? { x: r.x, y: r.y };
                const ol = olchamlar[r.id] ?? { eni: r.eni, boyi: r.boyi };
                const kh = pattaBozor ? kunHolat(r) : null;
                const c = kh ? KUN_RANGI[kh] : rang(r);
                const kichik = ol.eni < 46;
                const tanlandi = r.id === tanlanganId;
                return (
                  <g key={r.id} opacity={mos(r) ? 1 : 0.22}
                     transform={r.burchak ? `rotate(${r.burchak} ${p.x + ol.eni / 2} ${p.y + ol.boyi / 2})` : undefined}
                     onPointerDown={(e) => bosildi(e, r)}
                     style={{ cursor: tahrir ? "grab" : "pointer" }}>
                    <rect x={p.x} y={p.y} width={ol.eni} height={ol.boyi} rx="4"
                          fill={c.toldirish} stroke={tanlandi ? "#16211c" : c.chegara}
                          strokeWidth={tanlandi ? 2.5 : 1} />
                    <text x={p.x + ol.eni / 2} y={p.y + ol.boyi / 2 + (kichik ? 3.5 : 0)}
                          textAnchor="middle" fontSize={kichik ? 9.5 : 11} fontWeight="600" fill={c.matn}>
                      {qisqart(r.raqam, ol.eni, kichik ? 9.5 : 11)}
                    </text>
                    {!kichik && r.ijarachi_fio && (
                      <text x={p.x + ol.eni / 2} y={p.y + ol.boyi / 2 + 13} textAnchor="middle"
                            fontSize="8.5" fill={c.matn} opacity=".85">
                        {qisqart(r.ijarachi_fio, ol.eni, 8.5)}
                      </text>
                    )}
                    {tahrir && tanlandi && (
                      /* O'lcham dastagi — pastki o'ng burchak */
                      <rect x={p.x + ol.eni - 5} y={p.y + ol.boyi - 5} width="10" height="10" rx="2"
                            fill="#ffffff" stroke="#16211c" strokeWidth="1.5"
                            style={{ cursor: "nwse-resize" }}
                            onPointerDown={(e) => olchamBosildi(e, r)} />
                    )}
                    <title>
                      {r.raqam} · {kh ? KUN_RANGI[kh].nom : HOLAT_NOMI[r.holat]} · {metr(ol.eni)}×{metr(ol.boyi)} m
                      {r.ijarachi_fio ? `\n${r.ijarachi_fio}` : ""}
                    </title>
                  </g>
                );
              })}

              {/* Masshtab chizg'ichi — 10 metr */}
              <g opacity="0.75">
                <line x1={12} y1={bozor.plan_boyi - 14} x2={12 + masshtab * 10}
                      y2={bozor.plan_boyi - 14} stroke="#61736a" strokeWidth={1.5 / kattalik} />
                <line x1={12} y1={bozor.plan_boyi - 18} x2={12} y2={bozor.plan_boyi - 10}
                      stroke="#61736a" strokeWidth={1.5 / kattalik} />
                <line x1={12 + masshtab * 10} y1={bozor.plan_boyi - 18} x2={12 + masshtab * 10}
                      y2={bozor.plan_boyi - 10} stroke="#61736a" strokeWidth={1.5 / kattalik} />
                <text x={12 + masshtab * 5} y={bozor.plan_boyi - 20} textAnchor="middle"
                      fontSize={10 / kattalik} fill="#61736a">10 m</text>
              </g>
            </svg>
          </div>
        </Kartochka>

        <div className="space-y-4">
          {tanlangan ? (
            <RastaPaneli rasta={tanlangan} men={men} masshtab={masshtab}
                         tahrir={tahrir} burilt={burilt}
                         tolov={() => setTolovUchun(tanlangan)}
                         holatOzgartir={holatOzgartir} />
          ) : (
            <Kartochka sarlavha="Rasta ma'lumoti">
              <p className="py-6 text-center text-sm text-xira">
                Plandan rasta tanlang — ijarachi va shartnoma shu yerda ko&apos;rinadi.
              </p>
            </Kartochka>
          )}

          {pattaBozor && kun.malumot && (
            <Kartochka sarlavha="Bozor kuni"
                       ong={<input type="date" aria-label="Bozor kuni sanasi" value={kunSana || kun.malumot.sana}
                                   onChange={(e) => setKunSana(e.target.value)}
                                   className="rounded-md border border-chiziq bg-karta px-2 py-1 text-[12.5px]" />}>
              <dl className="space-y-2 text-sm">
                {(["tolangan", "tolanmagan", "bosh", "nomalum"] as const).map((h) => (
                  <div key={h} className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-xira">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: KUN_RANGI[h].toldirish }} />
                      {KUN_RANGI[h].nom}
                    </dt>
                    <dd className="raqam font-medium">{kun.malumot!.soni[h]}</dd>
                  </div>
                ))}
                {kun.malumot.yoqotilgan != null && (
                  <Qator nom="To'lanmagan pul (qizil)" qiymat={`${pul(kun.malumot.yoqotilgan)} so'm`}
                         rang={kun.malumot.yoqotilgan ? "text-qizil" : ""} />
                )}
              </dl>
              <p className="mt-2 text-[12px] text-xira">
                {kun.malumot.bozor_kunimi === false && "Bu sana bozor kuni emas. "}
                Qizil — kamera kamida {kun.malumot.eng_kam_kadr} kadrda (~{kun.malumot.eng_kam_kadr * 5} daqiqa)
                odam ko&apos;rgan, lekin shu kuni patta to&apos;lanmagan. Kulrang — kamera ma&apos;lumoti yo&apos;q
                (rang taxmin qilinmaydi).
              </p>
            </Kartochka>
          )}

          <Kartochka sarlavha="Jamlanma">
            <dl className="space-y-2 text-sm">
              <Qator nom="Jami obyekt" qiymat={String(rastalar.length)} />
              {/* Patta bozorida shartnoma yo'q — «band/bo'sh/oylik ijara» chalg'itadi (bozor kuni yuqorida) */}
              {!pattaBozor && <Qator nom="Band" qiymat={String(bandSoni)} />}
              {!pattaBozor && <Qator nom="Bo'sh" qiymat={String(rastalar.filter((r) => r.holat === "bosh").length)} />}
              <Qator nom="Ta'mirda" qiymat={String(rastalar.filter((r) => r.holat === "tamir").length)} />
              {obyektlar.length > 0 && (
                <Qator nom="Infratuzilma" qiymat={`${obyektlar.length} ta (ijarasiz)`} />
              )}
              {!pattaBozor && <Qator nom="Oylik ijara (band)"
                     qiymat={pul(rastalar.filter((r) => r.holat === "band")
                       .reduce((s, r) => s + (r.oylik_tolov ?? r.oylik_narx), 0))} />}
            </dl>
          </Kartochka>
        </div>
      </div>

      {qatorOchiq && (
        /* Oyna yopilmaydi: odatda ketma-ket bir necha qator yaratiladi va
           natija (nechta yozildi, nega to'xtadi) ko'rinib turishi kerak. */
        <QatorOynasi bozor={bozor} bloklar={bloklar} qavat={qavat}
                     yop={() => setQatorOchiq(false)} tayyor={qayta} />
      )}

      {obyektUchun && (
        <ObyektOynasi bozorId={bozor.id} qavat={qavat}
                      obyekt={obyektUchun === "yangi" ? null : obyektUchun}
                      yop={() => setObyektUchun(null)}
                      tayyor={() => { setObyektUchun(null); qayta(); }} />
      )}

      {sozlamaOchiq && (
        <PlanSozlamasi bozor={bozor} yop={() => setSozlamaOchiq(false)}
                       tayyor={() => { setSozlamaOchiq(false); qayta(); }} />
      )}

      {tolovUchun?.shartnoma_id && (
        <TolovModal shartnomaId={tolovUchun.shartnoma_id}
                    sarlavha={`${tolovUchun.raqam} · ${tolovUchun.ijarachi_fio}`}
                    oylik={tolovUchun.oylik_tolov ?? tolovUchun.oylik_narx}
                    yop={() => setTolovUchun(null)} tayyor={qayta} />
      )}
    </div>
  );
}

function Qator({ nom, qiymat, rang = "" }: { nom: string; qiymat: string; rang?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xira">{nom}</dt>
      <dd className={`raqam font-medium ${rang}`}>{qiymat}</dd>
    </div>
  );
}

function Izohlar({ patta = false }: { patta?: boolean }) {
  const unsurlar: [string, string][] = patta
    ? (["tolangan", "tolanmagan", "bosh", "nomalum"] as const).map((h) => [KUN_RANGI[h].toldirish, KUN_RANGI[h].nom])
    : [["#0f6b45", "band"], ["#f2f5f3", "bo'sh"], ["#e8eefb", "ta'mirda"], ["#d9dedb", "bloklangan"]];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-xira">
      {unsurlar.map(([r, n]) => (
        <span key={n} className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-black/10" style={{ background: r }} />{n}
        </span>
      ))}
    </div>
  );
}

function RastaPaneli({ rasta, men, masshtab, tahrir, burilt, tolov, holatOzgartir }: {
  rasta: Rasta; men: ReturnType<typeof useMen>["men"]; masshtab: number; tahrir: boolean;
  burilt: (r: Rasta, daraja: number) => void;
  tolov: () => void; holatOzgartir: (r: Rasta, holat: string) => void;
}) {
  const chizmaMaydoni = ((rasta.eni / masshtab) * (rasta.boyi / masshtab)).toFixed(2);
  return (
    <Kartochka sarlavha={rasta.raqam}
               ong={<Belgi tur={rasta.holat}>{HOLAT_NOMI[rasta.holat]}</Belgi>}>
      <dl className="space-y-2 text-sm">
        <Qator nom="Turi" qiymat={TUR_NOMI[rasta.tur] ?? rasta.tur} />
        <Qator nom="Blok" qiymat={rasta.blok_nomi ?? "—"} />
        <Qator nom="Maydon" qiymat={rasta.maydon ? `${rasta.maydon} m²` : "—"} />
        <Qator nom="Chizmada" qiymat={`${rasta.eni}×${rasta.boyi} px · ${chizmaMaydoni} m²`} />
        <Qator nom="Oylik narx" qiymat={`${pul(rasta.oylik_narx)} so'm`} />
      </dl>

      {tahrir && (
        <div className="mt-3 rounded-lg bg-fon px-3 py-2.5">
          <p className="text-[12.5px] text-xira">
            Burilish: <b>{rasta.burchak ?? 0}°</b>. Chizmadagi o&apos;lcham {chizmaMaydoni} m²
            {rasta.maydon && Math.abs(Number(chizmaMaydoni) - rasta.maydon) > 0.5 ? (
              <span className="text-sariq"> — yozilgan maydondan ({rasta.maydon} m²) farq qiladi</span>
            ) : null}
          </p>
          <div className="mt-2 flex gap-2">
            <Tugma kichik uslub="ikkilamchi" onClick={() => burilt(rasta, -90)}>↺ 90°</Tugma>
            <Tugma kichik uslub="ikkilamchi" onClick={() => burilt(rasta, 90)}>↻ 90°</Tugma>
            <Tugma kichik uslub="ikkilamchi" onClick={() => burilt(rasta, 15)}>+15°</Tugma>
            {(rasta.burchak ?? 0) !== 0 && (
              <Tugma kichik uslub="ikkilamchi" onClick={() => burilt(rasta, -(rasta.burchak ?? 0))}>0°</Tugma>
            )}
          </div>
        </div>
      )}

      {rasta.shartnoma_id ? (
        <>
          <hr className="my-3 border-chiziq" />
          <p className="text-sm font-medium">{rasta.ijarachi_fio}</p>
          <p className="mt-0.5 text-[13px] text-xira">{rasta.ijarachi_telefon ?? "telefon ko'rsatilmagan"}</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Qator nom="Shartnoma" qiymat={rasta.shartnoma_raqam ?? "—"} />
            <Qator nom="Oylik to'lov" qiymat={`${pul(rasta.oylik_tolov)} so'm`} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {tolovQabulQiladi(men) && <Tugma kichik onClick={tolov}>To&apos;lov qabul qilish</Tugma>}
            <Link href={`/shartnomalar?tanlangan=${rasta.shartnoma_id}`}>
              <Tugma kichik uslub="ikkilamchi">Shartnoma</Tugma>
            </Link>
            <Link href={`/ijarachilar?tanlangan=${rasta.ijarachi_id}`}>
              <Tugma kichik uslub="ikkilamchi">Ijarachi</Tugma>
            </Link>
          </div>
        </>
      ) : (
        <>
          <hr className="my-3 border-chiziq" />
          <p className="text-[13px] text-xira">Bu obyektda faol shartnoma yo&apos;q.</p>
          {yozaOladi(men) && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/shartnomalar?rasta=${rasta.id}`}>
                <Tugma kichik>Shartnoma tuzish</Tugma>
              </Link>
              {rasta.holat !== "tamir" && (
                <Tugma kichik uslub="ikkilamchi" onClick={() => holatOzgartir(rasta, "tamir")}>Ta&apos;mirga</Tugma>
              )}
              {rasta.holat !== "bosh" && (
                <Tugma kichik uslub="ikkilamchi" onClick={() => holatOzgartir(rasta, "bosh")}>Bo&apos;sh deb belgilash</Tugma>
              )}
            </div>
          )}
        </>
      )}
    </Kartochka>
  );
}

/* ── Qator generatori ─────────────────────────────────────────────────── */
function QatorOynasi({ bozor, bloklar, qavat, yop, tayyor }: {
  bozor: Bozor; bloklar: Blok[]; qavat: number; yop: () => void; tayyor: () => void;
}) {
  const masshtab = bozor.masshtab || 10;
  const [m, setM] = useState({
    shablon: "A-1", soni: "10", ustun: "10", yonalish: "gorizontal",
    x: "40", y: "40", eni: "52", boyi: "34", oraliq: "8",
    tur: "rasta", blok_id: "", maqsad: "",
  });
  const [xato, setXato] = useState<string | null>(null);
  const [natija, setNatija] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const son = (q: string) => Number(q.replace(/[^\d]/g, "")) || 0;
  const maydon = ((son(m.eni) / masshtab) * (son(m.boyi) / masshtab)).toFixed(2);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      const j = await yuborish<{ yaratildi: number; soralgan: number; sabab: string | null }>(
        `/api/bozorlar/${bozor.id}/qator`, {
          shablon: m.shablon, soni: son(m.soni), ustun: son(m.ustun), yonalish: m.yonalish,
          x: son(m.x), y: son(m.y), eni: son(m.eni), boyi: son(m.boyi), oraliq: son(m.oraliq),
          tur: m.tur, qavat, blok_id: m.blok_id ? Number(m.blok_id) : null,
          maqsad: m.maqsad || null,
        });
      setNatija(j.sabab
        ? `${j.yaratildi} ta yaratildi (${j.soralgan} tadan). To'xtash sababi: ${j.sabab}`
        : `${j.yaratildi} ta rasta yaratildi.`);
      if (j.yaratildi > 0) tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha="Qator bo'yicha rasta yaratish" yop={yop}>
      <form onSubmit={joniat} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Maydon yorliq="Raqam shabloni" izoh="A-1 → A-2, A-3…">
            <input className={KIRITISH_SINF} value={m.shablon} autoFocus
                   onChange={(e) => setM({ ...m, shablon: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Soni">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.soni}
                   onChange={(e) => setM({ ...m, soni: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Bir qatorda" izoh="to'r bo'lsa — ustun soni">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.ustun}
                   onChange={(e) => setM({ ...m, ustun: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Boshlanish X">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.x}
                   onChange={(e) => setM({ ...m, x: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Boshlanish Y">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.y}
                   onChange={(e) => setM({ ...m, y: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Oraliq (px)">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.oraliq}
                   onChange={(e) => setM({ ...m, oraliq: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Eni (px)">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.eni}
                   onChange={(e) => setM({ ...m, eni: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Bo'yi (px)">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.boyi}
                   onChange={(e) => setM({ ...m, boyi: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Yo'nalish">
            <select className={KIRITISH_SINF} value={m.yonalish}
                    onChange={(e) => setM({ ...m, yonalish: e.target.value })}>
              <option value="gorizontal">Gorizontal</option>
              <option value="vertikal">Vertikal</option>
            </select>
          </Maydon>
          <Maydon yorliq="Obyekt turi">
            <select className={KIRITISH_SINF} value={m.tur}
                    onChange={(e) => setM({ ...m, tur: e.target.value })}>
              {["rasta", "dokon", "konteyner", "ombor", "pavilyon"].map((x) =>
                <option key={x} value={x}>{TUR_NOMI[x] ?? x}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="Blok" izoh="ixtiyoriy">
            <select className={KIRITISH_SINF} value={m.blok_id}
                    onChange={(e) => setM({ ...m, blok_id: e.target.value })}>
              <option value="">— yo&apos;q —</option>
              {bloklar.map((b) => <option key={b.id} value={b.id}>{b.nomi}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="Faoliyat maqsadi" izoh="tarif shu bo'yicha tanlanadi">
            <select className={KIRITISH_SINF} value={m.maqsad}
                    onChange={(e) => setM({ ...m, maqsad: e.target.value })}>
              <option value="">— ko&apos;rsatilmagan —</option>
              {["oziq-ovqat", "nooziq-ovqat", "ovqatlanish", "xizmat", "boshqa"].map((x) =>
                <option key={x} value={x}>{x}</option>)}
            </select>
          </Maydon>
        </div>

        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Har bir obyekt <b>{maydon} m²</b> deb yoziladi ({m.eni}×{m.boyi} px, masshtab 1 m = {masshtab} px)
          va <b>{qavat}-qavat</b>ga joylanadi. Narx qo&apos;yilmaydi — u tarifdan yoki shartnomadan chiqadi.
          Band joyga yozilmaydi: to&apos;siqqa duch kelsa o&apos;sha yerda to&apos;xtaydi.
        </p>
        {natija && <p className="rounded-lg border border-asos/25 bg-asos-och px-3 py-2 text-[13px] text-asos">{natija}</p>}
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Yopish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda || !m.shablon.trim() || !son(m.soni)}>
            {ishlamoqda ? <><Aylanma /> Yaratilmoqda…</> : "Yaratish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

/* ── Infratuzilma obyekti ─────────────────────────────────────────────── */
function ObyektOynasi({ bozorId, qavat, obyekt, yop, tayyor }: {
  bozorId: number; qavat: number; obyekt: PlanObyekt | null;
  yop: () => void; tayyor: () => void;
}) {
  const [m, setM] = useState({
    nomi: obyekt?.nomi ?? "", tur: obyekt?.tur ?? "yolak",
    x: String(obyekt?.x ?? 40), y: String(obyekt?.y ?? 40),
    eni: String(obyekt?.eni ?? 80), boyi: String(obyekt?.boyi ?? 40),
    burchak: String(obyekt?.burchak ?? 0),
  });
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [ochirish, setOchirish] = useState(false);
  const son = (q: string) => Number(q.replace(/[^\d]/g, "")) || 0;

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      const tana = {
        bozor_id: bozorId, qavat, nomi: m.nomi, tur: m.tur,
        x: son(m.x), y: son(m.y), eni: son(m.eni), boyi: son(m.boyi), burchak: son(m.burchak),
      };
      if (obyekt) await yuborish(`/api/plan-obyektlar/${obyekt.id}`, tana, "PATCH");
      else await yuborish("/api/plan-obyektlar", tana);
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha={obyekt ? `${obyekt.nomi} — tahrirlash` : "Infratuzilma obyekti"} yop={yop}>
      <form onSubmit={joniat} className="space-y-3">
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Bu obyektlar <b>ijaraga berilmaydi</b> va bandlik foiziga kirmaydi — ular faqat
          planni haqiqiy bozorga o&apos;xshatish uchun.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Nomi">
            <input className={KIRITISH_SINF} value={m.nomi} autoFocus maxLength={60}
                   onChange={(e) => setM({ ...m, nomi: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Turi">
            <select className={KIRITISH_SINF} value={m.tur}
                    onChange={(e) => setM({ ...m, tur: e.target.value })}>
              {Object.entries(OBYEKT_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Maydon>
          {([["x", "X"], ["y", "Y"], ["eni", "Eni (px)"], ["boyi", "Bo'yi (px)"],
             ["burchak", "Burchak (°)"]] as const).map(([kalit, yorliq]) => (
            <Maydon key={kalit} yorliq={yorliq}>
              <input className={KIRITISH_SINF} inputMode="numeric" value={m[kalit]}
                     onChange={(e) => setM({ ...m, [kalit]: e.target.value.replace(/[^\d]/g, "") })} />
            </Maydon>
          ))}
        </div>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-between gap-2 pt-1">
          {obyekt ? (
            <Tugma type="button" uslub="xatarli" kichik onClick={() => setOchirish(true)}>O&apos;chirish</Tugma>
          ) : <span />}
          <div className="flex gap-2">
            <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
            <Tugma type="submit" disabled={ishlamoqda || !m.nomi.trim()}>
              {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Saqlash"}
            </Tugma>
          </div>
        </div>
      </form>
      {ochirish && obyekt && (
        <Tasdiq sarlavha="Obyektni o'chirish" tugmaMatn="O'chirish" xatarli
                tavsif={<><b>{obyekt.nomi}</b> plandan olib tashlanadi.</>}
                yop={() => setOchirish(false)}
                tasdiqla={async () => {
                  await yuborish(`/api/plan-obyektlar/${obyekt.id}`, undefined, "DELETE");
                  tayyor();
                }} />
      )}
    </Modal>
  );
}

/* ── Masshtab va fon chizma ───────────────────────────────────────────── */
function PlanSozlamasi({ bozor, yop, tayyor }: {
  bozor: Bozor; yop: () => void; tayyor: () => void;
}) {
  const [masshtab, setMasshtab] = useState(String(bozor.masshtab || 10));
  const [shaffof, setShaffof] = useState(String(bozor.plan_rasm_shaffof ?? 0.5));
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [rasmYuklanmoqda, setRasmYuklanmoqda] = useState(false);

  async function saqla(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      await yuborish(`/api/bozorlar/${bozor.id}`, {
        masshtab: Number(masshtab.replace(",", ".")),
        plan_rasm_shaffof: Number(shaffof),
      }, "PATCH");
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  async function rasmYukla(fayl: File | null) {
    if (!fayl) return;
    setRasmYuklanmoqda(true);
    setXato(null);
    try {
      const javob = await fetch(`/api/bozorlar/${bozor.id}/plan-rasm`, {
        method: "PUT", credentials: "same-origin",
        headers: { "X-Rasta": "1", "Content-Type": "application/octet-stream" },
        body: fayl,
      });
      if (!javob.ok) throw new Error((await javob.json()).xato ?? "Yuklab bo'lmadi");
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setRasmYuklanmoqda(false);
  }

  return (
    <Modal sarlavha="Masshtab va chizma" yop={yop}>
      <form onSubmit={saqla} className="space-y-3">
        <Maydon yorliq="Masshtab — 1 metr necha piksel"
                izoh="Rastaning m² maydoni shu qiymatdan chiqadi, m² esa ijara summasiga kiradi">
          <input className={KIRITISH_SINF} inputMode="decimal" value={masshtab}
                 onChange={(e) => setMasshtab(e.target.value.replace(/[^\d.,]/g, ""))} />
        </Maydon>
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Hozir: 52×34 px rasta = <b>
            {((52 / (Number(masshtab.replace(",", ".")) || 10)) *
              (34 / (Number(masshtab.replace(",", ".")) || 10))).toFixed(2)} m²
          </b>. Masshtabni o&apos;zgartirish <b>yozilgan maydonlarni qayta hisoblamaydi</b> —
          u faqat yangi chizilgan obyektlarga ta&apos;sir qiladi.
        </p>

        <hr className="border-chiziq" />
        <Maydon yorliq="Haqiqiy chizma (JPEG/PNG)"
                izoh="Plan ostiga qo'yiladi — rastalarni unga moslab joylashtirasiz">
          <input type="file" accept="image/*" className="block w-full text-[13px]"
                 onChange={(e) => rasmYukla(e.target.files?.[0] ?? null)} />
        </Maydon>
        {rasmYuklanmoqda && <p className="text-[13px] text-xira"><Aylanma /> Yuklanmoqda…</p>}
        {bozor.plan_rasm && (
          <>
            <Maydon yorliq={`Chizma shaffofligi: ${Math.round(Number(shaffof) * 100)}%`}>
              <input type="range" min="0.1" max="1" step="0.05" value={shaffof}
                     className="w-full" onChange={(e) => setShaffof(e.target.value)} />
            </Maydon>
            <button type="button" className="text-[13px] text-qizil underline"
                    onClick={async () => {
                      await yuborish(`/api/bozorlar/${bozor.id}/plan-rasm`, undefined, "DELETE");
                      tayyor();
                    }}>
              Chizmani olib tashlash
            </button>
          </>
        )}
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Yopish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda}>
            {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Saqlash"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}
