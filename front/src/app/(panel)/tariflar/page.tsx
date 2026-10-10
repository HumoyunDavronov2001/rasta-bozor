"use client";

import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen } from "@/lib/kontekst";
import { pul, sana } from "@/lib/format";
import type { Tarif } from "@/lib/turlar";
import {
  Aylanma, Bosh, Jadval, KATAK, KATAK_ONG, KIRITISH_SINF, Kartochka, Maydon, Modal, Tugma,
  Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { Tasdiq } from "@/komponent/tasdiq";

const TUR_NOMI: Record<string, string> = {
  ijara: "Ijara", majburiy_xizmat: "Majburiy xizmat haqi", kunlik: "Bir kunlik joy haqi",
};
const OLCHOV_NOMI: Record<string, string> = {
  m2_oy: "so'm / m² · oy", orin_kun: "so'm / o'rin · kun", marta: "so'm / marta",
};
const MAQSADLAR = ["oziq-ovqat", "nooziq-ovqat", "ovqatlanish", "xizmat", "boshqa"];
const OBYEKT_TURLARI = ["rasta", "dokon", "konteyner", "ombor", "pavilyon"];

export default function TariflarSahifasi() {
  const [yangilash, setYangilash] = useState(0);
  const { bozorId } = useMen();
  const tariflar = useMalumot<{ tariflar: Tarif[] }>(
    `/api/tariflar?v=${yangilash}${bozorId ? `&bozor=${bozorId}` : ""}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Tariflar</h1>
        <p className="mt-1 text-sm text-xira">
          Bir kunlik joy haqi shu tarifdan olinadi (o&apos;rin × stavka). Ijara tarifi esa
          shartnoma tuzishda oylik to&apos;lovni <b>taklif</b> qiladi (maydon × stavka) — summani
          odam tasdiqlaydi. Tarif yoki maydon bo&apos;lmasa summa <b>taxmin qilinmaydi</b>.
        </p>
      </div>

      <Kartochka sarlavha="Tariflar"
                 ong={<TarifQoshish qayta={() => setYangilash((v) => v + 1)} />}>
        <p className="mb-3 text-[13px] text-xira">
          Tarif hokimlik qarori bilan tasdiqlanadi va <b>versiyalanadi</b>: yangi stavka
          qo&apos;shilganda eskisi o&apos;chmaydi, amal muddati yopiladi. Shu sababli o&apos;tgan oyda
          shartnoma qaysi stavka bilan tuzilganini keyin ham isbotlash mumkin.
        </p>
        {tariflar.yuklanmoqda ? <Yuklanmoqda /> :
          tariflar.xato ? <Xato matn={tariflar.xato} qayta={tariflar.qayta} /> :
          !tariflar.malumot?.tariflar.length ? <Bosh matn="Tarif belgilanmagan" /> : (
            <Jadval ustunlar={["Tur", "Kesim", { nom: "Narx", ong: true }, "O'lchov",
                               "Amal muddati", "Asos", ""]}>
              {tariflar.malumot.tariflar.map((t) => (
                <TarifQatori key={t.id} tarif={t}
                             qayta={() => setYangilash((v) => v + 1)} />
              ))}
            </Jadval>
          )}
      </Kartochka>

    </div>
  );
}

/* ── Tarif qatori va qo'shish ─────────────────────────────────────────── */
function TarifQatori({ tarif, qayta }: { tarif: Tarif; qayta: () => void }) {
  const [ochirish, setOchirish] = useState(false);
  const kesim = [tarif.maqsad, tarif.obyekt_turi,
                 tarif.qavat != null ? `${tarif.qavat}-qavat` : null]
    .filter(Boolean).join(" · ");
  const amalda = tarif.faol === 1 && (!tarif.tugash || tarif.tugash >= new Date().toISOString().slice(0, 10));

  return (
    <tr className={`border-t border-chiziq ${amalda ? "" : "text-xira"}`}>
      <td className={KATAK}>
        <span className="font-medium">{TUR_NOMI[tarif.tur] ?? tarif.tur}</span>
        {!amalda && <span className="ml-1 text-[12px]">(amalda emas)</span>}
      </td>
      <td className={`${KATAK} text-[13px]`}>{kesim || <span className="text-xira">hammasi uchun</span>}</td>
      <td className={KATAK_ONG}>{pul(tarif.narx)}</td>
      <td className={`${KATAK} text-[12.5px] text-xira`}>{OLCHOV_NOMI[tarif.olchov] ?? tarif.olchov}</td>
      <td className={`${KATAK} text-[13px]`}>
        {sana(tarif.boshlanish)} — {tarif.tugash ? sana(tarif.tugash) : "hozirgacha"}
      </td>
      <td className={`${KATAK} text-[12.5px] text-xira`}>{tarif.asos || "—"}</td>
      <td className={KATAK}>
        {amalda && (
          <button className="text-[13px] text-qizil underline" onClick={() => setOchirish(true)}>
            To&apos;xtatish
          </button>
        )}
        {ochirish && (
          <Tasdiq sarlavha="Tarifni to'xtatish" tugmaMatn="To'xtatish" xatarli
                  tavsif={<>
                    Tarif <b>o&apos;chirilmaydi</b>, faqat faolsiz qilinadi va amal muddati
                    bugun bilan yopiladi. Tuzilgan shartnomalar o&apos;zgarmaydi.
                  </>}
                  yop={() => setOchirish(false)}
                  tasdiqla={async () => {
                    await yuborish(`/api/tariflar/${tarif.id}/ochir`);
                    qayta();
                  }} />
        )}
      </td>
    </tr>
  );
}

function TarifQoshish({ qayta }: { qayta: () => void }) {
  const [ochiq, setOchiq] = useState(false);
  const { bozorId, bozorlar } = useMen();
  const bugun = new Date().toISOString().slice(0, 10);
  const [m, setM] = useState({
    tur: "kunlik", olchov: "orin_kun", narx: "", maqsad: "", obyekt_turi: "",
    qavat: "", asos: "", boshlanish: bugun,
  });
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const bozor = bozorId ?? bozorlar[0]?.id ?? null;
  // O'lchov turga mos bo'lishi shart (server ham tekshiradi)
  const olchovlar = m.tur === "kunlik"
    ? [["orin_kun", "1 o'rin uchun kuniga"], ["marta", "Bir marta"]]
    : [["m2_oy", "1 m² uchun oyiga"]];

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setIshlamoqda(true);
    setXato(null);
    try {
      await yuborish("/api/tariflar", {
        bozor_id: bozor, tur: m.tur, olchov: m.olchov,
        narx: Number(m.narx.replace(/\s/g, "")) || 0,
        maqsad: m.maqsad || null, obyekt_turi: m.obyekt_turi || null,
        qavat: m.qavat ? Number(m.qavat) : null,
        asos: m.asos || null, boshlanish: m.boshlanish,
      });
      setOchiq(false);
      setM({ ...m, narx: "", asos: "" });
      qayta();
    } catch (e) {
      setXato((e as Error).message);
    }
    setIshlamoqda(false);
  }

  return (
    <>
      <Tugma kichik onClick={() => setOchiq(true)}>Tarif qo&apos;shish</Tugma>
      {ochiq && (
        <Modal sarlavha="Yangi tarif" yop={() => setOchiq(false)}>
          <form onSubmit={joniat} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Maydon yorliq="Yig'im turi">
                <select className={KIRITISH_SINF} value={m.tur}
                        onChange={(e) => setM({
                          ...m, tur: e.target.value,
                          olchov: e.target.value === "kunlik" ? "orin_kun" : "m2_oy",
                        })}>
                  <option value="kunlik">Bir kunlik joy haqi</option>
                  <option value="ijara">Ijara (oylik to&apos;lov taklifi uchun)</option>
                  <option value="majburiy_xizmat">Majburiy xizmat haqi</option>
                </select>
              </Maydon>
              <Maydon yorliq="O'lchov">
                <select className={KIRITISH_SINF} value={m.olchov}
                        onChange={(e) => setM({ ...m, olchov: e.target.value })}>
                  {olchovlar.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                </select>
              </Maydon>
              <Maydon yorliq="Narx (so'm)">
                <input className={KIRITISH_SINF} inputMode="numeric" value={m.narx} autoFocus
                       onChange={(e) => setM({ ...m, narx: e.target.value.replace(/[^\d]/g, "") })} />
              </Maydon>
              <Maydon yorliq="Amal boshlanishi">
                <input className={KIRITISH_SINF} type="date" value={m.boshlanish}
                       onChange={(e) => setM({ ...m, boshlanish: e.target.value })} />
              </Maydon>
              <Maydon yorliq="Faoliyat maqsadi" izoh="bo'sh — hammasi uchun">
                <select className={KIRITISH_SINF} value={m.maqsad}
                        onChange={(e) => setM({ ...m, maqsad: e.target.value })}>
                  <option value="">— hammasi —</option>
                  {MAQSADLAR.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Maydon>
              <Maydon yorliq="Obyekt turi" izoh="bo'sh — hammasi uchun">
                <select className={KIRITISH_SINF} value={m.obyekt_turi}
                        onChange={(e) => setM({ ...m, obyekt_turi: e.target.value })}>
                  <option value="">— hammasi —</option>
                  {OBYEKT_TURLARI.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Maydon>
              <Maydon yorliq="Qavat" izoh="bo'sh — hammasi uchun">
                <input className={KIRITISH_SINF} inputMode="numeric" value={m.qavat}
                       onChange={(e) => setM({ ...m, qavat: e.target.value.replace(/[^\d]/g, "") })} />
              </Maydon>
              <Maydon yorliq="Asos" izoh="hokimlik qarori raqami va sanasi">
                <input className={KIRITISH_SINF} value={m.asos} maxLength={200}
                       placeholder="41-son qaror, 12.01.2026"
                       onChange={(e) => setM({ ...m, asos: e.target.value })} />
              </Maydon>
            </div>
            <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
              Ayni kesimdagi amaldagi tarif <b>avtomatik yopiladi</b> (amal muddati yangi
              tarifdan bir kun oldin tugaydi). Eski qator o&apos;chirilmaydi — tarix qoladi.
            </p>
            {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Tugma type="button" uslub="ikkilamchi" onClick={() => setOchiq(false)}>Bekor qilish</Tugma>
              <Tugma type="submit" disabled={ishlamoqda || !m.narx || !bozor}>
                {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Qo'shish"}
              </Tugma>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
