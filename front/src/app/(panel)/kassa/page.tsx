"use client";

import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { bugun, pul, sana, vaqt, USUL_NOMI } from "@/lib/format";
import type { Rasta } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_SINF, KIRITISH_TOR, Kartochka,
  Korsatkich, Maydon, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";
import { Tasdiq } from "@/komponent/tasdiq";

type Smena = {
  id: number; holat: string; boshlangich: number; ochilgan: string; yopilgan: string | null;
  naqd: number; jami: number; kutilgan_naqd: number; sanalgan_naqd: number | null;
  farq?: number; kunlik_summa: number; kunlik_soni: number;
  bekor_summa: number; bekor_soni: number;
  usullar: Record<string, { summa: number; soni: number }>;
};
type SmenaQator = Smena & {
  kassir_fio: string; qabul_fio: string | null; bozor_nomi: string;
  tolov_soni: number; yopish_izoh: string | null; topshirilgan: number | null;
};
type Kunlik = {
  id: number; sana: string; summa: number; mahsulot: string | null; savdogar: string | null;
  orin_soni: number; rasta_raqam: string | null; kassir_fio: string | null; bekor: number;
};

const HOLAT_NOMI: Record<string, string> = {
  ochiq: "Ochiq", yopilgan: "Yopilgan", topshirilgan: "Topshirilgan",
};

export default function KassaSahifasi() {
  const { men, bozorId } = useMen();
  const [yangilash, setYangilash] = useState(0);

  const smena = useMalumot<{ smena: Smena | null }>(
    `/api/smena?v=${yangilash}${bozorId ? `&bozor=${bozorId}` : ""}`);
  const kunlik = useMalumot<{ jami: { soni: number; summa: number; orin: number }; yigimlar: Kunlik[] }>(
    `/api/kunlik?v=${yangilash}&dan=${bugun()}${bozorId ? `&bozor=${bozorId}` : ""}`);
  const smenalar = useMalumot<{ smenalar: SmenaQator[] }>(
    `/api/smenalar?v=${yangilash}&chegara=20${bozorId ? `&bozor=${bozorId}` : ""}`);

  function qayta() {
    setYangilash((v) => v + 1);
  }

  const joriy = smena.malumot?.smena ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Kassa</h1>
        <p className="mt-1 text-sm text-xira">
          Smena ochiladi → to&apos;lovlar unga biriktiriladi → kun oxirida naqd sanaladi va
          topshiriladi. Farq bo&apos;lsa u <b>yashirilmaydi</b>.
        </p>
      </div>

      {smena.yuklanmoqda ? <Yuklanmoqda /> : smena.xato ? <Xato matn={smena.xato} qayta={qayta} /> : (
        joriy ? <OchiqSmena smena={joriy} qayta={qayta} /> : <SmenaYoq qayta={qayta} />
      )}

      {joriy && <KunlikForma smena={joriy} qayta={qayta} />}

      <Kartochka sarlavha="Bugungi kunlik joy haqi"
                 ong={kunlik.malumot ? (
                   <span className="text-[12.5px] text-xira">
                     {kunlik.malumot.jami.soni} ta · {pul(kunlik.malumot.jami.summa)} so&apos;m ·{" "}
                     {kunlik.malumot.jami.orin} o&apos;rin
                   </span>
                 ) : null}>
        <div className="space-y-2 sm:hidden">
          {kunlik.yuklanmoqda ? <Yuklanmoqda /> :
            !kunlik.malumot?.yigimlar.length ? <Bosh matn="Bugun kunlik yig'im yo'q" /> :
            kunlik.malumot.yigimlar.map((k) => (
              <MobilKarta key={k.id}
                          sarlavha={k.mahsulot ?? k.rasta_raqam ?? "Joy haqi"}
                          belgi={k.bekor ? <Belgi tur="bekor">bekor</Belgi> : null}
                          tavsif={<>
                            {k.rasta_raqam ? `${k.rasta_raqam} · ` : ""}{k.orin_soni} o&apos;rin
                            {k.savdogar ? ` · ${k.savdogar}` : ""}
                            <span className="block">{sana(k.sana)} · {k.kassir_fio ?? "—"}</span>
                          </>}
                          ong={`${pul(k.summa)} so'm`}
                          amallar={!k.bekor && yozaOladi(men)
                            ? <KunlikBekor id={k.id} qayta={qayta} /> : undefined} />
            ))}
        </div>

        <div className="hidden sm:block">
        {kunlik.yuklanmoqda ? <Yuklanmoqda /> :
          !kunlik.malumot?.yigimlar.length ? <Bosh matn="Bugun kunlik yig'im yo'q" /> : (
            <Jadval eng={760} ustunlar={["Vaqt", "Obyekt", "Mahsulot", "Savdogar",
              { nom: "O'rin", ong: true }, { nom: "Summa", ong: true }, "Kassir", ""]}>
              {kunlik.malumot.yigimlar.map((k) => (
                <tr key={k.id} className={k.bekor ? "opacity-50 line-through" : ""}>
                  <td className={`${KATAK} text-xira`}>{sana(k.sana)}</td>
                  <td className={KATAK}>{k.rasta_raqam ?? <span className="text-xira">—</span>}</td>
                  <td className={KATAK}>{k.mahsulot ?? "—"}</td>
                  <td className={`${KATAK} text-xira`}>{k.savdogar ?? "—"}</td>
                  <td className={KATAK_ONG}>{k.orin_soni}</td>
                  <td className={`${KATAK_ONG} font-semibold`}>{pul(k.summa)}</td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>{k.kassir_fio ?? "—"}</td>
                  <td className={KATAK}>
                    {!k.bekor && yozaOladi(men) && <KunlikBekor id={k.id} qayta={qayta} />}
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
        </div>
      </Kartochka>

      <Kartochka sarlavha="Smenalar tarixi">
        <div className="space-y-2 sm:hidden">
          {smenalar.yuklanmoqda ? <Yuklanmoqda /> :
            !smenalar.malumot?.smenalar.length ? <Bosh matn="Smena yo'q" /> :
            smenalar.malumot.smenalar.map((s) => (
              <MobilKarta key={s.id} sarlavha={`#${s.id} · ${s.kassir_fio}`}
                          belgi={<Belgi tur={s.holat === "ochiq" ? "band"
                                    : s.holat === "topshirilgan" ? "faol" : "ogoh"}>
                                   {HOLAT_NOMI[s.holat] ?? s.holat}
                                 </Belgi>}
                          tavsif={<>
                            {vaqt(s.ochilgan)} · {s.tolov_soni} to&apos;lov
                            <span className="block">
                              kutilgan {pul(s.kutilgan_naqd)}
                              {s.sanalgan_naqd !== null ? ` · sanalgan ${pul(s.sanalgan_naqd)}` : ""}
                            </span>
                            {s.qabul_fio && (
                              <span className="block">topshirdi: {s.qabul_fio} · {pul(s.topshirilgan)}</span>
                            )}
                          </>}
                          ong={s.farq == null ? pul(s.naqd)
                            : s.farq === 0 ? pul(s.naqd)
                            : (s.farq > 0 ? `+${pul(s.farq)}` : pul(s.farq))}
                          ongIzoh={s.farq == null || s.farq === 0 ? "naqd" : "FARQ"} />
            ))}
        </div>

        <div className="hidden sm:block">
        {smenalar.yuklanmoqda ? <Yuklanmoqda /> :
          !smenalar.malumot?.smenalar.length ? <Bosh matn="Smena yo'q" /> : (
            <Jadval eng={940} ustunlar={["Ochilgan", "Kassir", "Holat",
              { nom: "To'lov", ong: true }, { nom: "Naqd", ong: true },
              { nom: "Kutilgan", ong: true }, { nom: "Sanalgan", ong: true },
              { nom: "Farq", ong: true }, "Topshirdi"]}>
              {smenalar.malumot.smenalar.map((s) => (
                <tr key={s.id} className="hover:bg-fon">
                  <td className={`${KATAK} text-[12.5px]`}>{vaqt(s.ochilgan)}</td>
                  <td className={KATAK}>{s.kassir_fio}</td>
                  <td className={KATAK}>
                    <Belgi tur={s.holat === "ochiq" ? "band" : s.holat === "topshirilgan" ? "faol" : "ogoh"}>
                      {HOLAT_NOMI[s.holat] ?? s.holat}
                    </Belgi>
                  </td>
                  <td className={KATAK_ONG}>{s.tolov_soni}</td>
                  <td className={KATAK_ONG}>{pul(s.naqd)}</td>
                  <td className={KATAK_ONG}>{pul(s.kutilgan_naqd)}</td>
                  <td className={KATAK_ONG}>
                    {s.sanalgan_naqd === null ? "—" : pul(s.sanalgan_naqd)}
                  </td>
                  <td className={`${KATAK_ONG} font-semibold ${
                    s.farq == null ? "" : s.farq === 0 ? "text-asos" : "text-qizil"}`}>
                    {s.farq == null ? "—" : s.farq > 0 ? `+${pul(s.farq)}` : pul(s.farq)}
                  </td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>
                    {s.qabul_fio ? <>{s.qabul_fio}<span className="block">{pul(s.topshirilgan)}</span></> : "—"}
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-xira">
          Kassir o&apos;z pulini o&apos;zi qabul qila olmaydi — inkassatsiyani boshqa xodim
          bajaradi. Yopishda farq chiqsa sabab majburiy va u jurnalga tushadi.
        </p>
      </Kartochka>
    </div>
  );
}

function SmenaYoq({ qayta }: { qayta: () => void }) {
  const { men, bozorId, bozorlar } = useMen();
  const [boshlangich, setBoshlangich] = useState("0");
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const bozor = bozorId ?? bozorlar[0]?.id ?? null;

  async function ochish() {
    setXato(null);
    setIshlamoqda(true);
    try {
      await yuborish("/api/smena", {
        bozor_id: bozor, boshlangich: Number(boshlangich.replace(/\s/g, "")) || 0,
      });
      qayta();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  if (!yozaOladi(men) && men.rol !== "yiguvchi") {
    return (
      <Kartochka sarlavha="Smena">
        <Bosh matn="Smena ochish uchun yig'uvchi yoki boshqaruvchi huquqi kerak" />
      </Kartochka>
    );
  }

  return (
    <Kartochka sarlavha="Smena yopiq">
      <p className="text-sm text-xira">
        Pul qabul qilishdan oldin smenani ochish tavsiya etiladi — shundagina kun oxirida
        naqd pul hisobi aniq chiqadi.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Maydon yorliq="Boshlang'ich naqd (so'm)" izoh="Kassada qolgan pul, bo'lmasa 0">
          <input className={`${KIRITISH_TOR} w-40`} inputMode="numeric" value={boshlangich}
                 onChange={(e) => setBoshlangich(e.target.value.replace(/[^\d]/g, ""))} />
        </Maydon>
        <Tugma onClick={ochish} disabled={ishlamoqda || !bozor}>
          {ishlamoqda ? <><Aylanma /> Ochilmoqda…</> : "Smenani ochish"}
        </Tugma>
      </div>
      {xato && <div className="mt-3"><Xato matn={xato} /></div>}
    </Kartochka>
  );
}

function OchiqSmena({ smena, qayta }: { smena: Smena; qayta: () => void }) {
  const { men } = useMen();
  const [yopishOchiq, setYopishOchiq] = useState(false);
  const [topshirishOchiq, setTopshirishOchiq] = useState(false);
  const [sanalgan, setSanalgan] = useState("");
  const yopiq = smena.holat !== "ochiq";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Korsatkich nom="Smena" qiymat={`#${smena.id}`}
                    belgi={HOLAT_NOMI[smena.holat]}
                    rang={smena.holat === "ochiq" ? "asos" : "kok"}
                    izoh={`${vaqt(smena.ochilgan)} dan`} />
        <Korsatkich nom="Naqd qabul qilindi" qiymat={pul(smena.naqd)}
                    izoh={`boshlang'ich ${pul(smena.boshlangich)} so'm`} />
        <Korsatkich nom="Kassada bo'lishi kerak" qiymat={pul(smena.kutilgan_naqd)} rang="kok"
                    izoh="boshlang'ich + naqd to'lovlar" />
        <Korsatkich nom="Jami qabul (barcha usul)" qiymat={pul(smena.jami)}
                    izoh={Object.entries(smena.usullar)
                      .map(([u, v]) => `${USUL_NOMI[u] ?? u}: ${pul(v.summa)}`).join(" · ") || "—"} />
      </div>

      <Kartochka sarlavha="Smenani boshqarish">
        <div className="flex flex-wrap items-center gap-3">
          {!yopiq && (
            <Tugma onClick={() => setYopishOchiq(true)}>Smenani yopish</Tugma>
          )}
          {smena.holat === "yopilgan" && yozaOladi(men) && (
            <Tugma onClick={() => {
              // Kassir sanagan summa oldindan qo'yiladi — farq bo'lsa qabul qiluvchi o'zgartiradi
              setSanalgan(smena.sanalgan_naqd != null ? String(smena.sanalgan_naqd) : "");
              setTopshirishOchiq(true);
            }}>Pulni qabul qilish (inkassatsiya)</Tugma>
          )}
          {smena.holat === "yopilgan" && !yozaOladi(men) && (
            <p className="text-[13px] text-sariq">
              Smena yopildi. Endi pulni boshqaruvchiga topshiring — u tizimda qabul qiladi.
            </p>
          )}
          {smena.bekor_soni > 0 && (
            <span className="text-[13px] text-xira">
              Bekor qilingan: {smena.bekor_soni} ta, {pul(smena.bekor_summa)} so&apos;m
            </span>
          )}
        </div>
        {smena.farq != null && smena.farq !== 0 && (
          <p className="mt-3 rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">
            Farq: {smena.farq > 0 ? "+" : ""}{pul(smena.farq)} so&apos;m
            {smena.farq < 0 ? " (kam chiqdi)" : " (ortiqcha chiqdi)"}
          </p>
        )}
      </Kartochka>

      {yopishOchiq && (
        <Tasdiq sarlavha={`Smena #${smena.id} ni yopish`} tugmaMatn="Yopish"
                tavsif={<>
                  Kassada <b>{pul(smena.kutilgan_naqd)} so&apos;m</b> bo&apos;lishi kerak
                  (boshlang&apos;ich {pul(smena.boshlangich)} + naqd {pul(smena.naqd)}).
                  <br />Naqd pulni sanab, haqiqiy summani kiriting.
                  <div className="mt-3">
                    <Maydon yorliq="Sanalgan naqd (so'm)">
                      <input className={KIRITISH_SINF} inputMode="numeric" value={sanalgan}
                             onChange={(e) => setSanalgan(e.target.value.replace(/[^\d]/g, ""))} />
                    </Maydon>
                  </div>
                </>}
                sabab={{ yorliq: "Izoh", izoh: "Farq bo'lsa sabab MAJBURIY" }}
                yop={() => setYopishOchiq(false)}
                tasdiqla={async (izoh) => {
                  // Bo'sh maydon «0 so'm sanaldi» degani EMAS — server «summani
                  // kiriting» deb qaytaradi (ilgari bo'sh maydon jimgina 0 ketardi).
                  await yuborish(`/api/smena/${smena.id}/yopish`, {
                    sanalgan_naqd: sanalgan ? Number(sanalgan) : null, izoh,
                  });
                  qayta();
                }} />
      )}

      {topshirishOchiq && (
        <Tasdiq sarlavha="Inkassatsiya — pulni qabul qilish" tugmaMatn="Qabul qildim"
                tavsif={<>
                  Kassir sanagan summa: <b>{pul(smena.sanalgan_naqd ?? 0)} so&apos;m</b>.
                  Pulni sanab, qabul qilgan summani kiriting. Bu amal jurnalga sizning
                  nomingiz bilan yoziladi.
                  <div className="mt-3">
                    <Maydon yorliq="Qabul qilingan summa (so'm)">
                      <input className={KIRITISH_SINF} inputMode="numeric" value={sanalgan}
                             onChange={(e) => setSanalgan(e.target.value.replace(/[^\d]/g, ""))} />
                    </Maydon>
                  </div>
                  {sanalgan !== "" && smena.sanalgan_naqd != null && Number(sanalgan) !== smena.sanalgan_naqd && (
                    <p className="mt-2 text-[13px] text-qizil">
                      Sanalgandan {pul(Number(sanalgan) - smena.sanalgan_naqd)} so&apos;m farq — sababini yozing.
                    </p>
                  )}
                </>}
                sabab={{ yorliq: "Izoh", izoh: "Summa sanalgandan farq qilsa sabab MAJBURIY (kamida 5 belgi)" }}
                yop={() => setTopshirishOchiq(false)}
                tasdiqla={async (izoh) => {
                  await yuborish(`/api/smena/${smena.id}/topshirish`, {
                    summa: sanalgan ? Number(sanalgan) : null, izoh,
                  });
                  qayta();
                }} />
      )}
    </>
  );
}

function KunlikForma({ smena, qayta }: { smena: Smena; qayta: () => void }) {
  const { bozorId, bozorlar } = useMen();
  const bozor = bozorId ?? bozorlar[0]?.id ?? null;
  const rastalar = useMalumot<{ rastalar: Rasta[] }>(
    `/api/rastalar?chegara=500${bozor ? `&bozor=${bozor}` : ""}`);
  const [m, setM] = useState({ summa: "", rasta_id: "", mahsulot: "", savdogar: "",
                               telefon: "", orin_soni: "1", usul: "naqd" });
  const [xato, setXato] = useState<string | null>(null);
  const [natija, setNatija] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const yopiq = smena.holat !== "ochiq";

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setNatija(null);
    setIshlamoqda(true);
    try {
      const j = await yuborish<{ summa: number; kvitansiya: string }>("/api/kunlik", {
        bozor_id: bozor,
        summa: m.summa ? Number(m.summa.replace(/\s/g, "")) : null,
        rasta_id: m.rasta_id ? Number(m.rasta_id) : null,
        orin_soni: Number(m.orin_soni) || 1,
        mahsulot: m.mahsulot || null, savdogar: m.savdogar || null,
        telefon: m.telefon || null, usul: m.usul,
      });
      setNatija(`${pul(j.summa)} so'm qabul qilindi · kvitansiya ${j.kvitansiya}`);
      setM({ ...m, summa: "", mahsulot: "", savdogar: "", telefon: "", orin_soni: "1" });
      qayta();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Kartochka sarlavha="Bir kunlik joy haqi"
               ong={<span className="text-[12px] text-xira">shartnoma talab qilinmaydi</span>}>
      {yopiq ? (
        <p className="text-[13px] text-sariq">
          Smena yopilgan — yangi to&apos;lov qabul qilish uchun yangi smena ochish kerak.
        </p>
      ) : (
        <form onSubmit={joniat} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Maydon yorliq="Summa (so'm)" izoh="bo'sh bo'lsa tarifdan hisoblanadi">
              <input className={KIRITISH_SINF} inputMode="numeric" value={m.summa} autoFocus
                     onChange={(e) => setM({ ...m, summa: e.target.value.replace(/[^\d]/g, "") })} />
            </Maydon>
            <Maydon yorliq="O'rin soni">
              <input className={KIRITISH_SINF} inputMode="numeric" value={m.orin_soni}
                     onChange={(e) => setM({ ...m, orin_soni: e.target.value.replace(/[^\d]/g, "") })} />
            </Maydon>
            <Maydon yorliq="Obyekt" izoh="ixtiyoriy">
              <select className={KIRITISH_SINF} value={m.rasta_id}
                      onChange={(e) => setM({ ...m, rasta_id: e.target.value })}>
                <option value="">— tanlanmagan —</option>
                {(rastalar.malumot?.rastalar ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.raqam}{r.blok_nomi ? ` · ${r.blok_nomi}` : ""}
                  </option>
                ))}
              </select>
            </Maydon>
            <Maydon yorliq="To'lov usuli">
              <select className={KIRITISH_SINF} value={m.usul}
                      onChange={(e) => setM({ ...m, usul: e.target.value })}>
                {Object.entries(USUL_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Maydon>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Maydon yorliq="Mahsulot" izoh="ixtiyoriy">
              <input className={KIRITISH_SINF} value={m.mahsulot} placeholder="Pomidor, kartoshka…"
                     onChange={(e) => setM({ ...m, mahsulot: e.target.value })} />
            </Maydon>
            <Maydon yorliq="Savdogar" izoh="ixtiyoriy — qonun talab qilmaydi">
              <input className={KIRITISH_SINF} value={m.savdogar}
                     onChange={(e) => setM({ ...m, savdogar: e.target.value })} />
            </Maydon>
            <Maydon yorliq="Telefon" izoh="ixtiyoriy">
              <input className={KIRITISH_SINF} value={m.telefon}
                     onChange={(e) => setM({ ...m, telefon: e.target.value })} />
            </Maydon>
          </div>
          {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
          {natija && <p className="rounded-lg border border-asos/25 bg-asos-och px-3 py-2 text-[13px] text-asos">{natija}</p>}
          <Tugma type="submit" disabled={ishlamoqda}>
            {ishlamoqda ? <><Aylanma /> Yozilmoqda…</> : "Qabul qilish"}
          </Tugma>
        </form>
      )}
    </Kartochka>
  );
}

function KunlikBekor({ id, qayta }: { id: number; qayta: () => void }) {
  const [ochiq, setOchiq] = useState(false);
  return (
    <>
      <button onClick={() => setOchiq(true)} className="text-[13px] text-qizil hover:underline">
        Bekor qilish
      </button>
      {ochiq && (
        <Tasdiq sarlavha="Kunlik yig'imni bekor qilish" xatarli tugmaMatn="Bekor qilish"
                tavsif="Yozuv o'chmaydi — bekor qilingan deb belgilanadi va jurnalda qoladi."
                sabab={{ yorliq: "Sabab", majburiy: true, minUzunlik: 5 }}
                yop={() => setOchiq(false)}
                tasdiqla={async (sabab) => {
                  await yuborish(`/api/kunlik/${id}/bekor`, { sabab });
                  qayta();
                }} />
      )}
    </>
  );
}
