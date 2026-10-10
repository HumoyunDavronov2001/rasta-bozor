"use client";

import { useState } from "react";
import { Aylanma, KIRITISH_SINF, Maydon, Modal, Tugma } from "./asos";

type Xususiyat = {
  sarlavha: string;
  tavsif?: React.ReactNode;
  tugmaMatn?: string;
  xatarli?: boolean;
  /** Sabab maydoni: majburiy bo'lsa minUzunlik dan qisqa matn qabul qilinmaydi. */
  sabab?: { yorliq: string; izoh?: string; majburiy?: boolean; minUzunlik?: number };
  /** Parol maydoni (masalan foydalanuvchi parolini almashtirish). */
  parol?: { yorliq: string; izoh?: string; minUzunlik?: number };
  yop: () => void;
  tasdiqla: (qiymat: string) => Promise<void>;
};

/** Tasdiqlash oynasi — window.confirm/prompt o'rniga.
 *  Xatoni oynaning o'zida ko'rsatadi va yuborish paytida tugmani bloklaydi. */
export function Tasdiq({ sarlavha, tavsif, tugmaMatn = "Tasdiqlash", xatarli,
                         sabab, parol, yop, tasdiqla }: Xususiyat) {
  const [qiymat, setQiymat] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  const eng = sabab?.minUzunlik ?? parol?.minUzunlik ?? 0;
  const yetarli = !((sabab?.majburiy || parol) && qiymat.trim().length < Math.max(eng, 1));

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setIshlamoqda(true);
    try {
      await tasdiqla(qiymat.trim());
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setIshlamoqda(false);
    }
  }

  return (
    <Modal sarlavha={sarlavha} yop={yop}>
      <form onSubmit={joniat} className="space-y-4">
        {tavsif && <div className="text-sm text-xira">{tavsif}</div>}

        {sabab && (
          <Maydon yorliq={sabab.yorliq} izoh={sabab.izoh}>
            <input className={KIRITISH_SINF} type="text" value={qiymat} autoFocus
                   maxLength={500} onChange={(e) => setQiymat(e.target.value)} />
          </Maydon>
        )}
        {parol && (
          <Maydon yorliq={parol.yorliq} izoh={parol.izoh}>
            <input className={KIRITISH_SINF} type="password" value={qiymat} autoFocus
                   autoComplete="new-password" onChange={(e) => setQiymat(e.target.value)} />
          </Maydon>
        )}

        {xato && (
          <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>
        )}

        <div className="flex justify-end gap-2">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" uslub={xatarli ? "xatarli" : "asosiy"} disabled={ishlamoqda || !yetarli}>
            {ishlamoqda ? <><Aylanma /> Bajarilmoqda…</> : tugmaMatn}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

/** Muvaffaqiyat xabari — window.alert o'rniga. */
export function Xabar({ sarlavha, matn, yop }: { sarlavha: string; matn: React.ReactNode; yop: () => void }) {
  return (
    <Modal sarlavha={sarlavha} yop={yop}>
      <div className="space-y-4">
        <div className="text-sm text-matn">{matn}</div>
        <div className="flex justify-end"><Tugma onClick={yop}>Yopish</Tugma></div>
      </div>
    </Modal>
  );
}
