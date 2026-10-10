"use client";

import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { kunlarOldin, bugun, pul, sana, USUL_NOMI } from "@/lib/format";
import type { Tolov } from "@/lib/turlar";
import {
  Belgi, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_TOR, Kartochka, Korsatkich, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";
import { Tasdiq } from "@/komponent/tasdiq";

/** To'lov qayerdan kelgani. Ilgari Click/Payme to'lovlari ham «Panel» deb ko'rinardi. */
const MANBA_NOMI: Record<string, string> = {
  panel: "Panel", demo: "Demo", click: "Click", payme: "Payme", sinov: "Sinov",
};

export default function TolovlarSahifasi() {
  const { men, bozorId } = useMen();
  const [dan, setDan] = useState(kunlarOldin(29));
  const [gacha, setGacha] = useState(bugun());
  const [bekorlarBilan, setBekorlarBilan] = useState(false);
  const [turi, setTuri] = useState<"" | "shartnoma" | "kunlik">("");
  const [bekorUchun, setBekorUchun] = useState<Tolov | null>(null);
  const [oxirgiBekor, setOxirgiBekor] = useState<number | null>(null);

  const sorov = new URLSearchParams({ dan, gacha, chegara: "300" });
  if (bozorId) sorov.set("bozor", String(bozorId));
  if (bekorlarBilan) sorov.set("bekor", "1");
  if (turi) sorov.set("manba", turi);
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{
    jami: { soni: number; summa: number }; tolovlar: Tolov[];
  }>(`/api/tolovlar?${sorov}`);

  const csvSorov = new URLSearchParams({ tur: "tolovlar", dan, gacha });
  if (bozorId) csvSorov.set("bozor", String(bozorId));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">To&apos;lovlar jurnali</h1>
          <p className="mt-1 text-sm text-xira">
            Ijara to&apos;lovlari va bir kunlik joy haqi — manbasi va kim qabul qilgani
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={dan} max={gacha} onChange={(e) => setDan(e.target.value)} className={KIRITISH_TOR} />
          <span className="text-xira">—</span>
          <input type="date" value={gacha} max={bugun()} onChange={(e) => setGacha(e.target.value)} className={KIRITISH_TOR} />
          <select value={turi} onChange={(e) => setTuri(e.target.value as typeof turi)}
                  className={KIRITISH_TOR} aria-label="To'lov turi">
            <option value="">Hammasi</option>
            <option value="shartnoma">Ijara (shartnoma)</option>
            <option value="kunlik">Kunlik joy haqi</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-chiziq bg-karta px-3 py-2 text-sm">
            <input type="checkbox" checked={bekorlarBilan} onChange={(e) => setBekorlarBilan(e.target.checked)} />
            Bekorlari bilan
          </label>
          <a href={`/api/hisobot?${csvSorov}`}>
            <Tugma uslub="ikkilamchi">CSV yuklab olish</Tugma>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Korsatkich nom="Oraliqdagi tushum" qiymat={pul(malumot?.jami.summa ?? 0)} izoh={`${dan} — ${gacha}`} />
        <Korsatkich nom="To'lovlar soni" qiymat={String(malumot?.jami.soni ?? 0)} rang="kok" />
        <Korsatkich nom="O'rtacha to'lov" rang="sariq"
                    qiymat={pul(malumot?.jami.soni ? Math.round(malumot.jami.summa / malumot.jami.soni) : 0)} />
      </div>

      {oxirgiBekor !== null && (
        <p className="flex items-center justify-between gap-3 rounded-lg border border-sariq/25 bg-sariq-och px-3 py-2 text-[13px] text-sariq">
          <span>To&apos;lov bekor qilindi va quyida chizilgan holda ko&apos;rsatilyapti.</span>
          <button onClick={() => setOxirgiBekor(null)} className="underline underline-offset-2">Yopish</button>
        </p>
      )}

      {/* Telefonda: kartochka ro'yxati (jadval yonga surilmasin) */}
      <div className="space-y-2 sm:hidden">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !malumot?.tolovlar.length ? <Bosh matn="Bu oraliqda to'lov yo'q" /> :
          malumot.tolovlar.map((t) => (
            <MobilKarta key={t.id}
                        sarlavha={t.rasta_raqam ?? t.kvitansiya ?? `#${t.id}`}
                        belgi={t.bekor ? <Belgi tur="bekor">bekor</Belgi> : null}
                        tavsif={<>
                          {t.manba_turi === "kunlik"
                            ? `Kunlik joy haqi${t.ijarachi_fio ? ` · ${t.ijarachi_fio}` : ""}`
                            : t.ijarachi_fio ?? "—"}
                          <span className="block">
                            {sana(t.sana)} · {USUL_NOMI[t.usul] ?? t.usul}
                            {t.qabul_fio ? ` · ${t.qabul_fio}` : ""}
                          </span>
                        </>}
                        ong={`${pul(t.summa)} so'm`}
                        ongIzoh={t.kvitansiya ?? undefined}
                        amallar={yozaOladi(men) && !t.bekor ? (
                          <Tugma kichik uslub="xatarli" onClick={() => setBekorUchun(t)}>
                            Bekor qilish
                          </Tugma>
                        ) : undefined} />
          ))}
      </div>

      <Kartochka sinf="hidden sm:block">
        {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
          !malumot?.tolovlar.length ? <Bosh matn="Bu oraliqda to'lov yo'q" /> : (
            <Jadval eng={1020} ustunlar={["Sana", "Kvitansiya", "Obyekt", "Ijarachi", "Usul", "Manba",
              "Qabul qildi", { nom: "Summa", ong: true }, ""]}>
              {malumot.tolovlar.map((t) => (
                <tr key={t.id}
                    className={`hover:bg-fon ${t.bekor ? "opacity-60" : ""} ${
                      t.id === oxirgiBekor ? "bg-sariq-och/60" : ""}`}>
                  <td className={KATAK}>{sana(t.sana)}</td>
                  <td className={`${KATAK} raqam whitespace-nowrap text-[12.5px] text-xira`}>
                    {t.kvitansiya ?? "—"}
                  </td>
                  <td className={KATAK}>
                    <span className="font-medium">{t.rasta_raqam ?? "—"}</span>
                    <span className="block text-[12px] text-xira">{t.bozor_nomi}</span>
                  </td>
                  <td className={KATAK}>
                    {t.manba_turi === "kunlik" ? (
                      <>
                        <Belgi tur="xolis">kunlik</Belgi>{" "}
                        <span className="text-xira">{t.ijarachi_fio ?? "savdogar ko'rsatilmagan"}</span>
                      </>
                    ) : t.ijarachi_fio ?? "—"}
                  </td>
                  <td className={`${KATAK} text-xira`}>{USUL_NOMI[t.usul] ?? t.usul}</td>
                  <td className={KATAK}>
                    <Belgi tur="xolis">{MANBA_NOMI[t.manba] ?? t.manba}</Belgi>
                  </td>
                  <td className={`${KATAK} text-xira`}>{t.qabul_fio ?? "—"}</td>
                  <td className={`${KATAK_ONG} font-semibold ${t.bekor ? "text-xira line-through" : ""}`}>
                    {pul(t.summa)}
                  </td>
                  <td className={KATAK}>
                    {t.bekor ? (
                      <span title={t.bekor_izoh ?? ""}><Belgi tur="bekor">bekor</Belgi></span>
                    ) : yozaOladi(men) ? (
                      <button onClick={() => setBekorUchun(t)} className="text-[13px] text-qizil hover:underline">
                        Bekor qilish
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
      </Kartochka>

      {bekorUchun && (
        <Tasdiq sarlavha="To'lovni bekor qilish" xatarli tugmaMatn="Bekor qilish"
                tavsif={<>
                  <b>{pul(bekorUchun.summa)} so&apos;m</b> · {bekorUchun.rasta_raqam ?? "—"} ·{" "}
                  {bekorUchun.ijarachi_fio ?? "—"} · {sana(bekorUchun.sana)}.<br />
                  To&apos;lov o&apos;chmaydi — bekor qilingan deb belgilanadi va jurnalda qoladi,
                  {bekorUchun.manba_turi === "kunlik"
                    ? " kunlik yig'im yozuvi ham bekor bo'ladi va qaytarish cheki yoziladi."
                    : " qaytarish cheki yoziladi."}
                </>}
                sabab={{ yorliq: "Bekor qilish sababi", majburiy: true, minUzunlik: 5,
                         izoh: "Kamida 5 belgi. Bu matn jurnalga yoziladi." }}
                yop={() => setBekorUchun(null)}
                tasdiqla={async (sababMatni) => {
                  await yuborish(`/api/tolovlar/${bekorUchun.id}/bekor`, { sabab: sababMatni });
                  // Bekor qilingan to'lov sukut bo'yicha ro'yxatdan tushib qoladi —
                  // natija ko'rinishi uchun filtrni yoqamiz va qatorni belgilaymiz.
                  setOxirgiBekor(bekorUchun.id);
                  setBekorlarBilan(true);
                  qayta();
                }} />
      )}

      <p className="text-[12px] text-xira">
        To&apos;lov o&apos;chirilmaydi — faqat sabab ko&apos;rsatilgan holda bekor qilinadi va jurnalda qoladi.
        Bekor qilingan to&apos;lov tushum va hisobotlarga kirmaydi.
      </p>
    </div>
  );
}
