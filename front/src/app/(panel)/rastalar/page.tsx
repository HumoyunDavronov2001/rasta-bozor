"use client";

import Link from "next/link";
import { useState } from "react";
import { useKechiktir, useMalumot } from "@/lib/api";
import { useMen } from "@/lib/kontekst";
import { pul, HOLAT_NOMI, TUR_NOMI } from "@/lib/format";
import type { Rasta } from "@/lib/turlar";
import {
  Belgi, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_TOR, Kartochka, Sahifalash, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";

const CHEGARA = 50;

export default function RastalarSahifasi() {
  const { bozorId } = useMen();
  const [holat, setHolat] = useState("");
  const [tur, setTur] = useState("");
  const [q, setQ] = useState("");
  const qKechikkan = useKechiktir(q);
  const [siljish, setSiljish] = useState(0);

  const sorov = new URLSearchParams({ chegara: String(CHEGARA), siljish: String(siljish) });
  if (bozorId) sorov.set("bozor", String(bozorId));
  if (holat) sorov.set("holat", holat);
  if (tur) sorov.set("tur", tur);
  if (qKechikkan.trim()) sorov.set("q", qKechikkan.trim());

  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ jami: number; rastalar: Rasta[] }>(
    `/api/rastalar?${sorov}`);

  function filtrOzgardi(amal: () => void) {   // filtr o'zgarsa birinchi sahifaga qaytamiz
    amal();
    setSiljish(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Rastalar va do&apos;konlar</h1>
          <p className="mt-1 text-sm text-xira">
            {malumot ? `${malumot.jami} ta obyekt` : "Yuklanmoqda…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => filtrOzgardi(() => setQ(e.target.value))}
                 placeholder="Raqam, ijarachi, blok…" className={`${KIRITISH_TOR} w-60`} />
          <select value={holat} onChange={(e) => filtrOzgardi(() => setHolat(e.target.value))} className={KIRITISH_TOR}>
            <option value="">Barcha holat</option>
            {["band", "bosh", "tamir", "bloklangan"].map((h) => <option key={h} value={h}>{HOLAT_NOMI[h]}</option>)}
          </select>
          <select value={tur} onChange={(e) => filtrOzgardi(() => setTur(e.target.value))} className={KIRITISH_TOR}>
            <option value="">Barcha tur</option>
            {Object.entries(TUR_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2 sm:hidden">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !malumot?.rastalar.length ? <Bosh matn="Bu shartlarga mos obyekt topilmadi" /> : (
            <>
              {malumot.rastalar.map((r) => (
                <MobilKarta key={r.id} havola={`/rastalar/${r.id}`} sarlavha={r.raqam}
                            belgi={<Belgi tur={r.holat}>{HOLAT_NOMI[r.holat]}</Belgi>}
                            tavsif={<>
                              {r.ijarachi_fio ?? "shartnoma yo'q"}
                              <span className="block">
                                {TUR_NOMI[r.tur] ?? r.tur}
                                {r.blok_nomi ? ` · ${r.blok_nomi}` : ""}
                                {r.maydon ? ` · ${r.maydon} m²` : ""}
                              </span>
                            </>}
                            ong={r.oylik_narx ? pul(r.oylik_narx) : undefined}
                            ongIzoh={r.oylik_narx ? "so'm/oy" : undefined} />
              ))}
              <Sahifalash jami={malumot.jami} chegara={CHEGARA} siljish={siljish} ozgart={setSiljish} />
            </>
          )}
      </div>

      <Kartochka sinf="hidden sm:block">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !malumot?.rastalar.length ? <Bosh matn="Bu shartlarga mos obyekt topilmadi" /> : (
            <>
              <Jadval eng={860} ustunlar={["Raqam", "Bozor / blok", "Tur", "Holat", "Ijarachi",
                { nom: "Maydon", ong: true }, { nom: "Oylik narx", ong: true }]}>
                {malumot.rastalar.map((r) => (
                  <tr key={r.id} className="hover:bg-fon">
                    <td className={KATAK}>
                      <Link href={`/rastalar/${r.id}`} className="font-medium hover:text-asos">{r.raqam}</Link>
                    </td>
                    <td className={`${KATAK} text-xira`}>
                      <span className="block text-matn">{r.blok_nomi ?? "—"}</span>
                      <span className="text-[12px]">{r.bozor_nomi}</span>
                    </td>
                    <td className={`${KATAK} text-xira`}>{TUR_NOMI[r.tur] ?? r.tur}</td>
                    <td className={KATAK}><Belgi tur={r.holat}>{HOLAT_NOMI[r.holat]}</Belgi></td>
                    <td className={KATAK}>
                      {r.ijarachi_fio ? (
                        <>
                          <span className="block">{r.ijarachi_fio}</span>
                          <span className="text-[12px] text-xira">{r.ijarachi_telefon ?? ""}</span>
                        </>
                      ) : <span className="text-xira">—</span>}
                    </td>
                    <td className={KATAK_ONG}>{r.maydon ? `${r.maydon} m²` : "—"}</td>
                    <td className={KATAK_ONG}>{pul(r.oylik_narx)}</td>
                  </tr>
                ))}
              </Jadval>
              <Sahifalash jami={malumot.jami} chegara={CHEGARA} siljish={siljish} ozgart={setSiljish} />
            </>
          )}
      </Kartochka>
    </div>
  );
}
