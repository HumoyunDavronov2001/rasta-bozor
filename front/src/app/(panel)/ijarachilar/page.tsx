"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useKechiktir, useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { pul, sana, HOLAT_NOMI } from "@/lib/format";
import type { Ijarachi, Shartnoma } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_SINF, KIRITISH_TOR, Kartochka,
  Maydon, Modal, Sahifalash, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { Tasdiq } from "@/komponent/tasdiq";

const CHEGARA = 50;

export default function IjarachilarSahifasi() {
  return <Suspense fallback={<Yuklanmoqda />}><Ichki /></Suspense>;
}

function Ichki() {
  const parametr = useSearchParams();
  const { men } = useMen();
  const [q, setQ] = useState("");
  const qKechikkan = useKechiktir(q);
  const [siljish, setSiljish] = useState(0);
  const [yangiOchiq, setYangiOchiq] = useState(false);
  const [tanlanganId, setTanlanganId] = useState<number | null>(
    parametr.get("tanlangan") ? Number(parametr.get("tanlangan")) : null);

  const sorov = new URLSearchParams({ chegara: String(CHEGARA), siljish: String(siljish) });
  if (qKechikkan.trim()) sorov.set("q", qKechikkan.trim());
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ jami: number; ijarachilar: Ijarachi[] }>(
    `/api/ijarachilar?${sorov}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Ijarachilar</h1>
          <p className="mt-1 text-sm text-xira">{malumot ? `${malumot.jami} ta ijarachi` : "Yuklanmoqda…"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => { setQ(e.target.value); setSiljish(0); }}
                 placeholder="Ism, telefon yoki STIR…" className={`${KIRITISH_TOR} w-64`} />
          {yozaOladi(men) && <Tugma onClick={() => setYangiOchiq(true)}>+ Yangi ijarachi</Tugma>}
        </div>
      </div>

      <Kartochka>
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !malumot?.ijarachilar.length ? <Bosh matn="Ijarachi topilmadi" /> : (
            <>
              <Jadval eng={760} ustunlar={["Ijarachi", "Turi", "Telefon", "Faoliyat",
                { nom: "Faol shartnoma", ong: true }, ""]}>
                {malumot.ijarachilar.map((i) => (
                  <tr key={i.id} className="hover:bg-fon">
                    <td className={KATAK}>
                      <button onClick={() => setTanlanganId(i.id)} className="text-left font-medium hover:text-asos">
                        {i.fio}
                      </button>
                      {i.qora_royxat ? <Belgi tur="bekor">qora ro&apos;yxat</Belgi> : null}
                      {i.stir && <span className="ml-2 text-[12px] text-xira">STIR {i.stir}</span>}
                    </td>
                    <td className={`${KATAK} text-xira`}>{i.tur === "yuridik" ? "Yuridik shaxs" : "Jismoniy shaxs"}</td>
                    <td className={KATAK}>{i.telefon ?? "—"}</td>
                    <td className={`${KATAK} text-xira`}>{i.faoliyat ?? "—"}</td>
                    <td className={KATAK_ONG}>{i.faol_shartnoma ?? 0}</td>
                    <td className={KATAK}>
                      <button onClick={() => setTanlanganId(i.id)}
                              className="text-[13px] text-asos hover:underline">Batafsil</button>
                    </td>
                  </tr>
                ))}
              </Jadval>
              <Sahifalash jami={malumot.jami} chegara={CHEGARA} siljish={siljish} ozgart={setSiljish} />
            </>
          )}
      </Kartochka>

      {yangiOchiq && <YangiIjarachi yop={() => setYangiOchiq(false)} tayyor={qayta} />}
      {tanlanganId && <IjarachiKartochka id={tanlanganId} yop={() => setTanlanganId(null)} yangila={qayta} />}
    </div>
  );
}

function YangiIjarachi({ yop, tayyor }: { yop: () => void; tayyor: () => void }) {
  const [maydon, setMaydon] = useState({ fio: "", tur: "jismoniy", telefon: "", stir: "", faoliyat: "", manzil: "" });
  const [xato, setXato] = useState<string | null>(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setYuborilmoqda(true);
    try {
      await yuborish("/api/ijarachilar", { ...maydon, stir: maydon.stir || null });
      tayyor();
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setYuborilmoqda(false);
    }
  }

  return (
    <Modal sarlavha="Yangi ijarachi" yop={yop}>
      <form onSubmit={joniat} className="space-y-3.5">
        <Maydon yorliq="To'liq ism / tashkilot nomi">
          <input className={KIRITISH_SINF} value={maydon.fio} autoFocus required
                 onChange={(e) => setMaydon({ ...maydon, fio: e.target.value })} />
        </Maydon>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Shakli">
            <select className={KIRITISH_SINF} value={maydon.tur}
                    onChange={(e) => setMaydon({ ...maydon, tur: e.target.value })}>
              <option value="jismoniy">Jismoniy shaxs</option>
              <option value="yuridik">Yuridik shaxs</option>
            </select>
          </Maydon>
          <Maydon yorliq="Telefon">
            <input className={KIRITISH_SINF} value={maydon.telefon} placeholder="+998 __ ___ __ __"
                   onChange={(e) => setMaydon({ ...maydon, telefon: e.target.value })} />
          </Maydon>
        </div>
        {maydon.tur === "yuridik" && (
          <Maydon yorliq="STIR" izoh="9 xonali raqam — yuridik shaxs uchun majburiy">
            <input className={KIRITISH_SINF} value={maydon.stir} inputMode="numeric" maxLength={9}
                   onChange={(e) => setMaydon({ ...maydon, stir: e.target.value.replace(/\D/g, "") })} />
          </Maydon>
        )}
        <Maydon yorliq="Faoliyat turi" izoh="Masalan: sabzavot savdosi">
          <input className={KIRITISH_SINF} value={maydon.faoliyat}
                 onChange={(e) => setMaydon({ ...maydon, faoliyat: e.target.value })} />
        </Maydon>
        <Maydon yorliq="Manzil">
          <input className={KIRITISH_SINF} value={maydon.manzil}
                 onChange={(e) => setMaydon({ ...maydon, manzil: e.target.value })} />
        </Maydon>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={yuborilmoqda || maydon.fio.trim().length < 3}>
            {yuborilmoqda ? <><Aylanma /> Saqlanmoqda…</> : "Saqlash"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

function IjarachiKartochka({ id, yop, yangila }: { id: number; yop: () => void; yangila: () => void }) {
  const { men } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{
    ijarachi: Ijarachi; shartnomalar: Shartnoma[];
  }>(`/api/ijarachilar/${id}`);
  const [qoraOchiq, setQoraOchiq] = useState<0 | 1 | null>(null);

  return (
    <Modal sarlavha="Ijarachi kartochkasi" yop={yop} keng>
      {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> : !malumot ? <Bosh /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-semibold">{malumot.ijarachi.fio}</h3>
              <p className="mt-0.5 text-sm text-xira">
                {malumot.ijarachi.tur === "yuridik" ? "Yuridik shaxs" : "Jismoniy shaxs"}
                {malumot.ijarachi.stir ? ` · STIR ${malumot.ijarachi.stir}` : ""}
                {malumot.ijarachi.telefon ? ` · ${malumot.ijarachi.telefon}` : ""}
              </p>
              {malumot.ijarachi.faoliyat && <p className="text-sm text-xira">{malumot.ijarachi.faoliyat}</p>}
            </div>
          </div>

          {malumot.ijarachi.qora_royxat ? (
            <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">
              Bu ijarachi qora ro&apos;yxatda — unga yangi shartnoma tuzilmaydi.
            </p>
          ) : null}

          <div>
            <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-xira">Shartnomalari</h4>
            {malumot.shartnomalar.length ? (
              <Jadval eng={560} ustunlar={["Shartnoma", "Obyekt", "Muddat", "Holat", { nom: "Oylik", ong: true }]}>
                {malumot.shartnomalar.map((s) => (
                  <tr key={s.id}>
                    <td className={KATAK}>{s.raqam}</td>
                    <td className={KATAK}>
                      <Link href={`/rastalar/${s.rasta_id}`} className="hover:text-asos" onClick={yop}>
                        {s.rasta_raqam}
                      </Link>
                      <span className="block text-[12px] text-xira">{s.bozor_nomi}</span>
                    </td>
                    <td className={`${KATAK} text-[12.5px] text-xira`}>
                      {sana(s.boshlanish)} — {s.tugash ? sana(s.tugash) : "…"}
                    </td>
                    <td className={KATAK}><Belgi tur={s.holat}>{HOLAT_NOMI[s.holat] ?? s.holat}</Belgi></td>
                    <td className={KATAK_ONG}>{pul(s.oylik_tolov)}</td>
                  </tr>
                ))}
              </Jadval>
            ) : <Bosh matn="Shartnoma yo'q" />}
          </div>

          {yozaOladi(men) && (
            <div className="flex justify-end gap-2 border-t border-chiziq pt-3">
              {malumot.ijarachi.qora_royxat
                ? <Tugma kichik uslub="ikkilamchi" onClick={() => setQoraOchiq(0)}>Qora ro&apos;yxatdan chiqarish</Tugma>
                : <Tugma kichik uslub="xatarli" onClick={() => setQoraOchiq(1)}>Qora ro&apos;yxatga kiritish</Tugma>}
            </div>
          )}
        </div>
      )}

      {qoraOchiq !== null && (
        <Tasdiq sarlavha={qoraOchiq ? "Qora ro'yxatga kiritish" : "Qora ro'yxatdan chiqarish"}
                xatarli={qoraOchiq === 1} tugmaMatn={qoraOchiq ? "Kiritish" : "Chiqarish"}
                tavsif={qoraOchiq
                  ? "Qora ro'yxatdagi ijarachiga yangi shartnoma tuzib bo'lmaydi. Mavjud shartnomalari o'z holicha qoladi."
                  : "Ijarachiga yana shartnoma tuzish mumkin bo'ladi."}
                sabab={{ yorliq: "Izoh", izoh: "Ixtiyoriy — kartochkada saqlanadi" }}
                yop={() => setQoraOchiq(null)}
                tasdiqla={async (izohMatni) => {
                  await yuborish(`/api/ijarachilar/${id}`,
                    izohMatni ? { qora_royxat: qoraOchiq, izoh: izohMatni } : { qora_royxat: qoraOchiq },
                    "PATCH");
                  qayta();
                  yangila();
                }} />
      )}
    </Modal>
  );
}
