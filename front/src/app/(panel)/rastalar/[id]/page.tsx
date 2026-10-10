"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi, tolovQabulQiladi } from "@/lib/kontekst";
import { pul, sana, HOLAT_NOMI, TUR_NOMI, USUL_NOMI } from "@/lib/format";
import type { HuquqiyRejim, Rasta, Shartnoma, Tolov } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_SINF, Kartochka, Korsatkich,
  Maydon, Modal, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { TolovModal } from "@/komponent/tolov-modal";
import { Tasdiq } from "@/komponent/tasdiq";

type Javob = { rasta: Rasta; shartnomalar: Shartnoma[]; joriy: Shartnoma | null; tolovlar: Tolov[] };

export default function RastaSahifasi() {
  const { id } = useParams<{ id: string }>();
  const { men } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<Javob>(`/api/rastalar/${id}`);
  const [tolovOchiq, setTolovOchiq] = useState(false);
  const [yakunOchiq, setYakunOchiq] = useState(false);

  if (yuklanmoqda) return <Yuklanmoqda />;
  if (xato) return <Xato matn={xato} qayta={qayta} />;
  if (!malumot) return <Bosh />;

  const { rasta, joriy, shartnomalar, tolovlar } = malumot;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/rastalar" className="text-[13px] text-xira hover:text-asos">← Rastalar ro&apos;yxati</Link>
          <h1 className="mt-1 flex items-center gap-2 text-[22px] font-semibold tracking-tight">
            {rasta.raqam} <Belgi tur={rasta.holat}>{HOLAT_NOMI[rasta.holat]}</Belgi>
          </h1>
          <p className="mt-1 text-sm text-xira">
            {rasta.bozor_nomi} · {rasta.blok_nomi ?? "blok ko'rsatilmagan"} · {TUR_NOMI[rasta.tur] ?? rasta.tur}
            {rasta.maydon ? ` · ${rasta.maydon} m²` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {joriy && tolovQabulQiladi(men) && <Tugma onClick={() => setTolovOchiq(true)}>To&apos;lov qabul qilish</Tugma>}
          {joriy && yozaOladi(men) && (
            <Tugma uslub="ikkilamchi" onClick={() => setYakunOchiq(true)}>Shartnomani yakunlash</Tugma>
          )}
          {!joriy && yozaOladi(men) && (
            <Link href={`/shartnomalar?rasta=${rasta.id}`}><Tugma>Shartnoma tuzish</Tugma></Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Korsatkich nom="Oylik narx" qiymat={`${pul(rasta.oylik_narx)}`} izoh="so'm / oy" />
        <Korsatkich nom="To'langan" qiymat={pul(joriy?.tolangan ?? 0)} izoh="shartnoma boshidan" />
        <Korsatkich nom="Shartnoma" qiymat={joriy ? joriy.raqam : "—"} rang="kok"
                    izoh={joriy ? `${sana(joriy.boshlanish)} dan` : "faol shartnoma yo'q"} />
        <Korsatkich nom="Holat" qiymat={HOLAT_NOMI[rasta.holat] ?? rasta.holat}
                    izoh={joriy ? `shartnoma ${joriy.raqam}` : "faol shartnoma yo'q"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Kartochka sarlavha="Joriy ijarachi">
          {joriy ? (
            <div className="space-y-2 text-sm">
              <Link href={`/ijarachilar?tanlangan=${joriy.ijarachi_id}`}
                    className="text-[15px] font-medium hover:text-asos">{joriy.ijarachi_fio}</Link>
              <p className="text-xira">{joriy.ijarachi_telefon ?? "telefon ko'rsatilmagan"}</p>
              <dl className="mt-3 space-y-1.5">
                <Juft nom="Shartnoma" qiymat={joriy.raqam} />
                <Juft nom="Muddat" qiymat={`${sana(joriy.boshlanish)} — ${joriy.tugash ? sana(joriy.tugash) : "muddatsiz"}`} />
                <Juft nom="Oylik to'lov" qiymat={`${pul(joriy.oylik_tolov)} so'm`} />
              </dl>
            </div>
          ) : <Bosh matn="Faol shartnoma yo'q — obyekt bo'sh." />}
        </Kartochka>

        <Kartochka sarlavha="Shartnomalar tarixi">
          {shartnomalar.length ? (
            <ul className="divide-y divide-chiziq text-sm">
              {shartnomalar.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.ijarachi_fio}</p>
                    <p className="text-[12px] text-xira">
                      {s.raqam} · {sana(s.boshlanish)} — {s.tugash ? sana(s.tugash) : "…"}
                    </p>
                  </div>
                  <Belgi tur={s.holat}>{HOLAT_NOMI[s.holat] ?? s.holat}</Belgi>
                </li>
              ))}
            </ul>
          ) : <Bosh matn="Tarix bo'sh" />}
        </Kartochka>
      </div>

      <HuquqiyRejimKartochka rasta={rasta} qayta={qayta} />

      <Kartochka sarlavha="Oxirgi to'lovlar">
        {tolovlar.length ? (
          <Jadval eng={620} ustunlar={["Sana", "Usul", "Qabul qildi", "Izoh", { nom: "Summa", ong: true }]}>
            {tolovlar.map((t) => (
              <tr key={t.id} className={t.bekor ? "opacity-50 line-through" : ""}>
                <td className={KATAK}>{sana(t.sana)}</td>
                <td className={`${KATAK} text-xira`}>{USUL_NOMI[t.usul] ?? t.usul}</td>
                <td className={`${KATAK} text-xira`}>{t.qabul_fio ?? "—"}</td>
                <td className={`${KATAK} text-xira`}>{t.izoh ?? t.kvitansiya ?? ""}</td>
                <td className={KATAK_ONG}>{pul(t.summa)}</td>
              </tr>
            ))}
          </Jadval>
        ) : <Bosh matn="To'lov yozilmagan" />}
      </Kartochka>

      {yakunOchiq && joriy && (
        <Tasdiq sarlavha="Shartnomani yakunlash" tugmaMatn="Yakunlash" xatarli
                tavsif={<>
                  <b>{joriy.raqam}</b> · {joriy.ijarachi_fio} · {rasta.raqam}.<br />
                  Shartnoma «tugagan» holatiga o&apos;tadi va obyekt <b>bo&apos;sh</b> deb belgilanadi.
                </>}
                sabab={{ yorliq: "Sabab", izoh: "Ixtiyoriy — shartnoma izohiga yoziladi" }}
                yop={() => setYakunOchiq(false)}
                tasdiqla={async (sababMatni) => {
                  await yuborish(`/api/shartnomalar/${joriy.id}/tugat`, { sabab: sababMatni || null });
                  qayta();
                }} />
      )}

      {tolovOchiq && joriy && (
        <TolovModal shartnomaId={joriy.id} sarlavha={`${rasta.raqam} · ${joriy.ijarachi_fio}`}
                    oylik={joriy.oylik_tolov}
                    yop={() => setTolovOchiq(false)} tayyor={qayta} />
      )}
    </div>
  );
}

/* ── Huquqiy rejim — hisob-kitobning asosi ───────────────────────────── */
const REJIM_NOMI: Record<HuquqiyRejim, string> = {
  bozor_balansida: "Bozor balansida",
  mulkdor_kadastrli: "Mulkdor — kadastr hujjati bor",
  mulkdor_kadastrsiz: "Mulkdor — kadastr hujjati yo'q",
};
const REJIM_IZOHI: Record<HuquqiyRejim, string> = {
  bozor_balansida: "Ijara olinadi, bazasi — foydali maydon (m²).",
  mulkdor_kadastrli: "IJARA OLINMAYDI. Faqat majburiy xizmat haqi, bazasi — kadastrdagi yer maydoni.",
  mulkdor_kadastrsiz: "Ijara olinadi, bazasi — yer maydoni.",
};
const MAQSADLAR = ["oziq-ovqat", "nooziq-ovqat", "ovqatlanish", "xizmat", "boshqa"];

function HuquqiyRejimKartochka({ rasta, qayta }: { rasta: Rasta; qayta: () => void }) {
  const { men } = useMen();
  const [ochiq, setOchiq] = useState(false);
  const rejim = rasta.huquqiy_rejim ?? "bozor_balansida";

  return (
    <Kartochka sarlavha="Huquqiy rejim va hisob-kitob asosi"
               ong={yozaOladi(men) ? (
                 <Tugma kichik uslub="ikkilamchi" onClick={() => setOchiq(true)}>O&apos;zgartirish</Tugma>
               ) : null}>
      <div className="grid gap-4 sm:grid-cols-2">
        <dl className="space-y-1.5 text-sm">
          <Juft nom="Rejim" qiymat={REJIM_NOMI[rejim]} />
          <Juft nom="Foydali maydon" qiymat={rasta.maydon ? `${rasta.maydon} m²` : "kiritilmagan"} />
          <Juft nom="Kadastr yer maydoni"
                qiymat={rasta.kadastr_maydon ? `${rasta.kadastr_maydon} m²` : "kiritilmagan"} />
          <Juft nom="Kadastr raqami" qiymat={rasta.kadastr_raqam || "kiritilmagan"} />
          <Juft nom="Faoliyat maqsadi" qiymat={rasta.maqsad || "ko'rsatilmagan"} />
          <Juft nom="Qavat" qiymat={rasta.qavat != null ? String(rasta.qavat) : "—"} />
        </dl>
        <p className={`rounded-lg px-3 py-2.5 text-[13px] ${
          rejim === "mulkdor_kadastrli" ? "bg-sariq-och text-sariq" : "bg-fon text-xira"}`}>
          {REJIM_IZOHI[rejim]}
          <br />
          <span className="text-xira">
            Tarif shu maydonlar bo&apos;yicha tanlanadi: maqsad, obyekt turi va qavat.
          </span>
        </p>
      </div>
      {ochiq && <RejimShakli rasta={rasta} yop={() => setOchiq(false)}
                             tayyor={() => { setOchiq(false); qayta(); }} />}
    </Kartochka>
  );
}

function RejimShakli({ rasta, yop, tayyor }: { rasta: Rasta; yop: () => void; tayyor: () => void }) {
  const [m, setM] = useState({
    huquqiy_rejim: (rasta.huquqiy_rejim ?? "bozor_balansida") as HuquqiyRejim,
    maydon: rasta.maydon != null ? String(rasta.maydon) : "",
    kadastr_maydon: rasta.kadastr_maydon != null ? String(rasta.kadastr_maydon) : "",
    kadastr_raqam: rasta.kadastr_raqam ?? "",
    maqsad: rasta.maqsad ?? "",
    qavat: rasta.qavat != null ? String(rasta.qavat) : "",
  });
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const kadastrli = m.huquqiy_rejim === "mulkdor_kadastrli";

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      await yuborish(`/api/rastalar/${rasta.id}`, {
        huquqiy_rejim: m.huquqiy_rejim,
        maydon: m.maydon ? Number(m.maydon.replace(",", ".")) : null,
        kadastr_maydon: m.kadastr_maydon ? Number(m.kadastr_maydon.replace(",", ".")) : null,
        kadastr_raqam: m.kadastr_raqam.trim() || null,
        maqsad: m.maqsad || null,
        qavat: m.qavat ? Number(m.qavat) : null,
      }, "PATCH");
      tayyor();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Modal sarlavha={`${rasta.raqam} — huquqiy rejim`} yop={yop}>
      <form onSubmit={joniat} className="space-y-3">
        <Maydon yorliq="Huquqiy rejim" izoh={REJIM_IZOHI[m.huquqiy_rejim]}>
          <select className={KIRITISH_SINF} value={m.huquqiy_rejim}
                  onChange={(e) => setM({ ...m, huquqiy_rejim: e.target.value as HuquqiyRejim })}>
            {(Object.keys(REJIM_NOMI) as HuquqiyRejim[]).map((k) => (
              <option key={k} value={k}>{REJIM_NOMI[k]}</option>
            ))}
          </select>
        </Maydon>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Foydali maydon (m²)">
            <input className={KIRITISH_SINF} inputMode="decimal" value={m.maydon}
                   onChange={(e) => setM({ ...m, maydon: e.target.value.replace(/[^\d.,]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Kadastr yer maydoni (m²)"
                  izoh={kadastrli ? "xizmat haqi SHU maydondan hisoblanadi" : "ixtiyoriy"}>
            <input className={KIRITISH_SINF} inputMode="decimal" value={m.kadastr_maydon}
                   onChange={(e) => setM({ ...m, kadastr_maydon: e.target.value.replace(/[^\d.,]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Kadastr raqami" izoh={kadastrli ? "majburiy" : "ixtiyoriy"}>
            <input className={KIRITISH_SINF} value={m.kadastr_raqam} maxLength={40}
                   placeholder="10:09:03:01:0142"
                   onChange={(e) => setM({ ...m, kadastr_raqam: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Faoliyat maqsadi" izoh="tarif shu bo'yicha tanlanadi">
            <select className={KIRITISH_SINF} value={m.maqsad}
                    onChange={(e) => setM({ ...m, maqsad: e.target.value })}>
              <option value="">— ko&apos;rsatilmagan —</option>
              {MAQSADLAR.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="Qavat" izoh="ixtiyoriy">
            <input className={KIRITISH_SINF} inputMode="numeric" value={m.qavat}
                   onChange={(e) => setM({ ...m, qavat: e.target.value.replace(/[^\d]/g, "") })} />
          </Maydon>
        </div>
        {kadastrli && (
          <p className="rounded-lg bg-sariq-och px-3 py-2 text-[12.5px] text-sariq">
            Bu obyektga <b>ijara olinmaydi</b> — shartnoma tuzishda tarif bo&apos;yicha taklif
            faqat majburiy xizmat haqidan (kadastr maydoni × stavka) chiqadi.
          </p>
        )}
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda}>
            {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Saqlash"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

function Juft({ nom, qiymat }: { nom: string; qiymat: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xira">{nom}</dt>
      <dd className="text-right font-medium">{qiymat}</dd>
    </div>
  );
}
