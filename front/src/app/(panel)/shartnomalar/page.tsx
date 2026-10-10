"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useKechiktir, useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi, tolovQabulQiladi } from "@/lib/kontekst";
import { bugun, pul, sana, HOLAT_NOMI } from "@/lib/format";
import type { Ijarachi, Rasta, Shartnoma, TolovTaklif } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_SINF, KIRITISH_TOR, Kartochka,
  Maydon, Modal, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { TolovModal } from "@/komponent/tolov-modal";

export default function ShartnomalarSahifasi() {
  return <Suspense fallback={<Yuklanmoqda />}><Ichki /></Suspense>;
}

function Ichki() {
  const parametr = useSearchParams();
  const { men, bozorId } = useMen();
  // Holat manzildan olinadi (masalan panel havolasi tugagan shartnomalarni ochadi).
  // DIQQAT: `parametr.get()` null qaytaradi — uni to'g'ridan-to'g'ri holatga
  // yozib bo'lmaydi, aks holda <select value={null}> bo'lib qoladi.
  const holatParam = parametr.get("holat");
  const [holat, setHolat] = useState(
    holatParam && ["faol", "tugagan", "bekor"].includes(holatParam) ? holatParam : "faol");
  const [q, setQ] = useState("");
  const qKechikkan = useKechiktir(q);
  const [yangiOchiq, setYangiOchiq] = useState(!!parametr.get("rasta"));
  const [tolovUchun, setTolovUchun] = useState<Shartnoma | null>(null);

  const sorov = new URLSearchParams({ chegara: "300" });
  if (bozorId) sorov.set("bozor", String(bozorId));
  if (holat) sorov.set("holat", holat);
  if (qKechikkan.trim()) sorov.set("q", qKechikkan.trim());
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ shartnomalar: Shartnoma[] }>(
    `/api/shartnomalar?${sorov}`);

  const royxat = malumot?.shartnomalar ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Ijara shartnomalari</h1>
          <p className="mt-1 text-sm text-xira">
            {royxat.length} ta shartnoma · oylik to&apos;lovlar jami{" "}
            {pul(royxat.filter((x) => x.holat === "faol").reduce((s, x) => s + x.oylik_tolov, 0))} so&apos;m
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ijarachi, rasta, shartnoma…"
                 className={`${KIRITISH_TOR} w-60`} />
          <select value={holat} onChange={(e) => setHolat(e.target.value)} className={KIRITISH_TOR}>
            <option value="">Barchasi</option>
            <option value="faol">Faol</option>
            <option value="tugagan">Tugagan</option>
          </select>
          {yozaOladi(men) && <Tugma onClick={() => setYangiOchiq(true)}>+ Yangi shartnoma</Tugma>}
        </div>
      </div>

      <Kartochka>
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !royxat.length ? <Bosh matn="Shartnoma topilmadi" /> : (
            <Jadval eng={860} ustunlar={["Shartnoma", "Obyekt", "Ijarachi", "Muddat", "Holat",
              { nom: "Oylik", ong: true }, { nom: "To'langan", ong: true }, ""]}>
              {royxat.map((s) => (
                <tr key={s.id} className="hover:bg-fon">
                  <td className={KATAK}>
                    <span className="font-medium">{s.raqam}</span>
                    <span className="block text-[12px] text-xira">{s.bozor_nomi}</span>
                  </td>
                  <td className={KATAK}>
                    <Link href={`/rastalar/${s.rasta_id}`} className="hover:text-asos">{s.rasta_raqam}</Link>
                    <span className="block text-[12px] text-xira">{s.blok_nomi ?? ""}</span>
                  </td>
                  <td className={KATAK}>
                    <Link href={`/ijarachilar?tanlangan=${s.ijarachi_id}`} className="hover:text-asos">{s.ijarachi_fio}</Link>
                    <span className="block text-[12px] text-xira">{s.ijarachi_telefon ?? ""}</span>
                  </td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>
                    {sana(s.boshlanish)}<br />{s.tugash ? sana(s.tugash) : "muddatsiz"}
                  </td>
                  <td className={KATAK}><Belgi tur={s.holat}>{HOLAT_NOMI[s.holat] ?? s.holat}</Belgi></td>
                  <td className={KATAK_ONG}>{pul(s.oylik_tolov)}</td>
                  <td className={KATAK_ONG}>{pul(s.tolangan)}</td>
                  <td className={KATAK}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {s.holat === "faol" && tolovQabulQiladi(men) && (
                        <Tugma kichik uslub="ikkilamchi" onClick={() => setTolovUchun(s)}>To&apos;lov</Tugma>
                      )}
                      {yozaOladi(men) && <Hujjatlar shartnoma={s} />}
                      {yozaOladi(men) && s.holat === "faol" && (
                        <Boshqaruv shartnoma={s} qayta={qayta} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
      </Kartochka>

      {yangiOchiq && (
        <YangiShartnoma boshlangichRasta={parametr.get("rasta") ? Number(parametr.get("rasta")) : null}
                        yop={() => setYangiOchiq(false)} tayyor={qayta} />
      )}
      {tolovUchun && (
        <TolovModal shartnomaId={tolovUchun.id}
                    sarlavha={`${tolovUchun.rasta_raqam} · ${tolovUchun.ijarachi_fio}`}
                    oylik={tolovUchun.oylik_tolov}
                    yop={() => setTolovUchun(null)} tayyor={qayta} />
      )}
    </div>
  );
}

function YangiShartnoma({ boshlangichRasta, yop, tayyor }: {
  boshlangichRasta: number | null; yop: () => void; tayyor: () => void;
}) {
  const { bozorId } = useMen();
  const [rastaId, setRastaId] = useState<number | null>(boshlangichRasta);
  const [ijarachiQidiruv, setIjarachiQidiruv] = useState("");
  const [ijarachiId, setIjarachiId] = useState<number | null>(null);
  // Sukut — BUGUN. Ilgari oyning 1-kuni edi: 26-sanada tuzilgan shartnoma
  // jimgina 25 kun orqaga surilib, shartnoma yo'q kunlar uchun ham ijara yozilardi.
  const [boshlanish, setBoshlanish] = useState(bugun());
  const [tugash, setTugash] = useState("");
  const [oylik, setOylik] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [natija, setNatija] = useState<{ id: number; raqam: string } | null>(null);
  // Tarif bo'yicha oylik to'lov TAKLIFI: rasta tanlangach so'raladi, hech narsa yozilmaydi
  const taklif = useMalumot<TolovTaklif>(rastaId ? `/api/rastalar/${rastaId}/tolov-taklif` : null);

  const boshSorov = new URLSearchParams({ holat: "bosh", chegara: "500" });
  if (bozorId) boshSorov.set("bozor", String(bozorId));
  const bosh = useMalumot<{ rastalar: Rasta[] }>(`/api/rastalar?${boshSorov}`);
  const ijarachiKechikkan = useKechiktir(ijarachiQidiruv);
  const ijarachilar = useMalumot<{ ijarachilar: Ijarachi[] }>(
    `/api/ijarachilar?chegara=25${ijarachiKechikkan.trim() ? `&q=${encodeURIComponent(ijarachiKechikkan.trim())}` : ""}`);

  const tanlanganRasta = bosh.malumot?.rastalar.find((r) => r.id === rastaId) ?? null;

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setYuborilmoqda(true);
    try {
      const javob = await yuborish<{ id: number; raqam: string }>("/api/shartnomalar", {
        rasta_id: rastaId, ijarachi_id: ijarachiId, boshlanish,
        tugash: tugash || null,
        oylik_tolov: oylik ? Number(oylik.replace(/\s/g, "")) : (tanlanganRasta?.oylik_narx ?? 0),
      });
      setNatija(javob);
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
      setYuborilmoqda(false);
    }
  }

  if (natija) {
    return (
      <Modal sarlavha="Shartnoma tuzildi" yop={yop}>
        <div className="space-y-3 text-sm">
          <p><b>{natija.raqam}</b> saqlandi, obyekt «band» holatiga o&apos;tdi.</p>
          <p className="rounded-lg bg-fon px-3 py-2 text-[13px] text-xira">
            Oylik to&apos;lov shartnomada kelishildi. Pul faqat haqiqiy to&apos;lov qabul
            qilinganda hisobga kiradi.
          </p>
          <div className="flex justify-end">
            <Tugma onClick={yop}>Yopish</Tugma>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal sarlavha="Yangi ijara shartnomasi" yop={yop} keng>
      <form onSubmit={joniat} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Bo'sh obyekt" izoh={bosh.yuklanmoqda ? "yuklanmoqda…" : `${bosh.malumot?.rastalar.length ?? 0} ta bo'sh joy`}>
            <select className={KIRITISH_SINF} value={rastaId ?? ""} required
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setRastaId(id);
                      const r = bosh.malumot?.rastalar.find((x) => x.id === id);
                      if (r) setOylik(String(r.oylik_narx));
                    }}>
              <option value="">— tanlang —</option>
              {bosh.malumot?.rastalar.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.raqam} · {r.blok_nomi ?? r.bozor_nomi} · {pul(r.oylik_narx)} so&apos;m
                </option>
              ))}
            </select>
          </Maydon>

          <Maydon yorliq="Ijarachi" izoh="Ro'yxatda yo'q bo'lsa — avval «Ijarachilar» bo'limida qo'shing">
            <input className={`${KIRITISH_SINF} mb-2`} value={ijarachiQidiruv} placeholder="Ism yoki telefon bo'yicha qidirish"
                   onChange={(e) => setIjarachiQidiruv(e.target.value)} />
            <select className={KIRITISH_SINF} value={ijarachiId ?? ""} required size={5}
                    onChange={(e) => setIjarachiId(Number(e.target.value))}>
              {ijarachilar.malumot?.ijarachilar.map((i) => (
                <option key={i.id} value={i.id}>{i.fio}{i.telefon ? ` · ${i.telefon}` : ""}</option>
              ))}
            </select>
          </Maydon>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Maydon yorliq="Boshlanish sanasi">
            <input className={KIRITISH_SINF} type="date" value={boshlanish} required
                   onChange={(e) => setBoshlanish(e.target.value)} />
          </Maydon>
          <Maydon yorliq="Tugash sanasi" izoh="bo'sh = muddatsiz">
            <input className={KIRITISH_SINF} type="date" value={tugash}
                   onChange={(e) => setTugash(e.target.value)} />
          </Maydon>
          <Maydon yorliq="Oylik to'lov (so'm)" izoh={tanlanganRasta ? `rasta narxi: ${pul(tanlanganRasta.oylik_narx)}` : undefined}>
            <input className={KIRITISH_SINF} inputMode="numeric" value={oylik}
                   onChange={(e) => setOylik(e.target.value.replace(/[^\d]/g, ""))} />
          </Maydon>
        </div>

        {rastaId && taklif.malumot && (
          <TaklifBloki taklif={taklif.malumot} qollash={(s) => setOylik(String(s))} />
        )}

        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Shartnoma saqlangach obyekt «band» holatiga o&apos;tadi. Oylik to&apos;lov — kelishuv
          summasi: qo&apos;lda kiriting yoki tarif bo&apos;yicha taklifni qo&apos;llang.
        </p>

        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}

        <div className="flex justify-end gap-2">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={yuborilmoqda || !rastaId || !ijarachiId}>
            {yuborilmoqda ? <><Aylanma /> Tuzilmoqda…</> : "Shartnomani tuzish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

/* ── Chop etiladigan hujjatlar ────────────────────────────────────────── */
function Hujjatlar({ shartnoma }: { shartnoma: Shartnoma }) {
  const [ochiq, setOchiq] = useState(false);

  /** Hujjat yangi oynada ochiladi — u chop etish uchun tayyor HTML. */
  function och(tur: string, qoshimcha = "") {
    window.open(`/api/shartnomalar/${shartnoma.id}/hujjat?tur=${tur}${qoshimcha}`, "_blank");
  }

  return (
    <>
      <Tugma kichik uslub="ikkilamchi" onClick={() => setOchiq(true)}>Hujjat</Tugma>
      {ochiq && (
        <Modal sarlavha={`${shartnoma.raqam} — hujjatlar`} yop={() => setOchiq(false)}>
          <div className="space-y-3">
            <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
              Hujjat <b>imzosiz va muhrsiz</b> chiqadi — tizim imzo qo&apos;ymaydi.
              Ma&apos;lumot yetishmasa bo&apos;sh chiziq qoladi, dastur uni to&apos;ldirmaydi.
              Har bir chiqarilgan hujjat jurnalga yoziladi.
            </p>
            <div className="space-y-2">
              <button onClick={() => och("shartnoma")}
                      className="w-full rounded-lg border border-chiziq px-3 py-2.5 text-left text-sm hover:bg-fon">
                <b>Shartnoma rekvizitlari</b>
                <span className="block text-[12.5px] text-xira">
                  Tomonlar, obyekt, muddat va to&apos;lov — chop etib imzolash uchun
                </span>
              </button>
              <button onClick={() => och("dalolatnoma", "&yonalish=topshirish")}
                      className="w-full rounded-lg border border-chiziq px-3 py-2.5 text-left text-sm hover:bg-fon">
                <b>Topshirish-qabul dalolatnomasi</b>
                <span className="block text-[12.5px] text-xira">
                  Obyekt ijarachiga topshirilganda
                </span>
              </button>
              <button onClick={() => och("dalolatnoma", "&yonalish=qaytarish")}
                      className="w-full rounded-lg border border-chiziq px-3 py-2.5 text-left text-sm hover:bg-fon">
                <b>Qaytarish dalolatnomasi</b>
                <span className="block text-[12.5px] text-xira">
                  Shartnoma tugaganda obyekt qaytarilganini qayd etish uchun
                </span>
              </button>
            </div>
            <div className="flex justify-end">
              <Tugma uslub="ikkilamchi" onClick={() => setOchiq(false)}>Yopish</Tugma>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ── Tarif bo'yicha oylik to'lov taklifi ─────────────────────────────── */
function TaklifBloki({ taklif, qollash }: { taklif: TolovTaklif; qollash: (s: number) => void }) {
  const TUR: Record<string, string> = { ijara: "Ijara", majburiy_xizmat: "Majburiy xizmat haqi" };
  return (
    <div className="rounded-lg border border-chiziq px-3 py-2.5 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          Tarif bo&apos;yicha taklif:{" "}
          {taklif.summa != null
            ? <span className="raqam text-asos">{pul(taklif.summa)} so&apos;m / oy</span>
            : <span className="text-xira">taklif yo&apos;q</span>}
        </p>
        {taklif.summa != null && (
          <Tugma type="button" kichik uslub="ikkilamchi" onClick={() => qollash(taklif.summa as number)}>
            Qo&apos;llash
          </Tugma>
        )}
      </div>
      {taklif.rejim !== "bozor_balansida" && (
        <p className="mt-1 text-[12.5px] text-sariq">{taklif.rejim_izohi}</p>
      )}
      <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-xira">
        {taklif.qatorlar.map((q, i) => (
          <li key={`${q.tur}-${i}`}>
            {TUR[q.tur] ?? q.tur}: {q.summa != null ? `${pul(q.summa)} so'm — ` : ""}{q.izoh}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Ko'chirish ───────────────────────────────────────────────────────── */
function Boshqaruv({ shartnoma, qayta }: { shartnoma: Shartnoma; qayta: () => void }) {
  const [ochiq, setOchiq] = useState(false);
  return (
    <>
      <Tugma kichik uslub="ikkilamchi" onClick={() => setOchiq(true)}>Ko&apos;chirish</Tugma>
      {ochiq && (
        <KochirishOynasi shartnoma={shartnoma} yop={() => setOchiq(false)}
                         tayyor={() => { setOchiq(false); qayta(); }} />
      )}
    </>
  );
}

function KochirishOynasi({ shartnoma, yop, tayyor }: {
  shartnoma: Shartnoma; yop: () => void; tayyor: () => void;
}) {
  const bosh = useMalumot<{ rastalar: Rasta[] }>("/api/rastalar?holat=bosh&chegara=500");
  const [rastaId, setRastaId] = useState("");
  const [sabab, setSabab] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      await yuborish(`/api/shartnomalar/${shartnoma.id}/kochirish`,
                     { rasta_id: Number(rastaId), sabab });
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha={`${shartnoma.raqam} — boshqa rastaga ko'chirish`} yop={yop}>
      <form onSubmit={joniat} className="space-y-3">
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Shartnoma <b>saqlanadi</b>, faqat obyekt almashadi: eski rasta bo&apos;shaydi,
          yangisi band bo&apos;ladi. Ko&apos;chish tarixi va sababi saqlanadi.
        </p>
        <Maydon yorliq="Hozirgi obyekt">
          <input className={KIRITISH_SINF} value={shartnoma.rasta_raqam ?? ""} disabled />
        </Maydon>
        <Maydon yorliq="Yangi obyekt" izoh="faqat bo'sh rastalar ko'rsatiladi">
          <select className={KIRITISH_SINF} value={rastaId} autoFocus
                  onChange={(e) => setRastaId(e.target.value)}>
            <option value="">— tanlang —</option>
            {(bosh.malumot?.rastalar ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.raqam}{r.blok_nomi ? ` · ${r.blok_nomi}` : ""}
                {r.maydon ? ` · ${r.maydon} m²` : ""}
              </option>
            ))}
          </select>
        </Maydon>
        <Maydon yorliq="Sabab" izoh="majburiy — jurnalga va ko'chish tarixiga yoziladi">
          <input className={KIRITISH_SINF} value={sabab} maxLength={300}
                 placeholder="masalan: eski rasta ta'mirga chiqdi"
                 onChange={(e) => setSabab(e.target.value)} />
        </Maydon>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda || !rastaId || sabab.trim().length < 5}>
            {ishlamoqda ? <><Aylanma /> Ko&apos;chirilmoqda…</> : "Ko'chirish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}
