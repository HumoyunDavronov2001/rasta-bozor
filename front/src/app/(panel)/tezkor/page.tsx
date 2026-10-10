"use client";

/* Tezkor ekran — bozorda yurib ishlash uchun.
 *
 * Yig'uvchining bir kunlik ishi shu ekranda: smenani ochadi, rasta raqamini
 * teradi, pulni qabul qiladi yoki bir kunlik joy haqini yozadi.
 * Shuning uchun bu yerda hech qanday jadval yo'q — faqat yirik tugmalar va
 * bitta ustunli ro'yxat.
 */
import Link from "next/link";
import { useState } from "react";
import { useKechiktir, useMalumot, yuborish } from "@/lib/api";
import { useMen, tolovQabulQiladi } from "@/lib/kontekst";
import { bugun, pul } from "@/lib/format";
import type { Rasta } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, KIRITISH_SINF, Kartochka, Maydon, Modal, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";
import { TolovModal } from "@/komponent/tolov-modal";

type Smena = {
  id: number; holat: string; naqd: number; kutilgan_naqd: number;
  kunlik_summa: number; kunlik_soni: number;
};

export default function TezkorSahifasi() {
  const { men, bozorId, bozorSorov } = useMen();
  const [q, setQ] = useState("");
  const qKechikkan = useKechiktir(q);
  const [tolovUchun, setTolovUchun] = useState<Rasta | null>(null);
  const [kunlikUchun, setKunlikUchun] = useState<Rasta | "umumiy" | null>(null);
  const [yangilash, setYangilash] = useState(0);

  const smena = useMalumot<{ smena: Smena | null }>(`/api/smena?v=${yangilash}&${bozorSorov}`);
  const izlanmoqda = qKechikkan.trim().length > 0;
  const rastalar = useMalumot<{ rastalar: Rasta[] }>(
    izlanmoqda ? `/api/rastalar?q=${encodeURIComponent(qKechikkan.trim())}&chegara=25&${bozorSorov}`
      : null);

  const joriy = smena.malumot?.smena ?? null;
  const qayta = () => setYangilash((v) => v + 1);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Tezkor</h1>
        <p className="mt-1 text-sm text-xira">
          Rasta raqamini tering — bir tegishda to&apos;lov qabul qilinadi.
          Naqd pul <b>ochiq smenaga</b> tushadi.
        </p>
      </div>

      {/* ── Smena holati: naqd pul shu yerdan boshlanadi */}
      {smena.yuklanmoqda ? <Yuklanmoqda matn="Smena tekshirilmoqda…" /> : (
        joriy ? (
          <div className="rounded-xl border border-asos/25 bg-asos-och px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-asos">
                  Smena #{joriy.id} ochiq
                </p>
                <p className="mt-0.5 text-[12.5px] text-asos/80">
                  Kassada bo&apos;lishi kerak: <b>{pul(joriy.kutilgan_naqd)} so&apos;m</b>
                </p>
              </div>
              <Link href="/kassa">
                <Tugma kichik uslub="ikkilamchi">Kassa</Tugma>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-sariq/30 bg-sariq-och px-4 py-3">
            <p className="text-[13px] font-medium text-sariq">Smena ochilmagan</p>
            <p className="mt-0.5 text-[12.5px] text-sariq/90">
              Naqd pul qabul qilishdan oldin smenani ochish kerak — shunda pul
              kimning qo&apos;lida ekani yozib qo&apos;yiladi.
            </p>
            {tolovQabulQiladi(men) && <SmenaOchish bozorId={bozorId} qayta={qayta} />}
          </div>
        )
      )}

      {/* ── Qidiruv */}
      <div className="sticky top-14 z-10 -mx-4 border-b border-chiziq bg-fon px-4 pb-3 pt-1 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
        <input value={q} onChange={(e) => setQ(e.target.value)} inputMode="search"
               placeholder="Rasta raqami yoki ijarachi…"
               aria-label="Rasta qidirish"
               className="w-full rounded-xl border border-chiziq bg-karta px-4 py-3 text-[16px]
                          outline-none placeholder:text-xira focus:border-asos" />
      </div>

      {izlanmoqda && (
        rastalar.yuklanmoqda ? <Yuklanmoqda /> :
        rastalar.xato ? <Xato matn={rastalar.xato} qayta={rastalar.qayta} /> :
        !rastalar.malumot?.rastalar.length ? <Bosh matn="Bunday rasta topilmadi" /> : (
          <div className="space-y-2">
            {rastalar.malumot.rastalar.map((r) => (
              <MobilKarta key={r.id}
                          sarlavha={r.raqam}
                          belgi={r.shartnoma_id ? <Belgi tur="band">band</Belgi>
                            : <Belgi tur="bosh">bo&apos;sh</Belgi>}
                          tavsif={<>
                            {r.ijarachi_fio ?? "shartnoma yo'q"}
                            {r.blok_nomi ? ` · ${r.blok_nomi}` : ""}
                            {r.maydon ? ` · ${r.maydon} m²` : ""}
                          </>}
                          ong={r.shartnoma_id ? `${pul(r.oylik_narx)} so'm` : undefined}
                          ongIzoh={r.shartnoma_id ? "oylik" : undefined}
                          amallar={tolovQabulQiladi(men) ? (
                            <>
                              {r.shartnoma_id && (
                                <Tugma kichik onClick={() => setTolovUchun(r)}>
                                  To&apos;lov qabul qilish
                                </Tugma>
                              )}
                              <Tugma kichik uslub="ikkilamchi" onClick={() => setKunlikUchun(r)}>
                                Bir kunlik joy haqi
                              </Tugma>
                              <Link href={`/rastalar/${r.id}`}>
                                <Tugma kichik uslub="ikkilamchi">Batafsil</Tugma>
                              </Link>
                            </>
                          ) : (
                            <Link href={`/rastalar/${r.id}`}>
                              <Tugma kichik uslub="ikkilamchi">Batafsil</Tugma>
                            </Link>
                          )} />
            ))}
          </div>
        )
      )}

      {!izlanmoqda && (
        <>
          {joriy && (
            <Kartochka sarlavha="Bugungi smena">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[12px] text-xira">Naqd qabul qilindi</dt>
                  <dd className="raqam text-[17px] font-semibold">{pul(joriy.naqd)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-xira">Bir kunlik joy haqi</dt>
                  <dd className="raqam text-[17px] font-semibold">
                    {pul(joriy.kunlik_summa)}
                    <span className="ml-1 text-[12px] font-normal text-xira">
                      {joriy.kunlik_soni} ta
                    </span>
                  </dd>
                </div>
              </dl>
            </Kartochka>
          )}

          {tolovQabulQiladi(men) && (
            <Tugma sinf="w-full justify-center py-3 text-[15px]"
                   onClick={() => setKunlikUchun("umumiy")}>
              Bir kunlik joy haqini yozish
            </Tugma>
          )}
        </>
      )}

      {tolovUchun?.shartnoma_id && (
        <TolovModal shartnomaId={tolovUchun.shartnoma_id}
                    sarlavha={`${tolovUchun.raqam} · ${tolovUchun.ijarachi_fio ?? ""}`}
                    oylik={tolovUchun.oylik_tolov ?? tolovUchun.oylik_narx}
                    yop={() => setTolovUchun(null)}
                    tayyor={() => { qayta(); rastalar.qayta?.(); }} />
      )}

      {kunlikUchun && (
        <KunlikOynasi rasta={kunlikUchun === "umumiy" ? null : kunlikUchun}
                      bozorId={bozorId} smenaBor={!!joriy}
                      yop={() => setKunlikUchun(null)}
                      tayyor={() => { setKunlikUchun(null); qayta(); }} />
      )}
    </div>
  );
}

function SmenaOchish({ bozorId, qayta }: { bozorId: number | null; qayta: () => void }) {
  const [boshlangich, setBoshlangich] = useState("0");
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  async function och() {
    setIshlamoqda(true);
    setXato(null);
    try {
      await yuborish("/api/smena", {
        boshlangich: Number(boshlangich.replace(/\s/g, "")) || 0, bozor_id: bozorId,
      });
      qayta();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <div className="mt-3">
      <div className="flex items-end gap-2">
        <Maydon yorliq="Boshlang'ich naqd (so'm)">
          <input className={KIRITISH_SINF} inputMode="numeric" value={boshlangich}
                 onChange={(e) => setBoshlangich(e.target.value.replace(/[^\d]/g, ""))} />
        </Maydon>
        <Tugma onClick={och} disabled={ishlamoqda} sinf="py-2.5">
          {ishlamoqda ? <><Aylanma /> Ochilmoqda…</> : "Smenani ochish"}
        </Tugma>
      </div>
      {xato && <p className="mt-2 text-[12.5px] text-qizil">{xato}</p>}
    </div>
  );
}

function KunlikOynasi({ rasta, bozorId, smenaBor, yop, tayyor }: {
  rasta: Rasta | null; bozorId: number | null; smenaBor: boolean;
  yop: () => void; tayyor: () => void;
}) {
  const [m, setM] = useState({ summa: "", orin: "1", mahsulot: "", usul: "naqd" });
  const [xato, setXato] = useState<string | null>(null);
  const [natija, setNatija] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      const javob = await yuborish<{ summa: number; kvitansiya: string }>("/api/kunlik", {
        bozor_id: bozorId, rasta_id: rasta?.id ?? null, sana: bugun(),
        summa: m.summa ? Number(m.summa.replace(/\s/g, "")) : null,
        orin_soni: Number(m.orin) || 1, mahsulot: m.mahsulot || null, usul: m.usul,
      });
      setNatija(`${pul(javob.summa)} so'm qabul qilindi · kvitansiya ${javob.kvitansiya}`);
      setM({ ...m, summa: "", mahsulot: "" });
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha="Bir kunlik joy haqi" yop={yop}>
      <form onSubmit={joniat} className="space-y-3">
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Shartnoma talab qilinmaydi — to&apos;lov {rasta ? <b>{rasta.raqam}</b> : "bozorga"} va
          bugungi kunga bog&apos;lanadi. Summa bo&apos;sh bo&apos;lsa tarifdan hisoblanadi.
          {!smenaBor && <b className="block text-sariq">Naqd uchun smena ochilishi kerak.</b>}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Summa (so'm)" izoh="bo'sh — tarifdan">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.summa} autoFocus
                   onChange={(e) => setM({ ...m, summa: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="O'rin soni">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.orin}
                   onChange={(e) => setM({ ...m, orin: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Mahsulot" izoh="ixtiyoriy">
            <input className={KIRITISH_SINF} value={m.mahsulot} maxLength={120}
                   placeholder="Pomidor, kartoshka…"
                   onChange={(e) => setM({ ...m, mahsulot: e.target.value })} />
          </Maydon>
          <Maydon yorliq="To'lov usuli">
            <select className={KIRITISH_SINF} value={m.usul}
                    onChange={(e) => setM({ ...m, usul: e.target.value })}>
              <option value="naqd">Naqd</option>
              <option value="karta">Plastik karta</option>
            </select>
          </Maydon>
        </div>
        {natija && <p className="rounded-lg border border-asos/25 bg-asos-och px-3 py-2 text-[13px] text-asos">{natija}</p>}
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Yopish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda}>
            {ishlamoqda ? <><Aylanma /> Yozilmoqda…</> : "Qabul qilish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}
