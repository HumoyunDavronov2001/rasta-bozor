"use client";

import Link from "next/link";
import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { sana, vaqt } from "@/lib/format";
import type { Ariza } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KIRITISH_SINF, KIRITISH_TOR, Kartochka,
  Maydon, Modal, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";
import { Tasdiq } from "@/komponent/tasdiq";

const HOLAT_NOMI: Record<string, string> = {
  navbatda: "Navbatda", korilmoqda: "Ko'rib chiqilmoqda", qabul: "Qabul qilindi",
  rad: "Rad etildi", bekor: "Bekor qilindi",
};
const HOLAT_BELGISI: Record<string, string> = {
  navbatda: "bosh", korilmoqda: "ogoh", qabul: "faol", rad: "bekor", bekor: "xolis",
};
const MAQSADLAR = ["oziq-ovqat", "nooziq-ovqat", "ovqatlanish", "xizmat", "boshqa"];

export default function ArizalarSahifasi() {
  const { men, bozorSorov } = useMen();
  const [holat, setHolat] = useState("");
  const [yangi, setYangi] = useState(false);
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ arizalar: Ariza[] }>(
    `/api/arizalar?${bozorSorov}${holat ? `&holat=${holat}` : ""}`);

  const royxat = malumot?.arizalar ?? [];
  const kutayotgan = royxat.filter((a) => a.navbat_orni).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Arizalar navbati</h1>
          <p className="mt-1 text-sm text-xira">
            Bo&apos;sh joy so&apos;raganlar <b>tartib bilan</b> yoziladi. Navbat o&apos;rni
            ko&apos;rinib turadi, rad etish esa <b>sababsiz</b> bo&apos;lmaydi — ikkalasi ham
            jurnalga tushadi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={holat} onChange={(e) => setHolat(e.target.value)} className={KIRITISH_TOR}>
            <option value="">Barcha arizalar</option>
            {Object.entries(HOLAT_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {yozaOladi(men) && <Tugma onClick={() => setYangi(true)}>+ Ariza qabul qilish</Tugma>}
        </div>
      </div>

      <div className="space-y-2 sm:hidden">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !royxat.length ? <Bosh matn="Ariza yo'q" /> :
          royxat.map((a) => (
            <MobilKarta key={a.id}
                        sarlavha={<>
                          {a.navbat_orni && (
                            <span className="mr-1 inline-flex h-5 w-5 items-center justify-center
                                             rounded-full bg-asos-och text-[11px] font-semibold text-asos">
                              {a.navbat_orni}
                            </span>
                          )}
                          {a.fio}
                        </>}
                        belgi={<Belgi tur={HOLAT_BELGISI[a.holat] ?? "xolis"}>{HOLAT_NOMI[a.holat]}</Belgi>}
                        tavsif={<>
                          {a.faoliyat ?? "faoliyat ko'rsatilmagan"}
                          {a.telefon && (
                            <a href={`tel:${a.telefon}`} className="ml-1 text-asos underline">{a.telefon}</a>
                          )}
                          <span className="block">{sana(a.yaratilgan)} · {a.raqam}</span>
                          {a.qaror_izoh && <span className="block text-sariq">{a.qaror_izoh}</span>}
                        </>}
                        amallar={yozaOladi(men) && ["navbatda", "korilmoqda"].includes(a.holat)
                          ? <Qarorlar ariza={a} qayta={qayta} /> : undefined} />
          ))}
      </div>

      <Kartochka sinf="hidden sm:block" ong={<span className="text-[12.5px] text-xira">
                        Navbatda: <b>{kutayotgan}</b> · jami {royxat.length}
                      </span>}>
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !royxat.length ? <Bosh matn="Ariza yo'q" /> : (
            <Jadval eng={980} ustunlar={["№", "Ariza beruvchi", "Faoliyat", "So'ralgan joy",
                                         "Kelgan sana", "Holat", ""]}>
              {royxat.map((a) => (
                <tr key={a.id} className="hover:bg-fon">
                  <td className={KATAK}>
                    {a.navbat_orni ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full
                                       bg-asos-och text-[12px] font-semibold text-asos">
                        {a.navbat_orni}
                      </span>
                    ) : <span className="text-xira">—</span>}
                    <span className="ml-2 text-[12px] text-xira">{a.raqam}</span>
                  </td>
                  <td className={KATAK}>
                    <span className="font-medium">{a.fio}</span>
                    <span className="block text-[12px] text-xira">{a.telefon ?? ""}</span>
                  </td>
                  <td className={`${KATAK} text-[13px]`}>
                    {a.faoliyat ?? "—"}
                    {a.maqsad && <span className="block text-[12px] text-xira">{a.maqsad}</span>}
                  </td>
                  <td className={`${KATAK} text-[13px]`}>{a.istalgan ?? "—"}</td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>{sana(a.yaratilgan)}</td>
                  <td className={KATAK}>
                    <Belgi tur={HOLAT_BELGISI[a.holat] ?? "xolis"}>{HOLAT_NOMI[a.holat]}</Belgi>
                    {a.qaror_izoh && (
                      <span className="block max-w-[220px] text-[12px] text-xira">{a.qaror_izoh}</span>
                    )}
                    {a.shartnoma_raqam && (
                      <Link href={`/shartnomalar?tanlangan=${a.shartnoma_id}`}
                            className="block text-[12px] text-asos underline">
                        {a.shartnoma_raqam} {a.rasta_raqam ? `· ${a.rasta_raqam}` : ""}
                      </Link>
                    )}
                    {a.qaror_fio && (
                      <span className="block text-[11.5px] text-xira">
                        {a.qaror_fio} · {vaqt(a.qaror_vaqt)}
                      </span>
                    )}
                  </td>
                  <td className={KATAK}>
                    {yozaOladi(men) && ["navbatda", "korilmoqda"].includes(a.holat) && (
                      <Qarorlar ariza={a} qayta={qayta} />
                    )}
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
      </Kartochka>

      {yangi && <YangiAriza yop={() => setYangi(false)}
                            tayyor={() => { setYangi(false); qayta(); }} />}
    </div>
  );
}

function Qarorlar({ ariza, qayta }: { ariza: Ariza; qayta: () => void }) {
  const [qaror, setQaror] = useState<"qabul" | "rad" | "korilmoqda" | null>(null);

  async function yubor(holat: string, izoh: string) {
    await yuborish(`/api/arizalar/${ariza.id}/qaror`, { holat, izoh });
    qayta();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ariza.holat === "navbatda" && (
        <Tugma kichik uslub="ikkilamchi" onClick={() => setQaror("korilmoqda")}>
          Ko&apos;rib chiqish
        </Tugma>
      )}
      <Tugma kichik onClick={() => setQaror("qabul")}>Qabul</Tugma>
      <Tugma kichik uslub="xatarli" onClick={() => setQaror("rad")}>Rad</Tugma>

      {qaror === "korilmoqda" && (
        <Tasdiq sarlavha="Ko'rib chiqishga olish" tugmaMatn="Olish"
                tavsif={<>Ariza <b>{ariza.raqam}</b> ko&apos;rib chiqilmoqda deb belgilanadi.
                          U navbatda qoladi.</>}
                sabab={{ yorliq: "Izoh", izoh: "ixtiyoriy" }}
                yop={() => setQaror(null)}
                tasdiqla={async (izoh) => { await yubor("korilmoqda", izoh); }} />
      )}
      {qaror === "qabul" && (
        <Tasdiq sarlavha="Arizani qabul qilish" tugmaMatn="Qabul qilish"
                tavsif={<>
                  <b>{ariza.fio}</b> ning arizasi qabul qilingan deb belgilanadi va u
                  navbatdan chiqadi. Shartnoma alohida tuziladi — bu amal shartnoma
                  yaratmaydi.
                </>}
                sabab={{ yorliq: "Izoh", izoh: "qaysi obyekt taklif qilindi" }}
                yop={() => setQaror(null)}
                tasdiqla={async (izoh) => { await yubor("qabul", izoh); }} />
      )}
      {qaror === "rad" && (
        <Tasdiq sarlavha="Arizani rad etish" tugmaMatn="Rad etish" xatarli
                tavsif={<><b>{ariza.fio}</b> ning arizasi rad etiladi. Sabab arizada
                          va jurnalda qoladi.</>}
                sabab={{ yorliq: "Rad etish sababi", izoh: "majburiy, kamida 5 belgi",
                         majburiy: true, minUzunlik: 5 }}
                yop={() => setQaror(null)}
                tasdiqla={async (izoh) => { await yubor("rad", izoh); }} />
      )}
    </div>
  );
}

function YangiAriza({ yop, tayyor }: { yop: () => void; tayyor: () => void }) {
  const { bozorId, bozorlar } = useMen();
  const [m, setM] = useState({
    fio: "", telefon: "", stir: "", faoliyat: "", maqsad: "", istalgan: "", izoh: "",
  });
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const bozor = bozorId ?? bozorlar[0]?.id ?? null;

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      await yuborish("/api/arizalar", { ...m, bozor_id: bozor });
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha="Yangi ariza" yop={yop}>
      <form onSubmit={joniat} className="space-y-3">
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Ariza navbat raqamini oladi. Navbat <b>kelish tartibida</b> — ro&apos;yxatda
          kim oldin kelgani ko&apos;rinib turadi.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="F.I.Sh.">
            <input className={KIRITISH_SINF} value={m.fio} autoFocus maxLength={200}
                   onChange={(e) => setM({ ...m, fio: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Telefon">
            <input className={KIRITISH_SINF} value={m.telefon} maxLength={30}
                   placeholder="+998 90 123 45 67"
                   onChange={(e) => setM({ ...m, telefon: e.target.value })} />
          </Maydon>
          <Maydon yorliq="STIR / JSHSHIR" izoh="ixtiyoriy">
            <input className={KIRITISH_SINF} value={m.stir} maxLength={20}
                   onChange={(e) => setM({ ...m, stir: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Faoliyat turi" izoh="nima sotmoqchi">
            <input className={KIRITISH_SINF} value={m.faoliyat} maxLength={200}
                   onChange={(e) => setM({ ...m, faoliyat: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Faoliyat maqsadi">
            <select className={KIRITISH_SINF} value={m.maqsad}
                    onChange={(e) => setM({ ...m, maqsad: e.target.value })}>
              <option value="">— ko&apos;rsatilmagan —</option>
              {MAQSADLAR.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="So'ralgan joy" izoh="blok yoki rasta raqami, ixtiyoriy">
            <input className={KIRITISH_SINF} value={m.istalgan} maxLength={200}
                   onChange={(e) => setM({ ...m, istalgan: e.target.value })} />
          </Maydon>
        </div>
        <Maydon yorliq="Izoh" izoh="ixtiyoriy">
          <input className={KIRITISH_SINF} value={m.izoh} maxLength={500}
                 onChange={(e) => setM({ ...m, izoh: e.target.value })} />
        </Maydon>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda || m.fio.trim().length < 3 || !bozor}>
            {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Navbatga qo'shish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}
