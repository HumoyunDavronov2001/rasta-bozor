"use client";

import Link from "next/link";
import { useState } from "react";
import { useMalumot, yuborish } from "@/lib/api";
import { useMen, yozaOladi } from "@/lib/kontekst";
import { vaqt } from "@/lib/format";
import {
  Aylanma, Belgi, Bosh, Jadval, KATAK, KIRITISH_SINF, Kartochka, Maydon, Modal,
  Tugma, Xato, Yuklanmoqda,
} from "@/komponent/asos";
import { Tasdiq, Xabar } from "@/komponent/tasdiq";

type Agent = {
  id: number; nomi: string; bozor_nomi: string; kalit_bosh: string | null;
  versiya: string | null; oxirgi_korindi: string | null; oxirgi_ip: string | null;
  sozlama_versiya: number; faol: number; kamera_soni: number;
};
type Kamera = {
  id: number; nomi: string; manba_kalit: string; joylashuv: string | null;
  agent_nomi: string | null; blok_nomi: string | null; holat: string;
  oxirgi_kadr: string | null; zona_soni: number; oraliq_sek: number;
  ish_boshi: string; ish_oxiri: string; faol: number;
};

const HOLAT_NOMI: Record<string, string> = {
  // Jonli video yo'q: rasm tashqi dasturdan API orqali keladi; hali kelmagan bo'lsa — «signal yo'q»
  nomalum: "signal yo'q", ishlayapti: "ishlayapti", uzilgan: "uzilgan", xato: "xato",
};

export default function KameralarSahifasi() {
  const { men, bozorId } = useMen();
  const sorov = bozorId ? `?bozor=${bozorId}` : "";
  // Yig'uvchiga agentlar kerak emas (va API ruxsat bermaydi) — so'rov yuborilmaydi
  const agentKoradi = men.rol !== "yiguvchi";
  const agentlar = useMalumot<{ agentlar: Agent[] }>(agentKoradi ? `/api/agentlar${sorov}` : null);
  const kameralar = useMalumot<{ kameralar: Kamera[] }>(`/api/kameralar${sorov}`);
  const [yangiAgent, setYangiAgent] = useState(false);
  const [yangiKamera, setYangiKamera] = useState(false);
  const [kalit, setKalit] = useState<string | null>(null);
  const [kalitUchun, setKalitUchun] = useState<Agent | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Kameralar</h1>
        <p className="mt-1 text-sm text-xira">
          Jonli video yo&apos;q: kamera rasmi agent yoki tashqi dastur orqali API bilan davriy
          keladi (masalan 5 daqiqada bir). Kamera paroli serverda saqlanmaydi.
        </p>
      </div>

      {agentKoradi && <Kartochka sarlavha="Agentlar"
                 ong={yozaOladi(men) ? <Tugma kichik onClick={() => setYangiAgent(true)}>+ Agent</Tugma> : null}>
        {agentlar.yuklanmoqda ? <Yuklanmoqda /> :
          agentlar.xato ? <Xato matn={agentlar.xato} qayta={agentlar.qayta} /> :
          !agentlar.malumot?.agentlar.length ? (
            <Bosh matn="Agent qo'shilmagan. Avval agent yarating, kalitni bozordagi kompyuterga o'rnating." />
          ) : (
            <Jadval eng={920} ustunlar={["Agent", "Kalit", "Versiya", "Oxirgi aloqa", "Kamera", "Holat", ""]}>
              {agentlar.malumot.agentlar.map((a) => (
                <tr key={a.id} className={a.faol ? "" : "opacity-60"}>
                  <td className={KATAK}>
                    <span className="font-medium">{a.nomi}</span>
                    <span className="block text-[12px] text-xira">{a.bozor_nomi}</span>
                  </td>
                  <td className={`${KATAK} font-mono text-[12px] text-xira`}>{a.kalit_bosh ?? "—"}</td>
                  <td className={`${KATAK} text-xira`}>{a.versiya ?? "—"}</td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>
                    {a.oxirgi_korindi ? vaqt(a.oxirgi_korindi) : "hali ulanmagan"}
                  </td>
                  <td className={`${KATAK} text-center`}>{a.kamera_soni}</td>
                  <td className={KATAK}>
                    {a.oxirgi_korindi ? <Belgi tur="faol">ulangan</Belgi> : <Belgi tur="xolis">kutilmoqda</Belgi>}
                  </td>
                  <td className={KATAK}>
                    {yozaOladi(men) && (
                      <button onClick={() => setKalitUchun(a)} className="text-[13px] text-asos hover:underline">
                        {a.kalit_bosh ? "Kalitni almashtirish" : "Kalit berish"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
      </Kartochka>}

      <Kartochka sarlavha="Kameralar"
                 ong={yozaOladi(men) ? <Tugma kichik onClick={() => setYangiKamera(true)}>+ Kamera</Tugma> : null}>
        {kameralar.yuklanmoqda ? <Yuklanmoqda /> :
          kameralar.xato ? <Xato matn={kameralar.xato} qayta={kameralar.qayta} /> :
          !kameralar.malumot?.kameralar.length ? <Bosh matn="Kamera qo'shilmagan" /> : (
            <Jadval eng={880} ustunlar={["Kamera", "Manba kaliti", "Agent", "Zonalar",
              "Ish vaqti", "Oxirgi kadr", "Holat", ""]}>
              {kameralar.malumot.kameralar.map((k) => (
                <tr key={k.id} className="hover:bg-fon">
                  <td className={KATAK}>
                    <Link href={`/kameralar/${k.id}`} className="font-medium hover:text-asos">{k.nomi}</Link>
                    {k.joylashuv && <span className="block text-[12px] text-xira">{k.joylashuv}</span>}
                  </td>
                  <td className={`${KATAK} font-mono text-[12.5px] text-xira`}>{k.manba_kalit}</td>
                  <td className={`${KATAK} text-xira`}>{k.agent_nomi ?? "biriktirilmagan"}</td>
                  <td className={`${KATAK} text-center`}>
                    {k.zona_soni || <span className="text-sariq">yo&apos;q</span>}
                  </td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>{k.ish_boshi}–{k.ish_oxiri}</td>
                  <td className={`${KATAK} text-[12.5px] text-xira`}>
                    {k.oxirgi_kadr ? vaqt(k.oxirgi_kadr) : "—"}
                  </td>
                  <td className={KATAK}>
                    <Belgi tur={k.holat === "ishlayapti" ? "faol" : k.holat === "nomalum" ? "xolis" : "bekor"}>
                      {HOLAT_NOMI[k.holat] ?? k.holat}
                    </Belgi>
                  </td>
                  <td className={KATAK}>
                    <Link href={`/kameralar/${k.id}`} className="text-[13px] text-asos hover:underline">
                      Zonalar
                    </Link>
                  </td>
                </tr>
              ))}
            </Jadval>
          )}
        <p className="mt-3 rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Kameralar jonli video bermaydi — rasm tashqi dasturdan API orqali keladi:{" "}
          <code className="text-matn">POST /api/agent/rasm?kamera=&lt;kalit&gt;</code>, sarlavha{" "}
          <code className="text-matn">X-Agent-Kalit</code>, tana — JPEG (4 MB gacha). Rasm kelguncha
          kamera «signal yo&apos;q» bo&apos;lib turadi. Kalitni «Agentlar» bo&apos;limida berasiz.
        </p>
      </Kartochka>

      {yangiAgent && (
        <YangiAgent yop={() => setYangiAgent(false)}
                    tayyor={(k) => { setKalit(k); agentlar.qayta(); }} />
      )}
      {yangiKamera && (
        <YangiKamera agentlar={agentlar.malumot?.agentlar ?? []}
                     yop={() => setYangiKamera(false)} tayyor={kameralar.qayta} />
      )}
      {kalitUchun && (
        <Tasdiq sarlavha={kalitUchun.kalit_bosh ? "Kalitni almashtirish" : "Kalit berish"}
                xatarli={!!kalitUchun.kalit_bosh}
                tugmaMatn={kalitUchun.kalit_bosh ? "Almashtirish" : "Kalit berish"}
                tavsif={<>
                  <b>{kalitUchun.nomi}</b> uchun yangi kalit yaratiladi va BIR MARTA ko&apos;rsatiladi.
                  {kalitUchun.kalit_bosh && " Eski kalit shu ondan ishlamay qoladi."}
                </>}
                yop={() => setKalitUchun(null)}
                tasdiqla={async () => {
                  const j = await yuborish<{ kalit: string }>(`/api/agentlar/${kalitUchun.id}`,
                                                              { kalit_almashtir: true }, "PATCH");
                  setKalit(j.kalit);
                  agentlar.qayta();
                }} />
      )}
      {kalit && (
        <Xabar sarlavha="Agent kaliti" yop={() => setKalit(null)}
               matn={<>
                 <p>Bu kalit <b>faqat shu yerda</b> ko&apos;rsatiladi — keyin uni ko&apos;rib
                   bo&apos;lmaydi. Bozordagi kompyuterdagi <code>agent.ini</code> fayliga
                   ko&apos;chiring:</p>
                 <pre className="mt-2 overflow-x-auto rounded-lg bg-fon p-3 text-[12px]">{`[server]
url   = <sayt manzili>
kalit = ${kalit}`}</pre>
               </>} />
      )}
    </div>
  );
}

function YangiAgent({ yop, tayyor }: { yop: () => void; tayyor: (kalit: string) => void }) {
  const { bozorId, bozorlar } = useMen();
  const [nomi, setNomi] = useState("");
  const [bozor, setBozor] = useState(String(bozorId ?? bozorlar[0]?.id ?? ""));
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setIshlamoqda(true);
    try {
      const j = await yuborish<{ kalit: string }>("/api/agentlar",
        { nomi, bozor_id: Number(bozor) });
      tayyor(j.kalit);
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setIshlamoqda(false);
    }
  }

  return (
    <Modal sarlavha="Yangi agent" yop={yop}>
      <form onSubmit={joniat} className="space-y-3.5">
        <p className="rounded-lg bg-fon px-3 py-2 text-[12.5px] text-xira">
          Agent — bozordagi kompyuterda ishlaydigan dastur. Har bozorga bitta agent
          yetarli: u barcha kameralarni boshqaradi.
        </p>
        <Maydon yorliq="Agent nomi" izoh="Masalan: Markaziy bozor — server xonasi">
          <input className={KIRITISH_SINF} value={nomi} required autoFocus
                 onChange={(e) => setNomi(e.target.value)} />
        </Maydon>
        {bozorlar.length > 1 && (
          <Maydon yorliq="Bozor">
            <select className={KIRITISH_SINF} value={bozor} onChange={(e) => setBozor(e.target.value)}>
              {bozorlar.map((b) => <option key={b.id} value={b.id}>{b.nomi}</option>)}
            </select>
          </Maydon>
        )}
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda || nomi.trim().length < 3}>
            {ishlamoqda ? <><Aylanma /> Yaratilmoqda…</> : "Yaratish va kalit olish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}

function YangiKamera({ agentlar, yop, tayyor }: {
  agentlar: Agent[]; yop: () => void; tayyor: () => void;
}) {
  const { bozorId, bozorlar } = useMen();
  const [m, setM] = useState({
    nomi: "", manba_kalit: "", joylashuv: "", agent_id: String(agentlar[0]?.id ?? ""),
    bozor_id: String(bozorId ?? bozorlar[0]?.id ?? ""), ish_boshi: "06:00", ish_oxiri: "20:00",
  });
  const [xato, setXato] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function joniat(h: React.FormEvent) {
    h.preventDefault();
    setXato(null);
    setIshlamoqda(true);
    try {
      await yuborish("/api/kameralar", {
        ...m, bozor_id: Number(m.bozor_id), agent_id: m.agent_id ? Number(m.agent_id) : null,
      });
      tayyor();
      yop();
    } catch (e) {
      setXato((e as Error).message);
      setIshlamoqda(false);
    }
  }

  return (
    <Modal sarlavha="Yangi kamera" yop={yop}>
      <form onSubmit={joniat} className="space-y-3.5">
        <Maydon yorliq="Kamera nomi">
          <input className={KIRITISH_SINF} value={m.nomi} required autoFocus
                 onChange={(e) => setM({ ...m, nomi: e.target.value })} />
        </Maydon>
        <Maydon yorliq="Manba kaliti"
                izoh="agent.ini dagi [kamera.<kalit>] bo'limi nomi. Masalan: k1">
          <input className={KIRITISH_SINF} value={m.manba_kalit} required
                 onChange={(e) => setM({ ...m, manba_kalit: e.target.value.replace(/[^a-z0-9_-]/gi, "") })} />
        </Maydon>
        <Maydon yorliq="Joylashuv" izoh="Bozordagi o'rni — keyin topish oson bo'lsin">
          <input className={KIRITISH_SINF} value={m.joylashuv}
                 onChange={(e) => setM({ ...m, joylashuv: e.target.value })} />
        </Maydon>
        <div className="grid gap-3 sm:grid-cols-3">
          <Maydon yorliq="Agent">
            <select className={KIRITISH_SINF} value={m.agent_id}
                    onChange={(e) => setM({ ...m, agent_id: e.target.value })}>
              <option value="">— tanlanmagan —</option>
              {agentlar.map((a) => <option key={a.id} value={a.id}>{a.nomi}</option>)}
            </select>
          </Maydon>
          <Maydon yorliq="Ish boshi">
            <input className={KIRITISH_SINF} type="time" value={m.ish_boshi}
                   onChange={(e) => setM({ ...m, ish_boshi: e.target.value })} />
          </Maydon>
          <Maydon yorliq="Ish oxiri">
            <input className={KIRITISH_SINF} type="time" value={m.ish_oxiri}
                   onChange={(e) => setM({ ...m, ish_oxiri: e.target.value })} />
          </Maydon>
        </div>
        <p className="rounded-lg bg-kok-och px-3 py-2 text-[12.5px] text-kok">
          RTSP manzili va kamera paroli bu yerda kiritilmaydi — ular faqat bozordagi
          kompyuterdagi <code>agent.ini</code> faylida turadi.
        </p>
        {xato && <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>}
        <div className="flex justify-end gap-2">
          <Tugma type="button" uslub="ikkilamchi" onClick={yop}>Bekor qilish</Tugma>
          <Tugma type="submit" disabled={ishlamoqda}>
            {ishlamoqda ? <><Aylanma /> Saqlanmoqda…</> : "Qo'shish"}
          </Tugma>
        </div>
      </form>
    </Modal>
  );
}
