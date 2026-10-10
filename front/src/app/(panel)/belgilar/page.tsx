"use client";

import Link from "next/link";
import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { sana, vaqt } from "@/lib/format";
import {
  Aylanma, Belgi as Nishon, Bosh, Jadval, KATAK, KIRITISH_SINF, KIRITISH_TOR, Kartochka,
  Korsatkich, Maydon, Modal, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";

type BelgiQator = {
  id: number; sana: string; tur: string; izoh: string; holat: string;
  faol_kadr: number; dalil_soni: number; birinchi_vaqt: string; oxirgi_vaqt: string;
  rasta_raqam: string; blok_nomi: string | null; bozor_nomi: string;
  qaror_izoh: string | null; qaror_fio: string | null; qaror_vaqt: string | null;
  rasta_id: number;
};
type Dalil = { id: number; vaqt: string; yol: string; odam_soni: number; kamera_nomi: string };
type Tafsilot = {
  belgi: BelgiQator & { bozor_id: number };
  dalillar: Dalil[];
  hozirgi_holat: { tur: string | null; shartnoma?: string; izoh?: string };
};

const TUR_NOMI: Record<string, string> = {
  shartnomasiz: "Shartnomasiz",
  toxtatilgan: "To'xtatilgan shartnoma",
  kunlik_tolanmagan: "Kunlik haq to'lanmagan",
};
const HOLAT_NOMI: Record<string, string> = {
  yangi: "Yangi", tekshirilmoqda: "Tekshirilmoqda",
  tasdiqlandi: "Tasdiqlandi", rad_etildi: "Rad etildi",
};
const HOLAT_BELGI: Record<string, string> = {
  yangi: "ogoh", tekshirilmoqda: "kok", tasdiqlandi: "qizil", rad_etildi: "xolis",
};

export default function BelgilarSahifasi() {
  const { bozorId } = useMen();
  const [holat, setHolat] = useState("");
  const [tanlangan, setTanlangan] = useState<number | null>(null);

  const sorov = new URLSearchParams({ chegara: "200" });
  if (bozorId) sorov.set("bozor", String(bozorId));
  if (holat) sorov.set("holat", holat);
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{
    belgilar: BelgiQator[]; jamlanma: Record<string, number>;
  }>(`/api/belgilar?${sorov}`);

  const royxat = malumot?.belgilar ?? [];
  const jamlanma = malumot?.jamlanma ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Tekshirish uchun belgilar</h1>
          <p className="mt-1 text-sm text-xira">
            Kamera zonada faollik ko&apos;rdi, daftarda esa to&apos;lov yo&apos;q. Bu{" "}
            <b>ayblov emas</b> — joyida tekshirilishi kerak bo&apos;lgan holat.
          </p>
        </div>
        <select value={holat} onChange={(e) => setHolat(e.target.value)} className={KIRITISH_TOR}>
          <option value="">Barcha holatlar</option>
          {Object.entries(HOLAT_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Korsatkich nom="Yangi" qiymat={String(jamlanma.yangi ?? 0)} rang="sariq"
                    izoh="hali ko'rib chiqilmagan" />
        <Korsatkich nom="Tekshirilmoqda" qiymat={String(jamlanma.tekshirilmoqda ?? 0)} rang="kok" />
        <Korsatkich nom="Tasdiqlangan" qiymat={String(jamlanma.tasdiqlandi ?? 0)} rang="qizil"
                    izoh="ma'mur joyida tasdiqlagan" />
        <Korsatkich nom="Rad etilgan" qiymat={String(jamlanma.rad_etildi ?? 0)}
                    izoh="yolg'on signal bo'lib chiqqan" />
      </div>

      <div className="space-y-2 sm:hidden">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !royxat.length ? (
            <Bosh matn="Belgi yo'q. Kamera faollik ko'rmagan yoki barcha to'lovlar joyida." />
          ) : royxat.map((b) => (
            <MobilKarta key={b.id} bos={() => setTanlangan(b.id)}
                        sarlavha={b.rasta_raqam}
                        belgi={<Nishon tur={HOLAT_BELGI[b.holat] ?? "xolis"}>
                                 {HOLAT_NOMI[b.holat] ?? b.holat}
                               </Nishon>}
                        tavsif={<>
                          {TUR_NOMI[b.tur] ?? b.tur} · {b.faol_kadr} kadr · {b.dalil_soni} dalil
                          <span className="block">
                            {sana(b.sana)} · {vaqt(b.birinchi_vaqt).slice(-5)}–{vaqt(b.oxirgi_vaqt).slice(-5)}
                          </span>
                          {b.qaror_fio && (
                            <span className="block text-xira">{b.qaror_fio}: {b.qaror_izoh}</span>
                          )}
                        </>} />
          ))}
      </div>

      <Kartochka sinf="hidden sm:block">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !royxat.length ? (
            <Bosh matn="Belgi yo'q. Kamera faollik ko'rmagan yoki barcha to'lovlar joyida." />
          ) : (
            <Jadval eng={940} ustunlar={["Sana", "Obyekt", "Sabab", "Faollik", "Dalil",
              "Holat", "Qaror", ""]}>
              {royxat.map((b) => (
                <tr key={b.id} className="hover:bg-fon">
                  <td className={KATAK}>{sana(b.sana)}</td>
                  <td className={KATAK}>
                    <Link href={`/rastalar/${b.rasta_id}`} className="font-medium hover:text-asos">
                      {b.rasta_raqam}
                    </Link>
                    <span className="block text-[12px] text-xira">{b.blok_nomi ?? b.bozor_nomi}</span>
                  </td>
                  <td className={KATAK}>
                    <Nishon tur={b.tur === "shartnomasiz" ? "qizil" : "ogoh"}>
                      {TUR_NOMI[b.tur] ?? b.tur}
                    </Nishon>
                  </td>
                  <td className={`${KATAK} raqam text-[12.5px] text-xira`}>
                    {b.faol_kadr} kadr
                    <span className="block">{vaqt(b.birinchi_vaqt).slice(-5)}–{vaqt(b.oxirgi_vaqt).slice(-5)}</span>
                  </td>
                  <td className={`${KATAK} text-center raqam`}>{b.dalil_soni}</td>
                  <td className={KATAK}>
                    <Nishon tur={HOLAT_BELGI[b.holat] ?? "xolis"}>{HOLAT_NOMI[b.holat] ?? b.holat}</Nishon>
                  </td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>
                    {b.qaror_fio ? <>{b.qaror_fio}<span className="block">{b.qaror_izoh}</span></> : "—"}
                  </td>
                  <td className={KATAK}>
                    <button onClick={() => setTanlangan(b.id)}
                            className="text-[13px] text-asos hover:underline">Ko&apos;rib chiqish</button>
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
      </Kartochka>

      <p className="text-[12px] leading-relaxed text-xira">
        Belgi kamida 3 ta kadrda (~15 daqiqa) faollik ko&apos;rilgandan keyin yaratiladi.
        Model odamni topadi — savdoni emas, shuning uchun belgi avtomatik tasdiqlanmaydi
        va hech qanday jarima yozilmaydi. Qaror faqat ma&apos;mur tomonidan qabul qilinadi.
      </p>

      {tanlangan && (
        <BelgiOynasi id={tanlangan} yop={() => setTanlangan(null)} tayyor={qayta} />
      )}
    </div>
  );
}

function BelgiOynasi({ id, yop, tayyor }: { id: number; yop: () => void; tayyor: () => void }) {
  const { men } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<Tafsilot>(`/api/belgilar/${id}`);
  const [qaror, setQaror] = useState("");
  const [izoh, setIzoh] = useState("");
  const [amalXato, setAmalXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function yubor() {
    setAmalXato(null);
    setIshlamoqda(true);
    try {
      await yuborish(`/api/belgilar/${id}/qaror`, { qaror, izoh });
      qayta();
      tayyor();
      setQaror("");
      setIzoh("");
    } catch (e) {
      setAmalXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha="Belgini ko'rib chiqish" yop={yop} keng>
      {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> : !malumot ? <Bosh /> : (
        <div className="space-y-4">
          <div className="rounded-lg bg-fon px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[17px] font-semibold">{malumot.belgi.rasta_raqam}</p>
              <Nishon tur={HOLAT_BELGI[malumot.belgi.holat] ?? "xolis"}>
                {HOLAT_NOMI[malumot.belgi.holat]}
              </Nishon>
            </div>
            <p className="mt-1 text-[13px] text-xira">
              {malumot.belgi.blok_nomi ?? malumot.belgi.bozor_nomi} · {sana(malumot.belgi.sana)}
            </p>
            <p className="mt-2 text-sm">{malumot.belgi.izoh}</p>
            <p className="mt-1 text-[12.5px] text-xira">
              {malumot.belgi.faol_kadr} ta kadrda faollik ({vaqt(malumot.belgi.birinchi_vaqt)} —{" "}
              {vaqt(malumot.belgi.oxirgi_vaqt)})
            </p>
          </div>

          <div className="rounded-lg border border-chiziq px-4 py-3">
            <p className="text-[13px] font-medium">Hozirgi to&apos;lov holati</p>
            <p className="mt-1 text-[13px] text-xira">
              {malumot.hozirgi_holat.tur === null
                ? "To'lov joyida — belgi yaratilgandan keyin to'langan bo'lishi mumkin."
                : malumot.hozirgi_holat.shartnoma
                  ? <>Shartnoma {malumot.hozirgi_holat.shartnoma}</>
                  : malumot.hozirgi_holat.izoh}
            </p>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-xira">
              Dalil kadrlari ({malumot.dalillar.length})
            </p>
            {!malumot.dalillar.length ? <Bosh matn="Kadr biriktirilmagan" /> : (
              <div className="grid gap-2 sm:grid-cols-3">
                {malumot.dalillar.map((d) => (
                  <a key={d.id} href={`/api/fayl/${d.yol}`} target="_blank" rel="noreferrer"
                     className="block overflow-hidden rounded-lg border border-chiziq">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/fayl/${d.yol}`} alt={`Kadr ${vaqt(d.vaqt)}`}
                         className="block aspect-video w-full object-cover" />
                    <p className="px-2 py-1.5 text-[11.5px] text-xira">
                      {vaqt(d.vaqt)} · {d.kamera_nomi}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>

          {yozaOladi(men) && (
            <div className="space-y-3 rounded-lg border border-chiziq p-4">
              <p className="text-[13px] font-medium">Qaror</p>
              <div className="flex flex-wrap gap-2">
                {(["tekshirilmoqda", "tasdiqlandi", "rad_etildi"] as const).map((q) => (
                  <button key={q} type="button" onClick={() => setQaror(q)}
                          className={`rounded-lg border px-3 py-1.5 text-[13px] ${
                            qaror === q ? "border-asos bg-asos-och text-asos" : "border-chiziq hover:bg-fon"}`}>
                    {HOLAT_NOMI[q]}
                  </button>
                ))}
              </div>
              <Maydon yorliq="Izoh"
                      izoh="Tasdiqlash yoki rad etishda majburiy — nima ko'rilgani yozilsin">
                <input className={KIRITISH_SINF} value={izoh} onChange={(e) => setIzoh(e.target.value)}
                       placeholder="Masalan: joyida tekshirildi, savdo qilinmayapti" />
              </Maydon>
              {amalXato && (
                <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">
                  {amalXato}
                </p>
              )}
              <div className="flex justify-end">
                <Tugma onClick={yubor} disabled={ishlamoqda || !qaror}>
                  {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Qarorni yozish"}
                </Tugma>
              </div>
            </div>
          )}

          <p className="text-[12px] leading-relaxed text-xira">
            Qaror jurnalga yoziladi: kim, qachon va nima asosda qaror qilgani saqlanadi.
            Tizim o&apos;zi hech kimni ayblamaydi va jarima yozmaydi.
          </p>
        </div>
      )}
    </Modal>
  );
}
