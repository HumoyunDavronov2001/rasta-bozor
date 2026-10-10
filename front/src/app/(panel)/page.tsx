"use client";

import Link from "next/link";
import { useMalumot } from "@/lib/api";
import { useMen } from "@/lib/kontekst";
import { bozorKunlari, pul, sana, USUL_NOMI } from "@/lib/format";
import type { Analitika, PattaReja } from "@/lib/turlar";
import { Kartochka, Korsatkich, Belgi, Yuklanmoqda, Xato, Bosh } from "@/komponent/asos";
import { UstunGrafik, MaydonGrafik, Halqa, Ulush } from "@/komponent/grafik";

export default function BoshqaruvPaneli() {
  const { men, bozorId, bozorlar } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<Analitika>(
    `/api/analitika${bozorId ? `?bozor=${bozorId}` : ""}`,
  );

  if (yuklanmoqda) return <Yuklanmoqda />;
  if (xato) return <Xato matn={xato} qayta={qayta} />;
  if (!malumot) return <Bosh />;

  const { rasta, moliya, joriy_oy } = malumot;
  const bozorNomi = bozorId ? bozorlar.find((b) => b.id === bozorId)?.nomi : "Barcha bozorlar";
  // Patta bozori (shartnoma yo'q, joy kunlik haq bilan): «Bandlik 0/124» chalg'itadi —
  // uning o'rniga oxirgi bozor kunida nechta o'rin to'lagani ko'rsatiladi.
  const patta = malumot.patta ?? [];
  const faqatPatta = patta.length > 0 && rasta.band === 0;
  const kunJami = patta.reduce((s, p) => s + p.kun.soni.jami, 0);
  const kunSoni = (h: "tolangan" | "tolanmagan" | "bosh" | "nomalum") => patta.reduce((s, p) => s + p.kun.soni[h], 0);
  const kunSana = patta[0]?.kun.sana;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Boshqaruv paneli</h1>
        <p className="mt-1 text-sm text-xira">
          {bozorNomi} · {joriy_oy.nom} {joriy_oy.yil} · Salom, {men.fio}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {faqatPatta ? (
          <Korsatkich nom="Bozor kuni: to'lagan" qiymat={`${kunSoni("tolangan")} / ${kunJami}`}
                      rang={kunSoni("tolanmagan") ? "qizil" : "asos"}
                      belgi={kunSoni("tolanmagan") ? `${kunSoni("tolanmagan")} to'lamagan` : undefined}
                      izoh={`${kunSana ? sana(kunSana) : ""} · bo'sh ${kunSoni("bosh")} · kamera ma'lumoti yo'q ${kunSoni("nomalum")}`} />
        ) : (
          <Korsatkich nom="Bandlik" qiymat={`${rasta.band} / ${rasta.jami}`}
                      belgi={`${rasta.bandlik_foiz}%`}
                      izoh={`${rasta.bosh} bo'sh · ${rasta.tamir} ta'mirda · ${rasta.bloklangan} bloklangan`} />
        )}
        {faqatPatta ? (
          <Korsatkich nom={`${joriy_oy.nom}: patta puli`} qiymat={pul(moliya.joriy_oy_kunlik)}
                      izoh="bir kunlik joy haqi (shartnoma to'lovi yo'q)" />
        ) : (
          <Korsatkich nom={`${joriy_oy.nom}: ijara tushumi`} qiymat={pul(moliya.joriy_oy_tushum)}
                      izoh={moliya.joriy_oy_kunlik
                        ? `kunlik joy haqi: ${pul(moliya.joriy_oy_kunlik)} so'm` : "shartnoma to'lovlari"} />
        )}
        <Korsatkich nom="Faol shartnomalar" qiymat={String(moliya.faol_shartnoma)}
                    izoh={<Link href="/shartnomalar" className="text-asos underline underline-offset-2">Shartnomalar ro&apos;yxati →</Link>} />
        <Korsatkich nom="30 kunlik tushum" qiymat={pul(moliya.oraliq_tushum)} rang="kok"
                    izoh={`${malumot.oraliq.dan} — ${malumot.oraliq.gacha}`
                      + (moliya.oraliq_kunlik ? ` · shundan kunlik: ${pul(moliya.oraliq_kunlik)}` : "")} />
      </div>

      {patta.map((p) => <PattaRejasi key={p.bozor_id} p={p} oy={joriy_oy.nom} bittami={patta.length === 1} />)}

      {malumot.ishlar && <OsilganIshlar ishlar={malumot.ishlar} />}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Kartochka sarlavha="Oylik tushum (12 oy)"
                   ong={<Izoh unsurlar={[["#0f6b45", "ijara to'lovi"], ["#1d4ed8", "kunlik joy haqi"]]} />}>
          <UstunGrafik malumot={malumot.oylik} />
        </Kartochka>

        <Kartochka sarlavha="To'lov usullari (30 kun)">
          <Halqa malumot={malumot.usullar.map((u) => ({ nom: USUL_NOMI[u.usul] ?? u.usul, qiymat: u.summa }))} />
        </Kartochka>
      </div>

      <Kartochka sarlavha="Kunlik tushum">
        <MaydonGrafik malumot={malumot.kunlik} />
      </Kartochka>

      <div className="grid gap-5 xl:grid-cols-2">
        <Kartochka sarlavha="Oxirgi to'lovlar"
                   ong={<Link href="/tolovlar" className="text-[13px] font-medium text-asos hover:underline">Hammasi →</Link>}>
          {malumot.oxirgi_tolovlar.length === 0 ? (
            <Bosh matn="Hali to'lov yo'q." />
          ) : (
            <ul className="divide-y divide-chiziq">
              {malumot.oxirgi_tolovlar.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    {t.rasta_id ? (
                      <Link href={`/rastalar/${t.rasta_id}`} className="truncate text-sm font-medium hover:text-asos">
                        {t.rasta_raqam}
                      </Link>
                    ) : <span className="text-sm font-medium">—</span>}
                    <p className="mt-0.5 truncate text-[12px] text-xira">
                      {t.manba_turi === "kunlik" ? "Kunlik joy haqi" : t.ijarachi_fio ?? "—"}
                      {" · "}{sana(t.sana)} · {USUL_NOMI[t.usul] ?? t.usul}
                    </p>
                  </div>
                  <p className="raqam shrink-0 text-sm font-semibold">{pul(t.summa)}</p>
                </li>
              ))}
            </ul>
          )}
        </Kartochka>

        <Kartochka sarlavha="Bozorlar kesimi">
          <ul className="space-y-3">
            {malumot.bozorlar.map((b) => {
              // Shartnomasiz patta bozori: «0/124 band» emas — oxirgi bozor kuni to'lagan o'rinlar
              const pb = patta.find((x) => x.bozor_id === b.id);
              const q = pb && b.band === 0 ? pb.kun.soni.tolangan : b.band;
              const j = pb && b.band === 0 ? pb.kun.soni.jami : b.rasta;
              return (
                <li key={b.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <Link href="/plan" className="truncate text-sm font-medium hover:text-asos">{b.nomi}</Link>
                    <span className="raqam shrink-0 text-[12.5px] text-xira">
                      {q}/{j} {pb && b.band === 0 ? "bozor kuni to'lagan" : "band"}
                      <Belgi tur={j && q / j >= 0.8 ? "band" : "ogoh"}>
                        {j ? Math.round((q / j) * 100) : 0}%
                      </Belgi>
                    </span>
                  </div>
                  <Ulush qism={q} jami={j} />
                </li>
              );
            })}
          </ul>
        </Kartochka>
      </div>

      <p className="text-[12px] text-xira">
        {"Ko'rsatkichlar bazadagi haqiqiy to'lovlardan hisoblanadi. Tariflar «Tariflar» bo'limida yuritiladi."}
      </p>
    </div>
  );
}

/* Patta puli rejasi — ish tartibi va formula BIR JOYDA: reja oyiga bozor kuni bilan,
   30 kun bilan emas (haftalik bozor, buyurtmachi talabi 29.09.2026). */
function PattaRejasi({ p, oy, bittami }: { p: PattaReja; oy: string; bittami: boolean }) {
  return (
    <Kartochka sarlavha={bittami ? "Patta puli: oylik reja" : `Patta puli: oylik reja — ${p.bozor_nomi}`}
               ong={<span className="text-[12.5px] text-xira">
                      Ish tartibi: {p.bozor_kunlari.length ? `${bozorKunlari(p.bozor_kunlari)} · `
                        : p.hafta_ish_kuni ? `haftada ${p.hafta_ish_kuni} kun · ` : ""}oyiga {p.oy_ish_kuni} kun
                    </span>}>
      {p.reja == null ? (
        <p className="text-sm text-sariq">{p.tarif_izoh}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[15px]">
              {oy}: <b className="raqam">{pul(p.yigildi)}</b>
              <span className="text-xira"> / {pul(p.reja)} so&apos;m</span>
            </p>
            <Belgi tur={(p.foiz ?? 0) >= 100 ? "band" : "xolis"}>{p.foiz ?? 0}%</Belgi>
          </div>
          <Ulush qism={p.yigildi} jami={p.reja} />
          <div className="rounded-lg border border-chiziq px-3 py-2.5">
            <p className="text-[13px] font-medium">
              Bozor kuni — {sana(p.kun.sana)}{p.kun.bozor_kunimi === false ? " (bozor kuni emas)" : ""}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([["tolangan", "#16a34a", "to'langan"], ["tolanmagan", "#dc2626", "ishlayapti, to'lanmagan"],
                 ["bosh", "#eab308", "bo'sh"], ["nomalum", "#9ca3af", "kamera ma'lumoti yo'q"]] as const).map(([h, r, n]) => (
                <div key={h} className="rounded-md bg-fon px-2.5 py-1.5">
                  <p className="flex items-center gap-1.5 text-[11.5px] text-xira">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r }} />{n}
                  </p>
                  <p className="raqam text-[17px] font-semibold">{p.kun.soni[h]}</p>
                </div>
              ))}
            </div>
            {p.kun.yoqotilgan != null && (
              <p className={`mt-2 text-[13px] ${p.kun.yoqotilgan ? "text-qizil" : "text-xira"}`}>
                To&apos;lanmagan pul (qizil rastalar): <b className="raqam">{pul(p.kun.yoqotilgan)}</b> so&apos;m
              </p>
            )}
          </div>
          <p className="rounded-lg bg-fon px-3 py-2 text-[13px]">
            Eng ko&apos;p imkoniyat: <span className="raqam">{p.rasta}</span> rasta × <span className="raqam">{pul(p.narx ?? 0)}</span> so&apos;m
            × <b className="raqam">{p.oy_ish_kuni}</b> bozor kuni = <b className="raqam">{pul(p.reja)}</b> so&apos;m
            <span className="block text-[12px] text-xira">
              Hamma rasta har bozor kuni ishlasa. Aslida qancha ishlaganini kamera ko&apos;rsatadi — reja 30 kun bilan hisoblanmaydi.
            </span>
          </p>
          <p className="text-[12.5px] text-xira">
            {p.otgan_bozor_kuni != null
              ? <>Bu oy o&apos;tgan bozor kunlari ({p.bozor_kunlari.map((k) => bozorKunlari([k]).replace("har ", "")).join(", ")}):{" "}
                  <span className="raqam">{p.otgan_bozor_kuni}</span> · patta yig&apos;ilgan kunlar:{" "}
                  <span className="raqam">{p.otgan_kun}</span></>
              : <>Bu oy patta yig&apos;ilgan kunlar: <span className="raqam">{p.otgan_kun}</span> / {p.oy_ish_kuni}</>}
            {p.oxirgi_kun
              ? ` · oxirgi bozor kuni ${sana(p.oxirgi_kun.sana)}: ${p.oxirgi_kun.orin} o'rin to'ladi (${p.rasta} tadan)`
              : " · hali patta yig'ilmagan"}
          </p>
        </div>
      )}
    </Kartochka>
  );
}

function Izoh({ unsurlar }: { unsurlar: [string, string][] }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-xira">
      {unsurlar.map(([rang, nom]) => (
        <span key={nom} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: rang }} />{nom}
        </span>
      ))}
    </div>
  );
}

/* ── Diqqat talab qiladigan ishlar ────────────────────────────────────── */
function OsilganIshlar({ ishlar }: { ishlar: NonNullable<Analitika["ishlar"]> }) {
  const qatorlar = [
    { soni: ishlar.navbatdagi_ariza, yol: "/arizalar",
      matn: "navbatdagi ariza", izoh: "bo'sh joy so'ragan odamlar kutib turadi" },
    { soni: ishlar.korilmagan_belgi, yol: "/belgilar",
      matn: "ko'rilmagan belgi", izoh: "kamera aniqlagan, ma'mur qarori kerak" },
    { soni: ishlar.maydonsiz_rasta, yol: "/rastalar",
      matn: "maydoni kiritilmagan obyekt", izoh: "tarif bo'yicha oylik to'lov taklif qilib bo'lmaydi" },
    { soni: ishlar.muddati_otgan_shartnoma ?? 0, yol: "/shartnomalar",
      matn: "muddati tugagan faol shartnoma",
      izoh: "kelishuv tugagan, rasta esa band — uzaytiring yoki yakunlang" },
  ].filter((q) => q.soni > 0);

  if (!qatorlar.length) return null;

  return (
    <Kartochka sarlavha="Diqqat talab qiladi">
      <ul className="divide-y divide-chiziq text-sm">
        {qatorlar.map((q) => (
          <li key={q.matn} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <Link href={q.yol} className="font-medium hover:text-asos">
                {q.soni} ta {q.matn}
              </Link>
              <p className="text-[12.5px] text-xira">{q.izoh}</p>
            </div>
            <Link href={q.yol} className="shrink-0 text-[13px] text-asos underline">ochish →</Link>
          </li>
        ))}
      </ul>
    </Kartochka>
  );
}
