export type Rol = "admin" | "boshqaruvchi" | "yiguvchi" | "nazoratchi";

export type Men = {
  id: number; fio: string; login: string; rol: Rol; telefon: string | null;
  bozor: { id: number; nomi: string } | null;
  rejim: string;
};

/** /api/men javobi: kirmagan bo'lsa men=null; sessiya_tugadi=true bo'lsa
 *  brauzerda eskirgan cookie bor edi (12 soat o'tgan yoki parol almashgan). */
export type MenJavobi = { men: Men | null; sessiya_tugadi?: boolean; rejim?: string };

export type Bozor = {
  id: number; nomi: string; viloyat: string | null; tuman: string | null;
  manzil: string | null; lat: number | null; lon: number | null;
  plan_eni: number; plan_boyi: number; izoh: string | null; faol: number;
  rasta_soni?: number; band?: number; bosh?: number; oylik_potentsial?: number;
  masshtab: number;              // 1 metr necha piksel (plandagi o'lcham manbai)
  plan_rasm: string | null;      // ostiga qo'yilgan haqiqiy chizma
  plan_rasm_shaffof: number;
  /** Bozor egasi — yuridik shaxs (chek va hujjatdagi sotuvchi). */
  tashkilot: string | null; tashkilot_manzil: string | null;
  stir: string | null; hisob_raqam: string | null;
  /** Ish tartibi. Patta rejasi FAQAT oy_ish_kuni bilan — sukut yo'q (30 kun olinmaydi). */
  hafta_ish_kuni: number | null; oy_ish_kuni: number | null;
  /** Bozor kunlari «7» yoki «6,7» (1 = dushanba … 7 = yakshanba). */
  bozor_kunlari: string | null;
};

/** Patta (bir kunlik joy haqi) bozorining oylik rejasi — reja = rasta × narx × oyiga bozor kuni. */
export type PattaReja = {
  bozor_id: number; bozor_nomi: string;
  hafta_ish_kuni: number | null; oy_ish_kuni: number;
  bozor_kunlari: number[]; otgan_bozor_kuni: number | null;
  rasta: number; narx: number | null; reja: number | null; tarif_izoh: string | null;
  yigildi: number; otgan_kun: number; foiz: number | null;
  oxirgi_kun: { sana: string; orin: number; soni: number } | null;
  /** Bozor kuni (kamera + to'lov) jamlanmasi. */
  kun: { sana: string; soni: KunHolati["soni"]; yoqotilgan: number | null; bozor_kunimi: boolean | null; qizil: number };
};

/** Rastaning bozor kunidagi holati — plan ranglari. */
export type KunHolat = "tolangan" | "tolanmagan" | "bosh" | "nomalum" | "tamir" | "bloklangan";
export type KunHolati = {
  sana: string; kunlar: number[]; bozor_kunimi: boolean | null;
  holatlar: Record<string, KunHolat>;
  soni: Record<KunHolat, number> & { jami: number };
  qizil: { rasta_id: number; raqam: string; band_kadr: number }[];
  narx: number | null; yoqotilgan: number | null; eng_kam_kadr: number;
};

export type Blok = { id: number; bozor_id: number; nomi: string; tur: string | null; tartib: number };

export type Rasta = {
  id: number; bozor_id: number; blok_id: number | null; raqam: string; tur: string;
  maydon: number | null; oylik_narx: number; holat: "bosh" | "band" | "tamir" | "bloklangan";
  x: number; y: number; eni: number; boyi: number; izoh: string | null;
  huquqiy_rejim: HuquqiyRejim; kadastr_maydon: number | null; kadastr_raqam: string | null;
  maqsad: string | null; qavat: number | null; burchak: number;
  bozor_nomi?: string; blok_nomi?: string | null;
  shartnoma_id?: number | null; shartnoma_raqam?: string | null; oylik_tolov?: number | null;
  ijarachi_id?: number | null; ijarachi_fio?: string | null; ijarachi_telefon?: string | null;
};

export type Ijarachi = {
  id: number; fio: string; tur: string; telefon: string | null; stir: string | null;
  manzil: string | null; faoliyat: string | null; izoh: string | null;
  qora_royxat: number; yaratilgan: string; faol_shartnoma?: number;
};

export type Shartnoma = {
  id: number; raqam: string; boshlanish: string; tugash: string | null;
  oylik_tolov: number; holat: string;
  rasta_id: number; rasta_raqam: string; rasta_tur: string;
  bozor_id: number; bozor_nomi: string; blok_nomi: string | null;
  ijarachi_id: number; ijarachi_fio: string; ijarachi_telefon: string | null;
  /** Shartnoma bo'yicha jami to'langan (bekor qilinganlar kirmaydi). */
  tolangan: number;
};

export type Tolov = {
  /** Kunlik joy haqida shartnoma yo'q — null. */
  id: number; shartnoma_id: number | null; sana: string; summa: number; usul: string;
  kvitansiya: string | null; izoh: string | null; qabul_id: number | null;
  manba: string; bekor: number; bekor_izoh: string | null;
  manba_turi?: "shartnoma" | "kunlik" | "xizmat" | "boshqa";
  shartnoma_raqam?: string | null; rasta_raqam?: string | null; bozor_nomi?: string;
  /** Shartnomada — ijarachi, kunlik yig'imda — savdogar (bo'lmasa null). */
  ijarachi_fio?: string | null; qabul_fio?: string | null;
};

export type Hisob = { id: number; shartnoma_id: number; yil: number; oy: number; summa: number };

export type Analitika = {
  oraliq: { dan: string; gacha: string };
  joriy_oy: { yil: number; oy: number; nom: string };
  rasta: { jami: number; band: number; bosh: number; tamir: number; bloklangan: number; bandlik_foiz: number };
  moliya: {
    /** joriy_oy_tushum — ijara (shartnoma) to'lovlari; kunlik joy haqi alohida. */
    joriy_oy_tushum: number; joriy_oy_kunlik: number;
    faol_shartnoma: number;
    /** Oraliqdagi BARCHA tushum (ijara + kunlik joy haqi). */
    oraliq_tushum: number; oraliq_kunlik?: number;
  };
  kunlik: { sana: string; summa: number; soni: number; kunlik_summa?: number }[];
  /** Oylik tushum: ijara to'lovi va kunlik joy haqi alohida. */
  oylik: { yil: number; oy: number; nom: string; ijara: number; kunlik: number; jami: number }[];
  usullar: { usul: string; summa: number; soni: number }[];
  bozorlar: { id: number; nomi: string; rasta: number; band: number; bosh: number }[];
  /** Haftalik (patta) bozorlar: oylik reja va bajarilishi. */
  patta?: PattaReja[];
  /** Oxirgi to'lovlar (ijara va kunlik joy haqi). */
  oxirgi_tolovlar: {
    id: number; sana: string; summa: number; usul: string; manba_turi: string;
    rasta_id: number | null; rasta_raqam: string | null; ijarachi_fio: string | null;
  }[];
  /** Diqqat talab qiladigan, «osilib qolgan» ishlar. */
  ishlar?: {
    navbatdagi_ariza: number;
    korilmagan_belgi: number;
    maydonsiz_rasta: number;
    /** Tugash sanasi o'tgan, lekin «faol» shartnomalar — ijara yozilmayapti. */
    muddati_otgan_shartnoma?: number;
  };
};

export type Foydalanuvchi = {
  id: number; fio: string; login: string; telefon: string | null; rol: Rol;
  bozor_id: number | null; bozor_nomi: string | null; faol: number; yaratilgan: string;
};

export type Jurnal = {
  id: number; foydalanuvchi_id: number | null; amal: string; obyekt: string | null;
  obyekt_id: number | null; tafsilot: string | null; ip: string | null; vaqt: string;
  fio: string | null; login: string | null;
};

export type HuquqiyRejim = "bozor_balansida" | "mulkdor_kadastrli" | "mulkdor_kadastrsiz";

export type Tarif = {
  id: number; bozor_id: number; tur: "ijara" | "majburiy_xizmat" | "kunlik";
  maqsad: string | null; obyekt_turi: string | null; qavat: number | null;
  olchov: "m2_oy" | "orin_kun" | "marta" | "oy"; narx: number; asos: string | null;
  boshlanish: string; tugash: string | null; faol: number; bozor_nomi?: string;
};

/** Planda ijaraga BERILMAYDIGAN obyekt: yo'lak, kirish, hojatxona… */
export type PlanObyekt = {
  id: number; bozor_id: number; nomi: string; tur: string; qavat: number;
  x: number; y: number; eni: number; boyi: number; burchak: number; izoh: string | null;
};

/** Bo'sh joy so'rab kelgan ariza (navbat). */
export type Ariza = {
  id: number; bozor_id: number; raqam: string; fio: string; telefon: string | null;
  stir: string | null; faoliyat: string | null; maqsad: string | null;
  istalgan: string | null; holat: "navbatda" | "korilmoqda" | "qabul" | "rad" | "bekor";
  izoh: string | null; qaror_izoh: string | null; shartnoma_id: number | null;
  qaror_fio: string | null; qaror_vaqt: string | null; yaratilgan: string;
  bozor_nomi?: string; shartnoma_raqam?: string | null; rasta_raqam?: string | null;
  navbat_orni: number | null;
};

/** Shartnoma tuzishda tarif bo'yicha oylik to'lov TAKLIFI (hisoblanma emas). */
export type TolovTaklif = {
  summa: number | null; rejim: HuquqiyRejim; rejim_izohi: string;
  qatorlar: { tur: string; summa: number | null; izoh: string; tarif_id?: number }[];
};
