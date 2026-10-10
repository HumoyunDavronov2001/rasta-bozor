"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMalumot } from "@/lib/api";
import { pul, vaqt } from "@/lib/format";
import { Aylanma } from "@/komponent/asos";

type Chek = {
  raqam: string; tur: string; tolov_turi: string; fiskal_emas: boolean; ogohlantirish: string | null;
  bozor_nomi: string; sotuvchi: string | null; bozor_stir: string | null; bozor_manzil: string | null;
  rasta_raqam: string; blok_nomi: string | null;
  ijarachi_fio: string; ijarachi_stir: string | null; shartnoma_raqam: string | null;
  tolov_nomi: string; davr: string | null; summa_som: number;
  qqs_stavka: number; qqs_summa_som: number; tolov_shakli: string;
  kassir_fio: string | null; yaratilgan: string; fiskal_belgi: string | null;
};
type Qator = { id: number; nomi: string; mxik: string | null; miqdori: number; summa_som: number };

const SHAKL: Record<string, string> = {
  naqd: "Naqd pul", bank_karta: "Bank kartasi", qr_kod: "QR-kod orqali", otkazma: "Pul o'tkazma",
};

/** Chop etiladigan chek. Havolasi bo'lgan har kim ko'ra oladi (kirish shart emas). */
export default function ChekSahifasi() {
  const { kod } = useParams<{ kod: string }>();
  const [qrOchiq, setQrOchiq] = useState(false);
  const { malumot, xato, yuklanmoqda } = useMalumot<{ chek: Chek; qatorlar: Qator[] }>(
    `/api/chek/${kod}`);

  if (yuklanmoqda) {
    return <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-xira">
      <Aylanma /> Yuklanmoqda…</div>;
  }
  if (xato || !malumot) {
    return <div className="mx-auto max-w-md p-8 text-center text-sm text-qizil">{xato ?? "Chek topilmadi"}</div>;
  }

  const { chek, qatorlar } = malumot;
  const qaytarish = chek.tolov_turi === "qaytarish";
  // Shartnomasiz to'lov — bir kunlik savdogar. Unga «ijarachi» emas,
  // «savdogar» deb murojaat qilinadi va o'rin raqami bo'lmasligi mumkin.
  const kunlik = !chek.shartnoma_raqam;

  return (
    <main className="mx-auto max-w-[400px] p-4 print:max-w-none print:p-0">
      <div className="rounded-xl border border-chiziq bg-karta p-5 font-mono text-[12.5px] leading-relaxed print:rounded-none print:border-0">
        <div className="text-center">
          {/* Sotuvchi — yuridik shaxs (VM 253-son 42-band); bozor nomi alohida qatorda */}
          <p className="text-[14px] font-semibold">{chek.sotuvchi ?? chek.bozor_nomi}</p>
          {chek.bozor_stir && <p>STIR: {chek.bozor_stir}</p>}
          {chek.sotuvchi && <p className="text-[11.5px]">{chek.bozor_nomi}</p>}
          {chek.bozor_manzil && <p className="text-[11.5px]">{chek.bozor_manzil}</p>}
        </div>

        <div className="my-3 border-y border-dashed border-chiziq py-2 text-center">
          <p className="font-semibold">
            {qaytarish ? "QAYTARISH CHEKI" : kunlik ? "JOY HAQI CHEKI" : "TO'LOV CHEKI"}
          </p>
          <p>{chek.raqam}</p>
          <p>{vaqt(chek.yaratilgan)}</p>
        </div>

        <table className="w-full">
          <tbody>
            <Qatorcha nom="To'lov nomi" qiymat={chek.tolov_nomi} />
            <Qatorcha nom="O'rin raqami"
                      qiymat={chek.rasta_raqam === "—" ? "ko'rsatilmagan" : chek.rasta_raqam} />
            {chek.blok_nomi && <Qatorcha nom="Blok" qiymat={chek.blok_nomi} />}
            <Qatorcha nom={kunlik ? "Savdogar" : "Ijarachi"} qiymat={chek.ijarachi_fio} />
            {chek.ijarachi_stir && <Qatorcha nom="Ijarachi STIR" qiymat={chek.ijarachi_stir} />}
            {chek.shartnoma_raqam && <Qatorcha nom="Shartnoma" qiymat={chek.shartnoma_raqam} />}
            {chek.davr && <Qatorcha nom={kunlik ? "Savdo sanasi" : "Davr"} qiymat={chek.davr} />}
            <Qatorcha nom="To'lov shakli" qiymat={SHAKL[chek.tolov_shakli] ?? chek.tolov_shakli} />
            {chek.kassir_fio && <Qatorcha nom="Qabul qildi" qiymat={chek.kassir_fio} />}
          </tbody>
        </table>

        <div className="my-3 border-t border-dashed border-chiziq pt-2">
          {qatorlar.map((q) => (
            <div key={q.id} className="mb-2">
              <p>{q.nomi}</p>
              {q.mxik && <p className="text-[11px] text-xira">MXIK: {q.mxik}</p>}
              <p className="text-right">{pul(q.summa_som)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-chiziq pt-2">
          {chek.qqs_stavka > 0 && (
            <p className="flex justify-between"><span>QQS ({chek.qqs_stavka}%)</span>
              <span>{pul(chek.qqs_summa_som)}</span></p>
          )}
          <p className="flex justify-between text-[15px] font-semibold">
            <span>{qaytarish ? "QAYTARILDI" : "JAMI"}</span>
            <span>{pul(chek.summa_som)} so&apos;m</span>
          </p>
        </div>

        {chek.fiskal_emas ? (
          <p className="mt-4 rounded border border-sariq/40 bg-sariq-och px-2 py-2 text-center text-[11px] leading-snug text-sariq">
            {chek.ogohlantirish}
          </p>
        ) : (
          <p className="mt-4 text-center text-[11px]">Fiskal belgi: {chek.fiskal_belgi}</p>
        )}
      </div>

      {/* Chekni boshqa telefonga o'tkazish: QR. Chekchining telefonida chek
          ochilib turgan bo'lsa, savdogar shu QR ni skanerlab o'ziga oladi. */}
      <div className="mt-4 flex flex-col items-center gap-2 print:hidden">
        <button onClick={() => setQrOchiq((v) => !v)}
                className="text-[13px] text-asos underline">
          {qrOchiq ? "QR ni yashirish" : "QR kod (savdogar skanerlaydi)"}
        </button>
        {qrOchiq && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/chek/${kod}/qr`} alt="Chek QR kodi"
                 className="h-48 w-48 rounded-lg border border-chiziq bg-white p-2" />
            <p className="max-w-[280px] text-center text-[11.5px] text-xira">
              Skanerlanganda ayni shu chek ochiladi — havolasi o&apos;zgarmaydi.
            </p>
          </>
        )}
      </div>

      <button onClick={() => window.print()}
              className="mt-3 w-full rounded-lg border border-chiziq bg-karta px-4 py-3 text-sm font-medium hover:bg-fon print:hidden">
        Chop etish
      </button>
      <p className="mt-2 text-center text-[11.5px] text-xira print:hidden">
        Chop etishda chek 58 mm lentaga moslashadi (termal printer).
      </p>

      {/* Termal printer uchun: 58 mm lenta, chegarasiz, kichik shrift.
          Telefon brauzeridan chop etish oynasi orqali ishlaydi. */}
      <style jsx global>{`
        @media print {
          @page { size: 58mm auto; margin: 2mm; }
          html, body { background: #fff; }
          body { width: 54mm; font-size: 9.5pt; }
        }
      `}</style>
    </main>
  );
}

function Qatorcha({ nom, qiymat }: { nom: string; qiymat: string }) {
  return (
    <tr>
      <td className="pr-2 align-top text-xira">{nom}</td>
      <td className="text-right align-top">{qiymat}</td>
    </tr>
  );
}
