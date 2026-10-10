/** Pul: 1 234 500 so'm ko'rinishida (bo'shliq — o'qishga qulay). */
export function pul(qiymat: number | null | undefined, sozlar = false): string {
  if (qiymat === null || qiymat === undefined) return "—";
  const s = Math.round(qiymat).toLocaleString("ru-RU").replace(/ /g, " ");
  return sozlar ? `${s} so'm` : s;
}

/** Katta summani qisqartiradi: 12,4 mln */
export function pulQisqa(qiymat: number | null | undefined): string {
  if (!qiymat) return "0";
  const belgi = qiymat < 0 ? "−" : "";
  const q = Math.abs(qiymat);
  if (q >= 1_000_000_000) return `${belgi}${(q / 1_000_000_000).toFixed(1).replace(".", ",")} mlrd`;
  if (q >= 1_000_000) return `${belgi}${(q / 1_000_000).toFixed(1).replace(".", ",")} mln`;
  if (q >= 1_000) return `${belgi}${Math.round(q / 1000)} ming`;
  return `${belgi}${q}`;
}

const OYLAR = ["", "yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul",
  "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/** "2026-08-25" → "25 avgust 2026" */
export function sana(qiymat: string | null | undefined): string {
  if (!qiymat) return "—";
  const [y, o, k] = qiymat.slice(0, 10).split("-").map(Number);
  if (!y || !o || !k) return qiymat;
  return `${k} ${OYLAR[o]} ${y}`;
}

/** "2026-08-25 14:30:00" → "25.08.2026 14:30" */
export function vaqt(qiymat: string | null | undefined): string {
  if (!qiymat) return "—";
  const [s, v = ""] = qiymat.split(" ");
  const [y, o, k] = s.split("-");
  return `${k}.${o}.${y}${v ? " " + v.slice(0, 5) : ""}`;
}

/** Toshkent (UTC+5) sanasi — brauzer qaysi mintaqada bo'lishidan qat'i nazar.
 *  Hozirgi lahzani UTC+5 ga suramiz va UTC qismini o'qiymiz. */
const TOSHKENT_SURISH = 5 * 3600 * 1000;

export function bugun(): string {
  return new Date(Date.now() + TOSHKENT_SURISH).toISOString().slice(0, 10);
}

export function kunlarOldin(kun: number): string {
  return new Date(Date.now() + TOSHKENT_SURISH - kun * 86400000).toISOString().slice(0, 10);
}

export const ROL_NOMI: Record<string, string> = {
  admin: "Administrator",
  boshqaruvchi: "Bozor boshqaruvchisi",
  yiguvchi: "Yig'uvchi",
  nazoratchi: "Nazoratchi",
};

export const HOLAT_NOMI: Record<string, string> = {
  bosh: "Bo'sh", band: "Band", tamir: "Ta'mirda", bloklangan: "Bloklangan",
  faol: "Faol", tugagan: "Tugagan", bekor: "Bekor qilingan",
};

export const TUR_NOMI: Record<string, string> = {
  rasta: "Rasta", dokon: "Do'kon", konteyner: "Konteyner",
  ombor: "Ombor", pavilyon: "Pavilyon",
};

/** ISO hafta kunlari: 1 = dushanba … 7 = yakshanba (server bilan bir xil). */
export const HAFTA_KUNLARI: Record<number, string> = {
  1: "dushanba", 2: "seshanba", 3: "chorshanba", 4: "payshanba", 5: "juma", 6: "shanba", 7: "yakshanba",
};

/** «har yakshanba» / «shanba, yakshanba» — bozor kunlari matni. */
export function bozorKunlari(kunlar: number[]): string {
  if (!kunlar.length) return "";
  const nomlar = kunlar.map((k) => HAFTA_KUNLARI[k]);
  return kunlar.length === 1 ? `har ${nomlar[0]}` : nomlar.join(", ");
}

export const USUL_NOMI: Record<string, string> = {
  naqd: "Naqd", karta: "Plastik karta", otkazma: "Pul o'tkazma",
};
