"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { olish, useMalumot, yuborish } from "@/lib/api";
import { pul } from "@/lib/format";
import { Aylanma, KIRITISH_SINF, Tugma } from "@/komponent/asos";

type Holat = {
  rasta_raqam: string; bozor_nomi: string; blok_nomi: string | null;
  shartnoma_bor: boolean; tolash_mumkin: boolean; izoh?: string;
  oylik_tolov?: number; tavsiya_summa?: number; provayderlar?: string[];
};

type Sessiya = { kod: string; summa: number; provayder: string; rejim: string;
                 havola?: string | null };
type SessiyaHolat = { holat: string; summa: number; chek_kod?: string | null };

const PROVAYDER_NOMI: Record<string, string> = {
  click: "Click", payme: "Payme", sinov: "Sinov rejimi — pul yechilmaydi",
};

/** Rastadagi QR skanerlanganda ochiladigan ommaviy sahifa.
 *  Kirish talab qilinmaydi — shuning uchun bu yerda ijarachi ismi ko'rsatilmaydi. */
export default function TolovSahifasi() {
  const { kod } = useParams<{ kod: string }>();
  const { malumot, xato, yuklanmoqda } = useMalumot<Holat>(`/api/t/${kod}`);
  // Holat "foydalanuvchi tegdimi" ni saqlaydi; tegmagan bo'lsa qiymat ma'lumotdan
  // hisoblanadi. Shu tufayli effektda setState qilish kerak emas.
  const [summaTahrir, setSummaTahrir] = useState<string | null>(null);
  const [provayderTanlov, setProvayderTanlov] = useState<string | null>(null);
  const [sessiya, setSessiya] = useState<Sessiya | null>(null);
  const [holat, setHolat] = useState<SessiyaHolat | null>(null);
  const [amalXato, setAmalXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  // To'lov boshlangach holatni kuzatib turamiz
  useEffect(() => {
    if (!sessiya || holat?.holat === "tolandi") return;
    const t = setInterval(() => {
      olish<SessiyaHolat>(`/api/sessiya/${sessiya.kod}`).then(setHolat).catch(() => {});
    }, 2500);
    return () => clearInterval(t);
  }, [sessiya, holat?.holat]);

  const summa = summaTahrir ?? String(malumot?.tavsiya_summa ?? "");
  const provayder = provayderTanlov ?? malumot?.provayderlar?.[0] ?? "";
  const summaSon = Number(summa.replace(/\s/g, ""));

  async function boshla() {
    setAmalXato(null);
    setIshlamoqda(true);
    try {
      const s = await yuborish<Sessiya>(`/api/t/${kod}/sessiya`, { summa: summaSon, provayder });
      setSessiya(s);
      setHolat({ holat: "yangi", summa: s.summa });
      // Click/Payme uchun — provayder to'lov sahifasiga o'tamiz.
      if (s.havola) {
        window.location.href = s.havola;
        return;
      }
    } catch (e) {
      setAmalXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  /** Sinov provayderi: haqiqiy webhook yo'li bo'ylab to'lovni yakunlaydi. */
  async function sinovToLa() {
    if (!sessiya) return;
    setAmalXato(null);
    setIshlamoqda(true);
    try {
      const p = await yuborish<{ tashqi_id: string }>("/api/sinov/prepare",
        { kod: sessiya.kod, summa: sessiya.summa });
      await yuborish("/api/sinov/complete", { tashqi_id: p.tashqi_id });
      setHolat(await olish<SessiyaHolat>(`/api/sessiya/${sessiya.kod}`));
    } catch (e) {
      setAmalXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[460px] flex-col gap-4 bg-fon p-4">
      <header className="pt-4 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-asos">RASTA</p>
        <p className="text-[13px] text-xira">Bozor to&apos;lovlari</p>
      </header>

      {yuklanmoqda && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-xira">
          <Aylanma /> Yuklanmoqda…
        </div>
      )}

      {xato && (
        <div className="rounded-xl border border-qizil/25 bg-qizil-och p-4 text-center text-sm text-qizil">
          {xato}
        </div>
      )}

      {malumot && (
        <>
          <section className="rounded-xl border border-chiziq bg-karta p-5 text-center">
            <p className="text-[13px] text-xira">{malumot.bozor_nomi}</p>
            {malumot.blok_nomi && <p className="text-[13px] text-xira">{malumot.blok_nomi}</p>}
            <p className="mt-2 text-[32px] font-semibold leading-none tracking-tight">
              {malumot.rasta_raqam}
            </p>
            {malumot.tolash_mumkin ? (
              <div className="mt-4 rounded-lg bg-fon px-4 py-3">
                <p className="text-[13px] text-xira">Oylik ijara</p>
                <p className="raqam text-[26px] font-semibold">
                  {pul(malumot.oylik_tolov ?? 0)} so&apos;m
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-sariq-och px-4 py-3 text-[13px] text-sariq">
                {malumot.izoh}
              </p>
            )}
          </section>

          {malumot.tolash_mumkin && holat?.holat !== "tolandi" && (
            <section className="space-y-3 rounded-xl border border-chiziq bg-karta p-5">
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium">To&apos;lov summasi</span>
                <input className={`${KIRITISH_SINF} text-center text-lg`} inputMode="numeric"
                       value={summa} disabled={!!sessiya}
                       onChange={(e) => setSummaTahrir(e.target.value.replace(/[^\d]/g, ""))} />
              </label>

              {!sessiya && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {[malumot.oylik_tolov ?? 0, (malumot.oylik_tolov ?? 0) * 2]
                      .filter((q, i, a) => q > 0 && a.indexOf(q) === i)
                      .map((q) => (
                        <button key={q} type="button" onClick={() => setSummaTahrir(String(q))}
                                className="rounded-lg border border-chiziq px-3 py-1.5 text-[13px] hover:bg-fon">
                          {pul(q)}
                        </button>
                      ))}
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[13px] font-medium">To&apos;lov tizimi</span>
                    {(malumot.provayderlar ?? []).map((p) => (
                      <label key={p}
                             className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                               p === "sinov" ? "border-sariq/40 bg-sariq-och" : "border-chiziq"}`}>
                        <input type="radio" name="provayder" value={p} checked={provayder === p}
                               onChange={() => setProvayderTanlov(p)} />
                        <span className={`text-sm ${p === "sinov" ? "text-sariq" : ""}`}>
                          {PROVAYDER_NOMI[p] ?? p}
                        </span>
                      </label>
                    ))}
                    {!malumot.provayderlar?.length && (
                      <p className="rounded-lg bg-sariq-och px-3 py-2 text-[13px] text-sariq">
                        Bu bozorda onlayn to&apos;lov hali yoqilmagan.
                      </p>
                    )}
                  </div>

                  <Tugma sinf="w-full" disabled={ishlamoqda || summaSon < 1000 || !provayder}
                         onClick={boshla}>
                    {ishlamoqda ? <><Aylanma /> Ochilmoqda…</> : "To'lashga o'tish"}
                  </Tugma>
                </>
              )}

              {sessiya && sessiya.provayder !== "sinov" && !sessiya.havola && (
                <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">
                  To&apos;lov tizimi sozlanmagan — bozor ma&apos;muriyatiga murojaat qiling.
                </p>
              )}

              {sessiya && sessiya.provayder === "sinov" && (
                <div className="space-y-2">
                  <p className="rounded-lg bg-kok-och px-3 py-2 text-[12.5px] text-kok">
                    Sinov rejimi: haqiqiy pul yechilmaydi, lekin to&apos;lov xuddi haqiqiysidek
                    yoziladi va chek chiqadi.
                  </p>
                  <Tugma sinf="w-full" disabled={ishlamoqda} onClick={sinovToLa}>
                    {ishlamoqda ? <><Aylanma /> Bajarilmoqda…</> : `${pul(sessiya.summa)} so'm — to'lash`}
                  </Tugma>
                </div>
              )}
            </section>
          )}

          {holat?.holat === "tolandi" && (
            <section className="rounded-xl border border-asos/25 bg-asos-och p-5 text-center">
              <p className="text-[15px] font-semibold text-asos">To&apos;lov qabul qilindi</p>
              <p className="raqam mt-1 text-[22px] font-semibold text-asos">{pul(holat.summa)} so&apos;m</p>
              {holat.chek_kod && (
                <a href={`/c/${holat.chek_kod}`}
                   className="mt-3 inline-block rounded-lg border border-asos/30 bg-karta px-4 py-2 text-[13px] font-medium text-asos">
                  Chekni ochish
                </a>
              )}
            </section>
          )}

          {amalXato && (
            <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">
              {amalXato}
            </p>
          )}
        </>
      )}

      <p className="mt-auto pb-4 text-center text-[11.5px] leading-relaxed text-xira">
        To&apos;lov bozor ma&apos;muriyati tizimida darhol qayd etiladi.
        Savol bo&apos;lsa — bozor ma&apos;muriyatiga murojaat qiling.
      </p>
    </main>
  );
}
