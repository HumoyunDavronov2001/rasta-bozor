"use client";

/* CHEKCHI ekrani — bozorda chek beradigan odam uchun.
 *
 * Ish oqimi bir xil va tez takrorlanadi: savdogar keladi → summa (ko'pincha
 * tarifdan) → «Chek berish» → savdogar QR ni skanerlaydi yoki chek chop
 * etiladi → keyingisi. Shuning uchun ekranda:
 *   · YIRIK raqam klaviaturasi (qo'lqopda ham bosiladi),
 *   · tarifdan tayyor summalar (1, 2, 3 o'rin),
 *   · chek darhol QR bilan ko'rinadi — printer bo'lmasa ham savdogar dalil oladi,
 *   · bugun berilgan cheklar ro'yxati (qayta ko'rsatish uchun).
 *
 * HALOLLIK: chek `mahalliy` — fiskal emas, buni chekning o'zi ham aytadi.
 */
import Link from "next/link";
import { useState } from "react";
import { useKechiktir, useMalumot, yuborish } from "@/lib/api";
import { useMen, tolovQabulQiladi } from "@/lib/kontekst";
import { bugun, pul, vaqt } from "@/lib/format";
import type { KunHolati, Rasta, Tarif } from "@/lib/turlar";
import {
  Aylanma, Belgi, Bosh, KIRITISH_SINF, Kartochka, Maydon, Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { MobilKarta } from "@/komponent/mobil";

type Smena = {
  id: number; holat: string; naqd: number; kutilgan_naqd: number;
  kunlik_summa: number; kunlik_soni: number;
};
type Kunlik = {
  id: number; sana: string; summa: number; mahsulot: string | null; savdogar: string | null;
  orin_soni: number; rasta_raqam: string | null; bekor: number;
  chek_kod?: string | null; chek_raqam?: string | null; vaqt?: string;
};
type ChekNatija = {
  summa: number; kvitansiya: string; chek_kod: string; chek_raqam: string;
  tarif_ishlatildi: boolean;
};

export default function ChekchiSahifasi() {
  const { men, bozorId, bozorSorov, bozorlar } = useMen();
  const [yangilash, setYangilash] = useState(0);
  const [chek, setChek] = useState<ChekNatija | null>(null);

  const smena = useMalumot<{ smena: Smena | null }>(`/api/smena?v=${yangilash}&${bozorSorov}`);
  const kunlik = useMalumot<{ jami: { soni: number; summa: number; orin: number }; yigimlar: Kunlik[] }>(
    `/api/kunlik?v=${yangilash}&dan=${bugun()}&${bozorSorov}`);
  const tariflar = useMalumot<{ tariflar: Tarif[] }>(`/api/tariflar?${bozorSorov}`);
  // Patta bozori: pul ANIQ rastaga yoziladi; kamera ko'rgan, lekin to'lamagan (qizil) rastalar ro'yxati
  const bozor = bozorlar.find((b) => b.id === bozorId);
  const patta = !!bozor?.oy_ish_kuni;
  const kun = useMalumot<KunHolati>(patta && bozorId
    ? `/api/bozorlar/${bozorId}/kun-holati?sana=${bugun()}&v=${yangilash}` : null);

  const joriy = smena.malumot?.smena ?? null;
  const kunlikTarif = (tariflar.malumot?.tariflar ?? [])
    .find((t) => t.tur === "kunlik" && t.faol === 1) ?? null;
  const qayta = () => setYangilash((v) => v + 1);

  if (!tolovQabulQiladi(men)) {
    return (
      <Kartochka sarlavha="Chekchi">
        <p className="text-sm text-xira">
          Bu ekran pul qabul qiladigan xodim uchun. Sizning rolingizda chek
          berilmaydi — «Kassa» va «To&apos;lovlar» bo&apos;limlarini ko&apos;rishingiz mumkin.
        </p>
      </Kartochka>
    );
  }

  // Chek berilgandan keyin — to'liq ekranli natija. Chekchining keyingi harakati
  // aniq: QR ni ko'rsatish yoki yangi chek.
  if (chek) {
    return <ChekNatijasi chek={chek} yangi={() => setChek(null)} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Chekchi</h1>
        <p className="mt-1 text-sm text-xira">
          Bir kunlik joy haqi uchun chek. Savdogar QR ni skanerlaydi — chek
          uning telefonida ochiladi. Chek <b>fiskal emas</b>, buni hujjatning
          o&apos;zi ham yozib beradi.
        </p>
      </div>

      {smena.yuklanmoqda ? <Yuklanmoqda matn="Smena tekshirilmoqda…" /> :
        joriy ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border
                          border-asos/25 bg-asos-och px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-asos">Smena #{joriy.id} ochiq</p>
              <p className="mt-0.5 text-[12.5px] text-asos/80">
                Bugun: <b>{joriy.kunlik_soni} chek</b> · {pul(joriy.kunlik_summa)} so&apos;m ·
                kassada {pul(joriy.kutilgan_naqd)}
              </p>
            </div>
            <Link href="/kassa"><Tugma kichik uslub="ikkilamchi">Kassa</Tugma></Link>
          </div>
        ) : (
          <div className="rounded-xl border border-sariq/30 bg-sariq-och px-4 py-3">
            <p className="text-[13px] font-medium text-sariq">Smena ochilmagan</p>
            <p className="mt-0.5 text-[12.5px] text-sariq/90">
              Naqd pul ochiq smenaga tushishi kerak — aks holda kun oxirida pulni
              kim topshirishi noma&apos;lum bo&apos;lib qoladi.
            </p>
            <Link href="/tezkor" className="mt-2 inline-block">
              <Tugma kichik>Smenani ochish</Tugma>
            </Link>
          </div>
        )}

      <ChekForma tarif={kunlikTarif} bozorId={bozorId} bozorSorov={bozorSorov}
                 patta={patta} qizil={kun.malumot?.qizil ?? []}
                 smenaBor={!!joriy} tayyor={(n) => { setChek(n); qayta(); }} />

      <Kartochka sarlavha="Bugun berilgan cheklar"
                 ong={kunlik.malumot ? (
                   <span className="text-[12.5px] text-xira">
                     {kunlik.malumot.jami.soni} ta · {pul(kunlik.malumot.jami.summa)} so&apos;m
                   </span>
                 ) : null}>
        {kunlik.yuklanmoqda ? <Yuklanmoqda /> :
          kunlik.xato ? <Xato matn={kunlik.xato} qayta={kunlik.qayta} /> :
          !kunlik.malumot?.yigimlar.length ? <Bosh matn="Bugun chek berilmagan" /> : (
            <div className="space-y-2">
              {kunlik.malumot.yigimlar.map((k) => (
                <MobilKarta key={k.id}
                            sarlavha={k.chek_raqam ?? k.mahsulot ?? "Joy haqi"}
                            belgi={k.bekor ? <Belgi tur="bekor">bekor</Belgi> : null}
                            tavsif={<>
                              {k.mahsulot ? `${k.mahsulot} · ` : ""}
                              {k.orin_soni} o&apos;rin
                              {k.rasta_raqam ? ` · ${k.rasta_raqam}` : ""}
                              {k.savdogar ? ` · ${k.savdogar}` : ""}
                              {k.vaqt && <span className="block">{vaqt(k.vaqt)}</span>}
                            </>}
                            ong={`${pul(k.summa)} so'm`}
                            amallar={k.chek_kod && !k.bekor ? (
                              <>
                                <a href={`/c/${k.chek_kod}`} target="_blank" rel="noreferrer">
                                  <Tugma kichik uslub="ikkilamchi">Chekni ochish</Tugma>
                                </a>
                                <Tugma kichik uslub="ikkilamchi"
                                       onClick={() => setChek({
                                         summa: k.summa, kvitansiya: "", chek_kod: k.chek_kod!,
                                         chek_raqam: k.chek_raqam ?? "", tarif_ishlatildi: false,
                                       })}>
                                  QR ko&apos;rsatish
                                </Tugma>
                              </>
                            ) : undefined} />
              ))}
            </div>
          )}
      </Kartochka>
    </div>
  );
}

/* ── Chek berish formasi: yirik klaviatura + tarifdan tayyor summalar ── */
function ChekForma({ tarif, bozorId, bozorSorov, patta, qizil, smenaBor, tayyor }: {
  tarif: Tarif | null; bozorId: number | null; bozorSorov: string;
  patta: boolean; qizil: KunHolati["qizil"];
  smenaBor: boolean; tayyor: (n: ChekNatija) => void;
}) {
  const [summa, setSumma] = useState("");
  const [orin, setOrin] = useState(1);
  const [mahsulot, setMahsulot] = useState("");
  const [savdogar, setSavdogar] = useState("");
  const [usul, setUsul] = useState("naqd");
  const [rasta, setRasta] = useState<{ id: number; raqam: string } | null>(null);
  const [qidiruvOchiq, setQidiruvOchiq] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  // Tarif bo'lsa summa avtomatik: stavka × o'rin. Chekchi uni qo'lda
  // o'zgartira oladi, lekin standart holat — TARIF.
  const tarifSummasi = tarif ? tarif.narx * orin : null;
  const yakuniy = summa ? Number(summa) : tarifSummasi;

  function raqam(belgi: string) {
    setXato(null);
    if (belgi === "C") return setSumma("");
    if (belgi === "←") return setSumma((s) => s.slice(0, -1));
    if (belgi === "000") return setSumma((s) => (s ? `${s}000`.slice(0, 9) : s));
    setSumma((s) => `${s}${belgi}`.replace(/^0+(?=\d)/, "").slice(0, 9));
  }

  async function chekBer() {
    if (!yakuniy || yakuniy <= 0) {
      setXato("Summa kiritilmagan — tarif ham belgilanmagan");
      return;
    }
    setIshlamoqda(true);
    setXato(null);
    try {
      const n = await yuborish<ChekNatija>("/api/kunlik", {
        bozor_id: bozorId, rasta_id: rasta?.id ?? null, sana: bugun(),
        summa: summa ? Number(summa) : null, orin_soni: orin,
        mahsulot: mahsulot || null, savdogar: savdogar || null, usul,
      });
      setSumma("");
      setMahsulot("");
      setSavdogar("");
      setOrin(1);
      setRasta(null);
      tayyor(n);
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <Kartochka sarlavha="Yangi chek">
      {/* Patta bozori: rasta MAJBURIY — pul aniq rastaga yoziladi, shundagina rasta yashil bo'ladi */}
      {patta && (
        <div className="mb-3 rounded-xl border border-chiziq px-3 py-2.5">
          <p className="text-[13px] font-medium">Rasta <span className="text-qizil">(majburiy)</span></p>
          {rasta ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="raqam text-[26px] font-semibold leading-none">{rasta.raqam}</p>
              <Tugma kichik uslub="ikkilamchi" onClick={() => setRasta(null)}>Boshqa rasta</Tugma>
            </div>
          ) : qidiruvOchiq ? (
            <div className="mt-2">
              <RastaQidiruv bozorSorov={bozorSorov}
                            tanla={(r) => { setRasta(r); setQidiruvOchiq(false); }} />
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {qizil.length > 0 && (
                <div>
                  <p className="text-[12px] text-qizil">Kamera ko&apos;rgan, lekin to&apos;lamagan ({qizil.length}):</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {qizil.map((q) => (
                      <button key={q.rasta_id} type="button" onClick={() => setRasta({ id: q.rasta_id, raqam: q.raqam })}
                              className="raqam h-10 min-w-12 rounded-lg border border-qizil/40 bg-qizil-och px-3
                                         text-[15px] font-semibold text-qizil">
                        {q.raqam}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Tugma kichik uslub="ikkilamchi" onClick={() => setQidiruvOchiq(true)}>Rasta raqamini kiritish</Tugma>
            </div>
          )}
        </div>
      )}

      {/* Summa ko'rsatkichi */}
      <div className="rounded-xl bg-fon px-4 py-4 text-center">
        <p className="text-[12px] text-xira">To&apos;lov summasi</p>
        <p className="raqam mt-1 text-[34px] font-semibold leading-none">
          {yakuniy ? pul(yakuniy) : "0"}
          <span className="ml-1 text-[15px] font-normal text-xira">so&apos;m</span>
        </p>
        {!summa && tarifSummasi ? (
          <p className="mt-1.5 text-[12px] text-asos">
            tarifdan: {pul(tarif!.narx)} × {orin} {patta ? "rasta" : "o'rin"}
          </p>
        ) : summa ? (
          <button onClick={() => setSumma("")} className="mt-1.5 text-[12px] text-asos underline">
            tarifga qaytish
          </button>
        ) : (
          <p className="mt-1.5 text-[12px] text-sariq">
            Kunlik tarif belgilanmagan — summani qo&apos;lda kiriting
          </p>
        )}
      </div>

      {/* O'rin soni — eng ko'p ishlatiladigan tanlov (patta bozorida: bitta chek — bitta rasta) */}
      {!patta && <div className="mt-3 flex items-center gap-2">
        <span className="text-[13px] text-xira">O&apos;rin:</span>
        {[1, 2, 3, 4].map((n) => (
          <button key={n} onClick={() => setOrin(n)}
                  className={`h-11 flex-1 rounded-xl border text-[15px] font-medium transition
                              ${orin === n ? "border-asos bg-asos text-white"
                                           : "border-chiziq bg-karta"}`}>
            {n}
          </button>
        ))}
      </div>}

      {/* Raqam klaviaturasi */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "←"].map((b) => (
          <button key={b} onClick={() => raqam(b)}
                  className="h-14 rounded-xl border border-chiziq bg-karta text-[19px]
                             font-medium active:bg-fon">
            {b}
          </button>
        ))}
      </div>

      {/* Ixtiyoriy tafsilotlar — yig'ilib turadi, ekranni band qilmaydi */}
      <details className="mt-3 rounded-xl border border-chiziq px-3 py-2">
        <summary className="cursor-pointer text-[13px] text-xira">
          {patta ? "Qo'shimcha: mahsulot, savdogar, to'lov usuli"
                 : `Qo'shimcha: rasta, mahsulot, savdogar${rasta ? ` · ${rasta.raqam}` : ""}`}
        </summary>
        <div className="mt-3 space-y-3">
          {!patta && <Maydon yorliq="Rasta / o'rin" izoh="ixtiyoriy — bo'sh bo'lsa bozorga yoziladi">
            {rasta ? (
              <div className="flex items-center gap-2">
                <input className={KIRITISH_SINF} value={rasta.raqam} disabled />
                <Tugma kichik uslub="ikkilamchi" onClick={() => setRasta(null)}>Olib tashlash</Tugma>
              </div>
            ) : qidiruvOchiq ? (
              <RastaQidiruv bozorSorov={bozorSorov}
                            tanla={(r) => { setRasta(r); setQidiruvOchiq(false); }} />
            ) : (
              <Tugma kichik uslub="ikkilamchi" onClick={() => setQidiruvOchiq(true)}>
                Rastani tanlash
              </Tugma>
            )}
          </Maydon>}
          <Maydon yorliq="Mahsulot" izoh="ixtiyoriy">
            <input className={KIRITISH_SINF} value={mahsulot} maxLength={120}
                   placeholder="Pomidor, kartoshka…"
                   onChange={(e) => setMahsulot(e.target.value)} />
          </Maydon>
          <Maydon yorliq="Savdogar" izoh="ixtiyoriy — qonun talab qilmaydi">
            <input className={KIRITISH_SINF} value={savdogar} maxLength={200}
                   onChange={(e) => setSavdogar(e.target.value)} />
          </Maydon>
          <Maydon yorliq="To'lov usuli">
            <select className={KIRITISH_SINF} value={usul}
                    onChange={(e) => setUsul(e.target.value)}>
              <option value="naqd">Naqd</option>
              <option value="karta">Plastik karta</option>
            </select>
          </Maydon>
        </div>
      </details>

      {!smenaBor && usul === "naqd" && (
        <p className="mt-3 rounded-lg border border-sariq/30 bg-sariq-och px-3 py-2 text-[12.5px] text-sariq">
          Smena ochilmagan — naqd chek berilmaydi. «Kassa» da smenani oching.
        </p>
      )}
      {xato && (
        <p className="mt-3 rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">
          {xato}
        </p>
      )}

      <Tugma sinf="mt-3 w-full justify-center py-4 text-[16px]"
             onClick={chekBer} disabled={ishlamoqda || !yakuniy || (patta && !rasta)}>
        {ishlamoqda ? <><Aylanma /> Yozilmoqda…</>
          : patta && !rasta ? "Avval rastani tanlang"
          : `Chek berish · ${pul(yakuniy ?? 0)} so'm${rasta ? ` · rasta ${rasta.raqam}` : ""}`}
      </Tugma>
    </Kartochka>
  );
}

function RastaQidiruv({ bozorSorov, tanla }: {
  bozorSorov: string; tanla: (r: Rasta) => void;
}) {
  const [q, setQ] = useState("");
  const kechikkan = useKechiktir(q);
  const natija = useMalumot<{ rastalar: Rasta[] }>(
    kechikkan.trim() ? `/api/rastalar?q=${encodeURIComponent(kechikkan.trim())}&chegara=12&${bozorSorov}`
      : null);

  return (
    <div>
      <input className={KIRITISH_SINF} value={q} autoFocus inputMode="search"
             placeholder="Rasta raqami…" onChange={(e) => setQ(e.target.value)} />
      {natija.malumot?.rastalar.length ? (
        <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
          {natija.malumot.rastalar.map((r) => (
            <button key={r.id} onClick={() => tanla(r)}
                    className="flex w-full items-center justify-between rounded-lg border
                               border-chiziq px-3 py-2.5 text-left text-[13.5px] active:bg-fon">
              <span className="font-medium">{r.raqam}</span>
              <span className="text-[12px] text-xira">
                {r.blok_nomi ?? ""}{r.ijarachi_fio ? ` · ${r.ijarachi_fio}` : ""}
              </span>
            </button>
          ))}
        </div>
      ) : kechikkan.trim() && !natija.yuklanmoqda ? (
        <p className="mt-2 text-[12.5px] text-xira">Topilmadi</p>
      ) : null}
    </div>
  );
}

/* ── Chek natijasi: QR + chop etish ─────────────────────────────────────── */
function ChekNatijasi({ chek, yangi }: { chek: ChekNatija; yangi: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-asos/30 bg-asos-och px-4 py-4 text-center">
        <p className="text-[13px] font-medium text-asos">Chek berildi</p>
        <p className="raqam mt-1 text-[30px] font-semibold leading-none text-asos">
          {pul(chek.summa)} <span className="text-[15px] font-normal">so&apos;m</span>
        </p>
        {chek.chek_raqam && (
          <p className="mt-1 text-[12.5px] text-asos/80">{chek.chek_raqam}</p>
        )}
      </div>

      <Kartochka sarlavha="Savdogar skanerlaydi">
        <div className="flex flex-col items-center gap-3">
          {/* QR serverda yasaladi (SVG, `server/qr.py`) — front uchun kutubxona
              kerak emas. `next/image` bu yerda ortiqcha: rasm o'z API mizdan
              keladi, o'lchami qat'iy va optimizatsiya foyda bermaydi. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/chek/${chek.chek_kod}/qr`} alt="Chek QR kodi"
               className="h-56 w-56 rounded-lg border border-chiziq bg-white p-2" />
          <p className="text-center text-[12.5px] text-xira">
            QR ni skanerlaganda chek savdogarning telefonida ochiladi. Bu
            <b> mahalliy hisob-kitob hujjati</b> — fiskal chek emas.
          </p>
        </div>
      </Kartochka>

      <div className="grid grid-cols-2 gap-2">
        <a href={`/c/${chek.chek_kod}`} target="_blank" rel="noreferrer">
          <Tugma uslub="ikkilamchi" sinf="w-full justify-center py-3">Chekni ochish</Tugma>
        </a>
        <Tugma sinf="w-full justify-center py-3" onClick={yangi}>Yangi chek</Tugma>
      </div>
    </div>
  );
}
