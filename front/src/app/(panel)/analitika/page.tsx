"use client";

import { useState } from "react";
import { useMalumot } from "@/lib/api";
import { useMen } from "@/lib/kontekst";
import { bugun, kunlarOldin, pul, USUL_NOMI } from "@/lib/format";
import type { Analitika } from "@/lib/turlar";
import {
  Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_TOR, Kartochka, Korsatkich, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { Halqa, MaydonGrafik, UstunGrafik, Ulush } from "@/komponent/grafik";

const HISOBOTLAR = [
  { tur: "tolovlar", nom: "To'lovlar" },
  { tur: "rastalar", nom: "Rastalar reyestri" },
  { tur: "shartnomalar", nom: "Shartnomalar" },
];

export default function AnalitikaSahifasi() {
  const { bozorId, bozorlar } = useMen();
  const [dan, setDan] = useState(kunlarOldin(29));
  const [gacha, setGacha] = useState(bugun());

  const sorov = new URLSearchParams({ dan, gacha });
  if (bozorId) sorov.set("bozor", String(bozorId));
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<Analitika>(`/api/analitika?${sorov}`);

  function oraliq(kun: number) {
    setDan(kunlarOldin(kun - 1));
    setGacha(bugun());
  }

  if (yuklanmoqda) return <Yuklanmoqda />;
  if (xato) return <Xato matn={xato} qayta={qayta} />;
  if (!malumot) return <Bosh />;

  const oylik = malumot.oylik;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Analitika va hisobotlar</h1>
          <p className="mt-1 text-sm text-xira">
            {bozorId ? bozorlar.find((b) => b.id === bozorId)?.nomi : "Barcha bozorlar"} · {dan} — {gacha}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[[7, "7 kun"], [30, "30 kun"], [90, "90 kun"]].map(([k, n]) => (
            <button key={String(k)} onClick={() => oraliq(Number(k))}
                    className="rounded-lg border border-chiziq bg-karta px-3 py-2 text-[13px] hover:bg-fon">{n}</button>
          ))}
          <input type="date" value={dan} max={gacha} onChange={(e) => setDan(e.target.value)} className={KIRITISH_TOR} />
          <input type="date" value={gacha} max={bugun()} onChange={(e) => setGacha(e.target.value)} className={KIRITISH_TOR} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Korsatkich nom="Oraliqdagi tushum" qiymat={pul(malumot.moliya.oraliq_tushum)}
                    izoh="ijara to'lovi + kunlik joy haqi" />
        <Korsatkich nom="Kunlik joy haqi" qiymat={pul(malumot.moliya.oraliq_kunlik)} rang="kok"
                    izoh="oraliqdagi shartnomasiz savdo" />
        <Korsatkich nom="Bandlik" qiymat={`${malumot.rasta.bandlik_foiz}%`}
                    izoh={`${malumot.rasta.band} band · ${malumot.rasta.bosh} bo'sh`} />
        <Korsatkich nom="Faol shartnomalar" qiymat={String(malumot.moliya.faol_shartnoma)}
                    izoh={`${malumot.rasta.jami} ta obyektdan`} />
      </div>

      <Kartochka sarlavha="Oylik tushum (12 oy)"
                 ong={<span className="text-[12px] text-xira">yashil — ijara to&apos;lovi · ko&apos;k — kunlik joy haqi</span>}>
        <UstunGrafik malumot={oylik} balandlik={250} />
      </Kartochka>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Kartochka sarlavha="Kunlik tushum">
          <MaydonGrafik malumot={malumot.kunlik} balandlik={200} />
        </Kartochka>
        <Kartochka sarlavha="To'lov usullari">
          <Halqa malumot={malumot.usullar.map((u) => ({ nom: USUL_NOMI[u.usul] ?? u.usul, qiymat: u.summa }))} />
        </Kartochka>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Kartochka sarlavha="Oylar kesimida tushum">
          <Jadval eng={420} ustunlar={["Oy", { nom: "Ijara to'lovi", ong: true },
            { nom: "Kunlik joy haqi", ong: true }, { nom: "Jami", ong: true }]}>
            {[...oylik].reverse().map((o) => (
              <tr key={`${o.yil}-${o.oy}`}>
                <td className={KATAK}>{o.nom}</td>
                <td className={KATAK_ONG}>{pul(o.ijara)}</td>
                <td className={KATAK_ONG}>{pul(o.kunlik)}</td>
                <td className={`${KATAK_ONG} font-semibold`}>{pul(o.jami)}</td>
              </tr>
            ))}
          </Jadval>
        </Kartochka>

        <Kartochka sarlavha="Bozorlar bo'yicha bandlik">
          <ul className="space-y-3">
            {malumot.bozorlar.map((b) => (
              <li key={b.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{b.nomi}</span>
                  <span className="raqam shrink-0 text-[12.5px] text-xira">
                    {b.band}/{b.rasta} · {b.rasta ? Math.round((b.band / b.rasta) * 100) : 0}%
                  </span>
                </div>
                <Ulush qism={b.band} jami={b.rasta} />
              </li>
            ))}
          </ul>
        </Kartochka>
      </div>

      <Kartochka sarlavha="Hisobotlarni yuklab olish"
                 ong={<span className="text-[12px] text-xira">CSV · Excel ochadi</span>}>
        <div className="flex flex-wrap gap-2">
          {HISOBOTLAR.map((h) => {
            const s = new URLSearchParams({ tur: h.tur });
            if (bozorId) s.set("bozor", String(bozorId));
            if (h.tur === "tolovlar") { s.set("dan", dan); s.set("gacha", gacha); }
            return (
              <a key={h.tur} href={`/api/hisobot?${s}`}>
                <Tugma uslub="ikkilamchi">{h.nom}</Tugma>
              </a>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-xira">
          Fayllar nuqtali vergul bilan ajratiladi va UTF-8 BOM bilan yoziladi — Excel to&apos;g&apos;ri ochadi.
        </p>
      </Kartochka>
    </div>
  );
}
