"use client";

import Link from "next/link";

import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { bozorKunlari, HAFTA_KUNLARI, ROL_NOMI, vaqt } from "@/lib/format";
import type { Bozor, Foydalanuvchi, Jurnal } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KIRITISH_SINF, Kartochka,
  Maydon, Modal, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { Tasdiq, Xabar } from "@/komponent/tasdiq";


export default function SozlamaSahifasi() {
  const { men } = useMen();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Sozlamalar</h1>
        <p className="mt-1 text-sm text-xira">
          {men.fio} · {ROL_NOMI[men.rol]}{men.bozor ? ` · ${men.bozor.nomi}` : ""}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ParolimKartochka />
        {yozaOladi(men) && <TariflarHavolasi />}
      </div>

      {yozaOladi(men) && <TolovKartochka />}
      {men.rol === "admin" && <BozorlarKartochka />}
      {men.rol === "admin" && <FoydalanuvchilarKartochka />}
      {men.rol === "admin" && <JurnalKartochka />}
    </div>
  );
}

/* ── O'z parolim ──────────────────────────────────────────────────────── */
function ParolimKartochka() {
  const [eski, setEski] = useState("");
  const [yangi, setYangi] = useState("");
  const [takror, setTakror] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [natija, setNatija] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  const mos = yangi.length >= 8 && yangi === takror;

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setNatija(null);
    setIshlamoqda(true);
    try {
      const j = await yuborish<{ izoh: string }>("/api/parolim", { eski, yangi });
      setNatija(j.izoh);
      setEski(""); setYangi(""); setTakror("");
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Kartochka sarlavha="Parolim">
      <form onSubmit={joniat} className="space-y-3">
        <p className="text-sm text-xira">
          Parolni almashtirsangiz, boshqa qurilmalardagi ochiq sessiyalar yopiladi.
        </p>
        <Maydon yorliq="Joriy parol">
          <input className={KIRITISH_SINF} type="password" value={eski} autoComplete="current-password"
                 onChange={(e) => setEski(e.target.value)} />
        </Maydon>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Yangi parol" izoh="kamida 8 belgi">
            <input className={KIRITISH_SINF} type="password" value={yangi} autoComplete="new-password"
                   onChange={(e) => setYangi(e.target.value)} />
          </Maydon>
          <Maydon yorliq="Yangi parolni takrorlang"
                  izoh={takror && yangi !== takror ? "parollar mos emas" : undefined}>
            <input className={KIRITISH_SINF} type="password" value={takror} autoComplete="new-password"
                   onChange={(e) => setTakror(e.target.value)} />
          </Maydon>
        </div>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        {natija && <p className="rounded-lg border border-asos/25 bg-asos-och px-3 py-2 text-[13px] text-asos">{natija}</p>}
        <Tugma type="submit" disabled={ishlamoqda || !eski || !mos}>
          {ishlamoqda ? <><Aylanma /> Almashtirilmoqda…</> : "Parolni almashtirish"}
        </Tugma>
      </form>
    </Kartochka>
  );
}

/* ── Onlayn to'lov ────────────────────────────────────────────────────── */
type TolovSozlama = {
  bozor_id: number; provayder: string; rejim: string; faol: number;
  merchant_id: string | null; service_id: string | null; merchant_user_id: string | null;
  kassa_id: string | null; login: string; kalit_env: string | null;
  hisob_maydoni: string; kalit_bor: boolean; izoh: string | null;
};

const PROVAYDER_NOMI: Record<string, string> = {
  click: "Click", payme: "Payme", sinov: "Sinov provayderi",
};

function TolovKartochka() {
  const { men, bozorId, bozorlar } = useMen();
  const faolBozor = bozorId ?? bozorlar[0]?.id ?? null;
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{
    sozlamalar: TolovSozlama[]; ommaviy_manzil: string;
  }>(faolBozor ? `/api/tolov-sozlama?bozor=${faolBozor}` : null);
  const [tahrir, setTahrir] = useState<TolovSozlama | null>(null);

  const bor = malumot?.sozlamalar ?? [];
  const yoq = ["click", "payme", "sinov"].filter((p) => !bor.some((x) => x.provayder === p));

  return (
    <Kartochka sarlavha="Onlayn to'lov (QR)"
               ong={faolBozor ? (
                 <a href={`/api/stikerlar?bozor=${faolBozor}&holat=band`} target="_blank" rel="noreferrer">
                   <Tugma kichik uslub="ikkilamchi">QR stikerlarni chop etish</Tugma>
                 </a>
               ) : null}>
      <p className="text-sm text-xira">
        Rastadagi QR ijarachini <code className="text-[12px]">{malumot?.ommaviy_manzil || "…"}/t/…</code>{" "}
        sahifasiga olib boradi: u oylik ijarani ko&apos;radi va to&apos;laydi. Stiker bir marta chop etiladi —
        QR ichida summa yo&apos;q, shuning uchun u har oy amal qiladi.
      </p>

      {yuklanmoqda ? <Yuklanmoqda /> : xato ? <div className="mt-3"><Xato matn={xato} qayta={qayta} /></div> : (
        <div className="mt-3">
          <Jadval eng={720} ustunlar={["To'lov tizimi", "Rejim", "Sozlangan", "Holat", ""]}>
            {bor.map((x) => (
              <tr key={x.provayder} className={x.faol ? "" : "opacity-60"}>
                <td className={KATAK}>
                  <span className="font-medium">{PROVAYDER_NOMI[x.provayder] ?? x.provayder}</span>
                  {x.izoh && <span className="block text-[12px] text-xira">{x.izoh}</span>}
                </td>
                <td className={KATAK}>
                  <Belgi tur={x.rejim === "jonli" ? "band" : "ogoh"}>
                    {x.rejim === "jonli" ? "jonli" : "sinov"}
                  </Belgi>
                </td>
                <td className={`${KATAK} text-[12.5px] text-xira`}>
                  {x.provayder === "sinov" ? "kalit kerak emas"
                    : x.kalit_bor ? `kalit bor (${x.kalit_env})`
                    : x.kalit_env ? `${x.kalit_env} — serverda yo'q` : "kalit ko'rsatilmagan"}
                </td>
                <td className={KATAK}>
                  {x.faol ? <Belgi tur="faol">yoqilgan</Belgi> : <Belgi tur="xolis">o&apos;chiq</Belgi>}
                </td>
                <td className={KATAK}>
                  {men.rol === "admin" && (
                    <button onClick={() => setTahrir(x)} className="text-[13px] text-asos hover:underline">
                      Sozlash
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Jadval>

          {men.rol === "admin" && yoq.length > 0 && faolBozor && (
            <div className="mt-3 flex flex-wrap gap-2">
              {yoq.map((p) => (
                <Tugma key={p} kichik uslub="ikkilamchi"
                       onClick={() => setTahrir({
                         bozor_id: faolBozor, provayder: p, rejim: "sinov", faol: 0,
                         merchant_id: "", service_id: "", merchant_user_id: "", kassa_id: "",
                         login: "Paycom", kalit_env: "", hisob_maydoni: "kod",
                         kalit_bor: false, izoh: "",
                       })}>
                  + {PROVAYDER_NOMI[p]}
                </Tugma>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-3 rounded-lg bg-fon px-3 py-2 text-[12px] leading-relaxed text-xira">
        <b>Maxfiy kalit bazada saqlanmaydi.</b> Bu yerda faqat muhit o&apos;zgaruvchisining
        nomi ko&apos;rsatiladi (masalan <code>RASTA_CLICK_KALIT</code>), kalitning o&apos;zi esa
        serverdagi <code>/etc/rasta/</code> faylida turadi. Shu sababli bazani nusxa olgan odam
        pul yecha olmaydi.
      </p>

      {tahrir && (
        <TolovFormasi sozlama={tahrir} ommaviyManzil={malumot?.ommaviy_manzil ?? ""}
                      yop={() => setTahrir(null)} tayyor={qayta} />
      )}
    </Kartochka>
  );
}

function TolovFormasi({ sozlama, ommaviyManzil, yop, tayyor }: {
  sozlama: TolovSozlama; ommaviyManzil: string; yop: () => void; tayyor: () => void;
}) {
  const [m, setM] = useState({ ...sozlama, ommaviy_manzil: ommaviyManzil });
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setIshlamoqda(true);
    try {
      await yuborish("/api/tolov-sozlama", m);
      tayyor();
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setIshlamoqda(false);
    }
  }

  const click = m.provayder === "click";
  const payme = m.provayder === "payme";

  return (
    <Modal sarlavha={`${PROVAYDER_NOMI[m.provayder] ?? m.provayder} sozlamasi`} yop={yop}>
      <form onSubmit={joniat} className="space-y-3.5">
        <Maydon yorliq="Ommaviy manzil" izoh="QR shu manzilga ishora qiladi — domen o'zgarsa stikerlar ishlamay qoladi">
          <input className={KIRITISH_SINF} value={m.ommaviy_manzil}
                 placeholder="https://rasta.example.uz"
                 onChange={(e) => setM({ ...m, ommaviy_manzil: e.target.value })} />
        </Maydon>

        {click && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Maydon yorliq="merchant_id">
              <input className={KIRITISH_SINF} value={m.merchant_id ?? ""}
                     onChange={(e) => setM({ ...m, merchant_id: e.target.value })} />
            </Maydon>
            <Maydon yorliq="service_id">
              <input className={KIRITISH_SINF} value={m.service_id ?? ""}
                     onChange={(e) => setM({ ...m, service_id: e.target.value })} />
            </Maydon>
            <Maydon yorliq="merchant_user_id">
              <input className={KIRITISH_SINF} value={m.merchant_user_id ?? ""}
                     onChange={(e) => setM({ ...m, merchant_user_id: e.target.value })} />
            </Maydon>
          </div>
        )}

        {payme && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Maydon yorliq="Kassa (merchant) ID">
              <input className={KIRITISH_SINF} value={m.kassa_id ?? ""}
                     onChange={(e) => setM({ ...m, kassa_id: e.target.value })} />
            </Maydon>
            <Maydon yorliq="Hisob maydoni" izoh="checkout havolasidagi ac.&lt;maydon&gt;">
              <input className={KIRITISH_SINF} value={m.hisob_maydoni}
                     onChange={(e) => setM({ ...m, hisob_maydoni: e.target.value })} />
            </Maydon>
          </div>
        )}

        {m.provayder !== "sinov" && (
          <Maydon yorliq="Kalit muhit o'zgaruvchisi"
                  izoh="Kalitning O'ZI emas, faqat nomi. Masalan: RASTA_CLICK_KALIT">
            <input className={KIRITISH_SINF} value={m.kalit_env ?? ""}
                   placeholder="RASTA_CLICK_KALIT"
                   onChange={(e) => setM({ ...m, kalit_env: e.target.value })} />
          </Maydon>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Rejim" izoh="Jonli rejim uchun kalit serverda bo'lishi shart">
            <select className={KIRITISH_SINF} value={m.rejim}
                    onChange={(e) => setM({ ...m, rejim: e.target.value })}>
              <option value="sinov">Sinov (pul yechilmaydi)</option>
              <option value="jonli">Jonli</option>
            </select>
          </Maydon>
          <Maydon yorliq="Izoh">
            <input className={KIRITISH_SINF} value={m.izoh ?? ""}
                   onChange={(e) => setM({ ...m, izoh: e.target.value })} />
          </Maydon>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!m.faol}
                 onChange={(e) => setM({ ...m, faol: e.target.checked ? 1 : 0 })} />
          Yoqilgan (to&apos;lov sahifasida ko&apos;rinadi)
        </label>

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

/* ── Bozorlar (admin) ─────────────────────────────────────────────────── */
function BozorlarKartochka() {
  const { yangila } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ bozorlar: Bozor[] }>("/api/bozorlar");
  const [tahrir, setTahrir] = useState<Bozor | "yangi" | null>(null);
  const [ochirUchun, setOchirUchun] = useState<Bozor | null>(null);

  return (
    <Kartochka sarlavha="Bozorlar"
               ong={<Tugma kichik onClick={() => setTahrir("yangi")}>+ Bozor qo&apos;shish</Tugma>}>
      {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
        !malumot?.bozorlar.length ? (
          <div className="py-8 text-center">
            <p className="text-sm text-xira">Hali bozor kiritilmagan.</p>
            <p className="mt-1 text-[13px] text-xira">
              Ishni bozor qo&apos;shishdan boshlang — keyin «Bozor plani» bo&apos;limida
              rastalarni joylashtirasiz.
            </p>
          </div>
        ) : (
          <Jadval eng={760} ustunlar={["Bozor", "Manzil", { nom: "Obyekt", ong: true },
            { nom: "Band", ong: true }, "Holat", ""]}>
            {malumot.bozorlar.map((b) => (
              <tr key={b.id} className={b.faol ? "" : "opacity-55"}>
                <td className={KATAK}>
                  <span className="font-medium">{b.nomi}</span>
                  <span className="block text-[12px] text-xira">
                    {[b.viloyat, b.tuman].filter(Boolean).join(", ") || "hudud ko'rsatilmagan"}
                  </span>
                  {b.tashkilot && (
                    <span className="block text-[12px] text-xira">
                      {b.tashkilot}{b.stir ? ` · STIR ${b.stir}` : ""}
                    </span>
                  )}
                </td>
                <td className={`${KATAK} text-xira`}>
                  {b.manzil ?? "—"}
                  {b.oy_ish_kuni && (
                    <span className="block text-[12px] text-matn">
                      Ish tartibi: {b.bozor_kunlari
                        ? `${bozorKunlari(b.bozor_kunlari.split(",").map(Number))} · `
                        : b.hafta_ish_kuni ? `haftada ${b.hafta_ish_kuni} kun · ` : ""}oyiga {b.oy_ish_kuni} kun
                    </span>
                  )}
                </td>
                <td className={`${KATAK} text-right raqam`}>{b.rasta_soni ?? 0}</td>
                <td className={`${KATAK} text-right raqam`}>{b.band ?? 0}</td>
                <td className={KATAK}>
                  {b.faol ? <Belgi tur="band">faol</Belgi> : <Belgi tur="bekor">faol emas</Belgi>}
                </td>
                <td className={KATAK}>
                  <div className="flex gap-2">
                    <button onClick={() => setTahrir(b)} className="text-[13px] text-asos hover:underline">Tahrir</button>
                    <button onClick={() => setOchirUchun(b)} className="text-[13px] text-qizil hover:underline">O&apos;chirish</button>
                  </div>
                </td>
              </tr>
            ))}
          </Jadval>
        )}

      {tahrir && (
        <BozorFormasi bozor={tahrir === "yangi" ? null : tahrir}
                      yop={() => setTahrir(null)}
                      tayyor={() => { qayta(); yangila(); }} />
      )}
      {ochirUchun && (
        <Tasdiq sarlavha="Bozorni o'chirish" xatarli tugmaMatn="O'chirish"
                tavsif={<><b>{ochirUchun.nomi}</b> o&apos;chiriladi. Ichida obyekt bo&apos;lsa
                  o&apos;chirilmaydi — bunday holda uni «faol emas» qilib qo&apos;ying.</>}
                yop={() => setOchirUchun(null)}
                tasdiqla={async () => {
                  await yuborish(`/api/bozorlar/${ochirUchun.id}`, undefined, "DELETE");
                  qayta();
                  yangila();
                }} />
      )}
    </Kartochka>
  );
}

function BozorFormasi({ bozor, yop, tayyor }: { bozor: Bozor | null; yop: () => void; tayyor: () => void }) {
  const [m, setM] = useState({
    nomi: bozor?.nomi ?? "", viloyat: bozor?.viloyat ?? "", tuman: bozor?.tuman ?? "",
    manzil: bozor?.manzil ?? "", faol: bozor?.faol ?? 1,
    tashkilot: bozor?.tashkilot ?? "", tashkilot_manzil: bozor?.tashkilot_manzil ?? "",
    stir: bozor?.stir ?? "", hisob_raqam: bozor?.hisob_raqam ?? "",
    hafta_ish_kuni: bozor?.hafta_ish_kuni != null ? String(bozor.hafta_ish_kuni) : "",
    oy_ish_kuni: bozor?.oy_ish_kuni != null ? String(bozor.oy_ish_kuni) : "",
    bozor_kunlari: bozor?.bozor_kunlari ? bozor.bozor_kunlari.split(",").map(Number) : ([] as number[]),
  });
  // Ish kunlari raqam sifatida yuboriladi; bo'sh — null (reja ko'rsatilmaydi, 30 kun OLINMAYDI).
  // Bozor kunlari tanlangan bo'lsa, haftadagi kun soni shulardan olinadi.
  const yuboriladi = {
    ...m,
    bozor_kunlari: m.bozor_kunlari.length ? m.bozor_kunlari : null,
    hafta_ish_kuni: m.bozor_kunlari.length ? m.bozor_kunlari.length
      : m.hafta_ish_kuni ? Number(m.hafta_ish_kuni) : null,
    oy_ish_kuni: m.oy_ish_kuni ? Number(m.oy_ish_kuni) : null,
  };
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setIshlamoqda(true);
    try {
      if (bozor) await yuborish(`/api/bozorlar/${bozor.id}`, yuboriladi, "PATCH");
      else await yuborish("/api/bozorlar", yuboriladi);
      tayyor();
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setIshlamoqda(false);
    }
  }

  return (
    <Modal sarlavha={bozor ? "Bozorni tahrirlash" : "Yangi bozor"} yop={yop} keng>
      <form onSubmit={joniat} className="space-y-3.5">
        <Maydon yorliq="Bozor nomi">
          <input className={KIRITISH_SINF} value={m.nomi} required autoFocus
                 onChange={(e) => setM({ ...m, nomi: e.target.value })} />
        </Maydon>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Viloyat">
            <input className={KIRITISH_SINF} value={m.viloyat} placeholder="Jizzax"
                   onChange={(e) => setM({ ...m, viloyat: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Tuman / shahar">
            <input className={KIRITISH_SINF} value={m.tuman} placeholder="Zomin tumani"
                   onChange={(e) => setM({ ...m, tuman: e.target.value })} />
          </Maydon>
        </div>
        <Maydon yorliq="Manzil">
          <input className={KIRITISH_SINF} value={m.manzil}
                 onChange={(e) => setM({ ...m, manzil: e.target.value })} />
        </Maydon>

        <p className="pt-1 text-[13px] font-semibold">Bozor egasi (yuridik shaxs) — chek va hujjatda sotuvchi</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Tashkilot nomi">
            <input className={KIRITISH_SINF} value={m.tashkilot} placeholder="«…» MChJ"
                   onChange={(e) => setM({ ...m, tashkilot: e.target.value })} />
          </Maydon>
          <Maydon yorliq="STIR" izoh="9 xonali (yuridik) yoki JSHSHIR 14 xonali">
            <input className={KIRITISH_SINF} value={m.stir} inputMode="numeric"
                   onChange={(e) => setM({ ...m, stir: e.target.value })} />
          </Maydon>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Yuridik manzil">
            <input className={KIRITISH_SINF} value={m.tashkilot_manzil}
                   onChange={(e) => setM({ ...m, tashkilot_manzil: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Hisob raqami" izoh="20 xonali">
            <input className={KIRITISH_SINF} value={m.hisob_raqam} inputMode="numeric"
                   onChange={(e) => setM({ ...m, hisob_raqam: e.target.value })} />
          </Maydon>
        </div>

        <p className="pt-1 text-[13px] font-semibold">Ish tartibi</p>
        <div>
          <p className="mb-1.5 text-[13px] text-xira">Bozor kunlari</p>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((k) => {
              const tanlangan = m.bozor_kunlari.includes(k);
              return (
                <button key={k} type="button" aria-pressed={tanlangan}
                        onClick={() => setM({ ...m, bozor_kunlari: tanlangan
                          ? m.bozor_kunlari.filter((x) => x !== k)
                          : [...m.bozor_kunlari, k].sort((a, b) => a - b) })}
                        className={`rounded-lg border px-3 py-1.5 text-[13px] ${tanlangan
                          ? "border-asos bg-asos text-white" : "border-chiziq bg-karta text-matn hover:border-asos"}`}>
                  {HAFTA_KUNLARI[k]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Haftada bozor kuni" izoh={m.bozor_kunlari.length ? "tanlangan kunlardan" : undefined}>
            <input className={KIRITISH_SINF} type="number" min={1} max={7}
                   value={m.bozor_kunlari.length ? String(m.bozor_kunlari.length) : m.hafta_ish_kuni}
                   disabled={m.bozor_kunlari.length > 0}
                   onChange={(e) => setM({ ...m, hafta_ish_kuni: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Oyiga bozor kuni" izoh="patta rejasi shu son bilan hisoblanadi">
            <input className={KIRITISH_SINF} type="number" min={1} max={31} value={m.oy_ish_kuni}
                   onChange={(e) => setM({ ...m, oy_ish_kuni: e.target.value })} />
          </Maydon>
        </div>
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Oylik reja = rastalar × patta puli × <b>oyiga bozor kuni</b>. Masalan haftada bir kun
          ishlaydigan bozorda 4 kun — 30 kun emas. Bo&apos;sh qoldirilsa reja umuman ko&apos;rsatilmaydi.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!m.faol}
                 onChange={(e) => setM({ ...m, faol: e.target.checked ? 1 : 0 })} />
          Faol (ro&apos;yxatlarda ko&apos;rinadi)
        </label>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda || m.nomi.trim().length < 3}>
            {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : bozor ? "Saqlash" : "Yaratish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

/* ── Tariflarga havola ────────────────────────────────────────────────── */
function TariflarHavolasi() {
  return (
    <Kartochka sarlavha="Tariflar">
      <p className="text-sm text-xira">
        Bir kunlik joy haqi va ijara tariflari (maydon × stavka, shartnoma tuzishda
        taklif sifatida) alohida sahifada yuritiladi.
      </p>
      <Link href="/tariflar"
            className="mt-3 inline-flex rounded-lg bg-asos px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
        Tariflar sahifasi →
      </Link>
    </Kartochka>
  );
}

/* ── Foydalanuvchilar (admin) ─────────────────────────────────────────── */
function FoydalanuvchilarKartochka() {
  const { bozorlar } = useMen();
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ foydalanuvchilar: Foydalanuvchi[] }>(
    "/api/foydalanuvchilar");
  const [yangiOchiq, setYangiOchiq] = useState(false);
  const [parolUchun, setParolUchun] = useState<Foydalanuvchi | null>(null);
  const [faollikUchun, setFaollikUchun] = useState<Foydalanuvchi | null>(null);
  const [xabar, setXabar] = useState<string | null>(null);

  return (
    <Kartochka sarlavha="Foydalanuvchilar"
               ong={<Tugma kichik onClick={() => setYangiOchiq(true)}>+ Qo&apos;shish</Tugma>}>
      {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
        !malumot?.foydalanuvchilar.length ? <Bosh /> : (
          <Jadval eng={760} ustunlar={["Foydalanuvchi", "Rol", "Bozor", "Holat", ""]}>
            {malumot.foydalanuvchilar.map((f) => (
              <tr key={f.id} className={f.faol ? "" : "opacity-55"}>
                <td className={KATAK}>
                  <span className="font-medium">{f.fio}</span>
                  <span className="block text-[12px] text-xira">{f.login}{f.telefon ? ` · ${f.telefon}` : ""}</span>
                </td>
                <td className={`${KATAK} text-xira`}>{ROL_NOMI[f.rol]}</td>
                <td className={`${KATAK} text-xira`}>{f.bozor_nomi ?? "barcha bozorlar"}</td>
                <td className={KATAK}>
                  {f.faol ? <Belgi tur="band">faol</Belgi> : <Belgi tur="bekor">o&apos;chirilgan</Belgi>}
                </td>
                <td className={KATAK}>
                  <div className="flex gap-2">
                    <button onClick={() => setParolUchun(f)} className="text-[13px] text-asos hover:underline">Parol</button>
                    <button onClick={() => setFaollikUchun(f)} className="text-[13px] text-xira hover:underline">
                      {f.faol ? "O'chirish" : "Yoqish"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Jadval>
        )}
      {yangiOchiq && <YangiFoydalanuvchi bozorlar={bozorlar} yop={() => setYangiOchiq(false)} tayyor={qayta} />}

      {parolUchun && (
        <Tasdiq sarlavha={`Parolni almashtirish — ${parolUchun.login}`} tugmaMatn="Almashtirish"
                tavsif={<>Yangi parol <b>{parolUchun.fio}</b> uchun o&apos;rnatiladi va uning barcha
                  ochiq sessiyalari yopiladi. Parolni foydalanuvchiga o&apos;zingiz yetkazing.</>}
                parol={{ yorliq: "Yangi parol", minUzunlik: 8, izoh: "Kamida 8 belgi" }}
                yop={() => setParolUchun(null)}
                tasdiqla={async (yangiParol) => {
                  await yuborish(`/api/foydalanuvchilar/${parolUchun.id}`, { parol: yangiParol }, "PATCH");
                  setXabar(`${parolUchun.login} paroli almashtirildi. Eski sessiyalari yopildi.`);
                }} />
      )}

      {faollikUchun && (
        <Tasdiq sarlavha={faollikUchun.faol ? "Foydalanuvchini o'chirish" : "Foydalanuvchini yoqish"}
                xatarli={!!faollikUchun.faol}
                tugmaMatn={faollikUchun.faol ? "O'chirish" : "Yoqish"}
                tavsif={faollikUchun.faol
                  ? <><b>{faollikUchun.fio}</b> tizimga kira olmaydi. Uning yozuvlari va jurnaldagi
                      izlari saqlanib qoladi.</>
                  : <><b>{faollikUchun.fio}</b> yana tizimga kira oladi.</>}
                yop={() => setFaollikUchun(null)}
                tasdiqla={async () => {
                  await yuborish(`/api/foydalanuvchilar/${faollikUchun.id}`,
                    { faol: faollikUchun.faol ? 0 : 1 }, "PATCH");
                  qayta();
                }} />
      )}

      {xabar && <Xabar sarlavha="Bajarildi" matn={xabar} yop={() => setXabar(null)} />}
    </Kartochka>
  );
}

function YangiFoydalanuvchi({ bozorlar, yop, tayyor }: {
  bozorlar: { id: number; nomi: string }[]; yop: () => void; tayyor: () => void;
}) {
  const [m, setM] = useState({ fio: "", login: "", parol: "", telefon: "", rol: "yiguvchi", bozor_id: "" });
  const [xato, setXato] = useState<string | null>(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const bozorgaBogliq = m.rol === "boshqaruvchi" || m.rol === "yiguvchi";

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setYuborilmoqda(true);
    try {
      await yuborish("/api/foydalanuvchilar", { ...m, bozor_id: m.bozor_id ? Number(m.bozor_id) : null });
      tayyor();
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setYuborilmoqda(false);
    }
  }

  return (
    <Modal sarlavha="Yangi foydalanuvchi" yop={yop}>
      <form onSubmit={joniat} className="space-y-3.5">
        <Maydon yorliq="To'liq ism">
          <input className={KIRITISH_SINF} value={m.fio} required autoFocus
                 onChange={(e) => setM({ ...m, fio: e.target.value })} />
        </Maydon>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Login" izoh="kichik harf, raqam, . _ -">
            <input className={KIRITISH_SINF} value={m.login} required
                   onChange={(e) => setM({ ...m, login: e.target.value.toLowerCase().replace(/[^a-z0-9._@-]/g, "") })} />
          </Maydon>
          <Maydon yorliq="Parol" izoh="kamida 8 belgi">
            <input className={KIRITISH_SINF} type="password" value={m.parol} required minLength={8}
                   onChange={(e) => setM({ ...m, parol: e.target.value })} />
          </Maydon>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="Rol">
            <select className={KIRITISH_SINF} value={m.rol} onChange={(e) => setM({ ...m, rol: e.target.value })}>
              {Object.entries(ROL_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="Bozor"
                  izoh={bozorgaBogliq ? "Boshqaruvchi va yig'uvchi uchun majburiy"
                                      : "Bo'sh = barcha bozorlar"}>
            {/* Boshqaruvchi/yig'uvchi bozorsiz bo'lmaydi: ilgari «Barcha bozorlar»
                tanlangan boshqaruvchi hamma bozorni admin kabi boshqarardi. */}
            <select className={KIRITISH_SINF} value={m.bozor_id} required={bozorgaBogliq}
                    onChange={(e) => setM({ ...m, bozor_id: e.target.value })}>
              <option value="">{bozorgaBogliq ? "— tanlang —" : "Barcha bozorlar"}</option>
              {bozorlar.map((b) => <option key={b.id} value={b.id}>{b.nomi}</option>)}
            </select>
          </Maydon>
        </div>
        <Maydon yorliq="Telefon">
          <input className={KIRITISH_SINF} value={m.telefon} onChange={(e) => setM({ ...m, telefon: e.target.value })} />
        </Maydon>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={yuborilmoqda}>
            {yuborilmoqda ? <><Aylanma /> Saqlanmoqda…</> : "Yaratish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

/* ── Jurnal (admin) ───────────────────────────────────────────────────── */
function JurnalKartochka() {
  const { malumot, xato, yuklanmoqda, qayta } = useMalumot<{ jurnal: Jurnal[] }>("/api/jurnal?chegara=80");
  return (
    <Kartochka sarlavha="Amallar jurnali"
               ong={<button onClick={qayta} className="text-[13px] text-asos hover:underline">Yangilash</button>}>
      {yuklanmoqda ? <Yuklanmoqda /> : xato ? <Xato matn={xato} qayta={qayta} /> :
        !malumot?.jurnal.length ? <Bosh matn="Jurnal bo'sh" /> : (
          <Jadval eng={760} ustunlar={["Vaqt", "Kim", "Amal", "Tafsilot", "IP"]}>
            {malumot.jurnal.map((j) => (
              <tr key={j.id}>
                <td className={`${KATAK} whitespace-nowrap text-xira`}>{vaqt(j.vaqt)}</td>
                <td className={KATAK}>{j.fio ?? "—"}</td>
                <td className={KATAK}><code className="text-[12.5px]">{j.amal}</code></td>
                <td className={`${KATAK} text-[12.5px] text-xira`}>{j.tafsilot ?? ""}</td>
                <td className={`${KATAK} text-[12px] text-xira`}>{j.ip ?? ""}</td>
              </tr>
            ))}
          </Jadval>
        )}
    </Kartochka>
  );
}
