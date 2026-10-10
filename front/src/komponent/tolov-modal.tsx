"use client";

import { useState } from "react";
import Link from "next/link";
import { useMalumot, yuborish } from "@/lib/api";
import { bugun, pul, USUL_NOMI } from "@/lib/format";
import { KIRITISH_SINF, Maydon, Modal, Tugma, Aylanma } from "./asos";

type Javob = { id: number; takroriy: boolean; kvitansiya: string; chek_kod: string | null };

/** To'lov qabul qilish oynasi. `idem` — takroriy bosishda dublikat bo'lmasligi uchun.
 *  Summa sukut bo'yicha — oylik ijara. */
export function TolovModal({ shartnomaId, sarlavha, oylik, yop, tayyor }: {
  shartnomaId: number; sarlavha: string; oylik: number;
  yop: () => void; tayyor: () => void;
}) {
  const [summa, setSumma] = useState(String(oylik || ""));
  const [usul, setUsul] = useState("naqd");
  const [sana, setSana] = useState(bugun());
  const [izoh, setIzoh] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [idem] = useState(() => `t-${shartnomaId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const summaSon = Number(summa.replace(/\s/g, ""));
  // Naqd pul SMENASIZ qabul qilinmaydi (server rad etadi) — foydalanuvchi
  // xatoga urilishidan oldin buni bilib turishi kerak.
  const smena = useMalumot<{ smena: { id: number } | null }>("/api/smena");
  const smenaYoq = !smena.yuklanmoqda && !smena.malumot?.smena;

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setYuborilmoqda(true);
    try {
      const javob = await yuborish<Javob>("/api/tolovlar", {
        shartnoma_id: shartnomaId, summa: summaSon, usul, sana, izoh: izoh || null, idem,
      });
      if (javob.takroriy) setXato("Bu to'lov allaqachon yozilgan edi — dublikat yaratilmadi.");
      tayyor();
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setYuborilmoqda(false);
    }
  }

  return (
    <Modal sarlavha="To'lov qabul qilish" yop={yop}>
      <form onSubmit={joniat} className="space-y-4">
        <div className="rounded-lg bg-fon px-3 py-2.5 text-[13px]">
          <p className="font-medium text-matn">{sarlavha}</p>
          {oylik ? <p className="mt-0.5 text-xira">Oylik ijara: {pul(oylik)} so&apos;m</p> : null}
        </div>

        {smenaYoq && usul === "naqd" && (
          <p className="rounded-lg border border-sariq/30 bg-sariq-och px-3 py-2 text-[12.5px] text-sariq">
            Kassa smenasi ochilmagan. Naqd pul smenaga tushishi kerak — aks holda
            kun oxirida uni sanab topshiradigan javobgar bo&apos;lmaydi.{" "}
            <Link href="/kassa" className="underline">Kassani ochish →</Link>
          </p>
        )}

        <Maydon yorliq="Summa (so'm)">
          <input className={KIRITISH_SINF} inputMode="numeric" value={summa} autoFocus
                 onChange={(e) => setSumma(e.target.value.replace(/[^\d\s]/g, ""))} />
        </Maydon>

        <div className="flex flex-wrap gap-2">
          {[oylik, oylik * 2, Math.round(oylik / 2)].filter((q, i, a) => q > 0 && a.indexOf(q) === i).map((q) => (
            <button key={q} type="button" onClick={() => setSumma(String(q))}
                    className="rounded-lg border border-chiziq px-2.5 py-1 text-[12.5px] hover:bg-fon">
              {pul(q)}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Maydon yorliq="To'lov usuli">
            <select className={KIRITISH_SINF} value={usul} onChange={(e) => setUsul(e.target.value)}>
              {Object.entries(USUL_NOMI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="Sana">
            <input className={KIRITISH_SINF} type="date" value={sana} max={bugun()}
                   onChange={(e) => setSana(e.target.value)} />
          </Maydon>
        </div>

        <Maydon yorliq="Izoh" izoh="Ixtiyoriy — masalan kvitansiya raqami yoki tushuntirish">
          <input className={KIRITISH_SINF} value={izoh} onChange={(e) => setIzoh(e.target.value)} />
        </Maydon>

        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={yuborilmoqda || !(summaSon > 0)}>
            {yuborilmoqda ? <><Aylanma /> Yozilmoqda…</> : "To'lovni yozish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}
