"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { vaqt } from "@/lib/format";
import type { Rasta } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, KIRITISH_TOR, Kartochka, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";

type Zona = {
  id?: number; raqam: number; nomi: string | null; rasta_id: number | null;
  rasta_raqam?: string | null; nuqtalar: [number, number][];
};
type Javob = {
  kamera: { id: number; nomi: string; joylashuv: string | null; manba_kalit: string;
            kadr_eni: number | null; kadr_boyi: number | null; holat: string };
  zonalar: Zona[];
  namuna: { id: number; yol: string; vaqt: string; eni: number | null; boyi: number | null } | null;
};
type Kadr = {
  id: number; vaqt: string; yol: string; hajm: number; odam_soni: number; model: string;
  zonalar: { raqam: number; band: number; odam_soni: number; rasta_raqam: string | null }[];
};

const RANG = ["#0f6b45", "#1d4ed8", "#b25e09", "#7c3aed", "#0891b2", "#be123c"];

/** Kamera kadri ustida zona (poligon) chizish muharriri. */
export default function KameraSahifasi() {
  const { id } = useParams<{ id: string }>();
  const { men, bozorId } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<Javob>(`/api/kameralar/${id}/zonalar`);
  const kadrlar = useMalumot<{ kadrlar: Kadr[] }>(`/api/kadrlar?kamera=${id}&chegara=12`);
  const rastalar = useMalumot<{ rastalar: Rasta[] }>(
    `/api/rastalar?chegara=500${bozorId ? `&bozor=${bozorId}` : ""}`);

  const [tahrir, setTahrir] = useState(false);
  const [zonalar, setZonalar] = useState<Zona[] | null>(null);
  const [chizilayotgan, setChizilayotgan] = useState<[number, number][]>([]);
  const [tanlangan, setTanlangan] = useState<number | null>(null);
  const [amalXato, setAmalXato] = useState<string | null>(null);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  if (yuklanmoqda) return <Yuklanmoqda />;
  if (xato) return <Xato matn={xato} qayta={qayta} />;
  if (!malumot) return <Bosh />;

  const joriy = zonalar ?? malumot.zonalar;
  const namuna = malumot.namuna;

  function nuqta(hodisa: React.MouseEvent): [number, number] | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const quti = svg.getBoundingClientRect();
    return [
      Math.min(Math.max((hodisa.clientX - quti.left) / quti.width, 0), 1),
      Math.min(Math.max((hodisa.clientY - quti.top) / quti.height, 0), 1),
    ];
  }

  function rasmBosildi(hodisa: React.MouseEvent) {
    if (!tahrir) return;
    const n = nuqta(hodisa);
    if (n) setChizilayotgan((oldingi) => [...oldingi, n]);
  }

  function zonaniYop() {
    if (chizilayotgan.length < 3) {
      setAmalXato("Zona uchun kamida 3 nuqta kerak");
      return;
    }
    const yangi: Zona = {
      raqam: (joriy.reduce((m, z) => Math.max(m, z.raqam), 0) || 0) + 1,
      nomi: null, rasta_id: null, nuqtalar: chizilayotgan,
    };
    setZonalar([...joriy, yangi]);
    setChizilayotgan([]);
    setTanlangan(joriy.length);
    setAmalXato(null);
  }

  function zonaOzgart(indeks: number, ozgarish: Partial<Zona>) {
    setZonalar(joriy.map((z, i) => (i === indeks ? { ...z, ...ozgarish } : z)));
  }

  function zonaOchir(indeks: number) {
    setZonalar(joriy.filter((_, i) => i !== indeks));
    setTanlangan(null);
  }

  async function saqla() {
    setSaqlanmoqda(true);
    setAmalXato(null);
    try {
      await yuborish(`/api/kameralar/${id}/zonalar`, {
        zonalar: joriy.map((z) => ({
          raqam: z.raqam, nomi: z.nomi, rasta_id: z.rasta_id, nuqtalar: z.nuqtalar,
        })),
      });
      setZonalar(null);
      setTahrir(false);
      qayta();
    } catch (e) {
      setAmalXato((e as Error).message);
    }
    setSaqlanmoqda(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/kameralar" className="text-[13px] text-xira hover:text-asos">← Kameralar</Link>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">{malumot.kamera.nomi}</h1>
          <p className="mt-1 text-sm text-xira">
            {malumot.kamera.joylashuv ?? "joylashuv ko'rsatilmagan"} · manba:{" "}
            <code className="text-[12.5px]">{malumot.kamera.manba_kalit}</code> ·{" "}
            {joriy.length} zona
          </p>
        </div>
        {yozaOladi(men) && (
          <div className="flex flex-wrap gap-2">
            {!tahrir ? (
              <Tugma onClick={() => { setTahrir(true); setZonalar(malumot.zonalar); }}>
                Zonalarni chizish
              </Tugma>
            ) : (
              <>
                <Tugma uslub="ikkilamchi" onClick={() => {
                  setTahrir(false); setZonalar(null); setChizilayotgan([]); setTanlangan(null);
                }}>Bekor qilish</Tugma>
                <Tugma onClick={saqla} disabled={saqlanmoqda}>
                  {saqlanmoqda ? <><Aylanma /> Saqlanmoqda…</> : `Saqlash (${joriy.length} zona)`}
                </Tugma>
              </>
            )}
          </div>
        )}
      </div>

      {amalXato && <Xato matn={amalXato} />}

      {tahrir && (
        <p className="rounded-lg border border-kok/25 bg-kok-och px-3 py-2 text-[13px] text-kok">
          Kadr ustida <b>bosib</b> nuqta qo&apos;ying (kamida 3 ta), so&apos;ng <b>«Zonani yopish»</b> ni
          bosing. Har zonaga o&apos;ng tomondagi ro&apos;yxatdan obyekt biriktiring.
          Koordinatalar 0..1 ga aylantirib saqlanadi — kamera ruxsati o&apos;zgarsa ham zonalar buzilmaydi.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Kartochka sarlavha="Kamera kadri" sinf="min-w-0"
                   ong={namuna ? <span className="text-[12px] text-xira">{vaqt(namuna.vaqt)}</span> : null}>
          {!namuna ? (
            <div className="py-12 text-center">
              <p className="text-sm text-xira">Bu kameradan hali kadr kelmagan.</p>
              <p className="mt-1 text-[13px] text-xira">
                Agent ishga tushgach birinchi kadr keladi va zonalarni shu kadr ustida chizasiz.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border border-chiziq">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/fayl/${namuna.yol}`} alt="Kamera kadri" className="block w-full" />
              <svg ref={svgRef} viewBox="0 0 1 1" preserveAspectRatio="none"
                   onClick={rasmBosildi}
                   className={`absolute inset-0 h-full w-full ${tahrir ? "cursor-crosshair" : ""}`}>
                {joriy.map((z, i) => {
                  const rang = RANG[i % RANG.length];
                  const yol = z.nuqtalar.map((n) => n.join(",")).join(" ");
                  const markazX = z.nuqtalar.reduce((s, n) => s + n[0], 0) / z.nuqtalar.length;
                  const markazY = z.nuqtalar.reduce((s, n) => s + n[1], 0) / z.nuqtalar.length;
                  return (
                    <g key={i} onClick={(e) => { e.stopPropagation(); setTanlangan(i); }}
                       style={{ cursor: "pointer" }}>
                      <polygon points={yol} fill={rang} fillOpacity={tanlangan === i ? 0.35 : 0.18}
                               stroke={rang} strokeWidth={tanlangan === i ? 0.006 : 0.003}
                               vectorEffect="non-scaling-stroke" />
                      <circle cx={markazX} cy={markazY} r="0.022" fill={rang} />
                      <text x={markazX} y={markazY + 0.008} textAnchor="middle"
                            fontSize="0.03" fill="#fff" fontWeight="700">{z.raqam}</text>
                    </g>
                  );
                })}
                {chizilayotgan.length > 0 && (
                  <>
                    <polyline points={chizilayotgan.map((n) => n.join(",")).join(" ")}
                              fill="none" stroke="#16211c" strokeWidth="0.004"
                              strokeDasharray="0.01 0.008" vectorEffect="non-scaling-stroke" />
                    {chizilayotgan.map((n, i) => (
                      <circle key={i} cx={n[0]} cy={n[1]} r="0.008" fill="#16211c" />
                    ))}
                  </>
                )}
              </svg>
            </div>
          )}

          {tahrir && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tugma kichik uslub="ikkilamchi" onClick={zonaniYop} disabled={chizilayotgan.length < 3}>
                Zonani yopish ({chizilayotgan.length} nuqta)
              </Tugma>
              <Tugma kichik uslub="shaffof" onClick={() => setChizilayotgan([])}
                     disabled={!chizilayotgan.length}>
                Nuqtalarni tozalash
              </Tugma>
            </div>
          )}
        </Kartochka>

        <Kartochka sarlavha="Zonalar">
          {!joriy.length ? (
            <Bosh matn={tahrir ? "Kadr ustida bosib zona chizing" : "Zona chizilmagan"} />
          ) : (
            <ul className="space-y-2">
              {joriy.map((z, i) => (
                <li key={i}
                    className={`rounded-lg border p-2.5 ${tanlangan === i ? "border-asos bg-asos-och" : "border-chiziq"}`}
                    onClick={() => setTanlangan(i)}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold text-white"
                          style={{ background: RANG[i % RANG.length] }}>{z.raqam}</span>
                    {tahrir ? (
                      <select className={`${KIRITISH_TOR} flex-1 py-1 text-[13px]`}
                              value={z.rasta_id ?? ""}
                              onChange={(e) => zonaOzgart(i, {
                                rasta_id: e.target.value ? Number(e.target.value) : null,
                              })}>
                        <option value="">— obyekt tanlanmagan —</option>
                        {(rastalar.malumot?.rastalar ?? []).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.raqam}{r.blok_nomi ? ` · ${r.blok_nomi}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="flex-1 text-sm">
                        {z.rasta_raqam ?? <span className="text-sariq">obyekt biriktirilmagan</span>}
                      </span>
                    )}
                    {tahrir && (
                      <button onClick={(e) => { e.stopPropagation(); zonaOchir(i); }}
                              className="text-[13px] text-qizil hover:underline">O&apos;chirish</button>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] text-xira">{z.nuqtalar.length} nuqta</p>
                </li>
              ))}
            </ul>
          )}
        </Kartochka>
      </div>

      <Kartochka sarlavha="Oxirgi kadrlar"
                 ong={<span className="text-[12px] text-xira">har 5 daqiqada bir marta</span>}>
        {kadrlar.yuklanmoqda ? <Yuklanmoqda /> :
          !kadrlar.malumot?.kadrlar.length ? <Bosh matn="Kadr yo'q" /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kadrlar.malumot.kadrlar.map((k) => (
                <a key={k.id} href={`/api/fayl/${k.yol}`} target="_blank" rel="noreferrer"
                   className="group block overflow-hidden rounded-lg border border-chiziq">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/fayl/${k.yol}`} alt={`Kadr ${vaqt(k.vaqt)}`}
                       className="block aspect-video w-full object-cover transition group-hover:opacity-90" />
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                    <span className="text-[12px] text-xira">{vaqt(k.vaqt)}</span>
                    <span className="flex items-center gap-1.5">
                      {k.model === "yoq" ? (
                        <Belgi tur="xolis">modelsiz</Belgi>
                      ) : k.model === "namoyish" ? (
                        // Soxta natija haqiqiydek ko'rinmasligi kerak
                        <Belgi tur="bekor">NAMOYISH — soxta</Belgi>
                      ) : (
                        <Belgi tur={k.zonalar.some((z) => z.band) ? "ogoh" : "faol"}>
                          {k.zonalar.filter((z) => z.band).length}/{k.zonalar.length} band
                        </Belgi>
                      )}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        <p className="mt-3 text-[12px] leading-relaxed text-xira">
          Kadrlarda odam tasviri bo&apos;lishi mumkin. Ular faqat shu bozor xodimlariga
          ko&apos;rinadi va saqlash muddati tugagach avtomatik o&apos;chiriladi.
        </p>
      </Kartochka>
    </div>
  );
}
