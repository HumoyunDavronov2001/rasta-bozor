"use client";

import { useCallback, useEffect, useState } from "react";

/** Serverdan qaytgan xato — matni foydalanuvchiga ko'rsatiladi. */
export class ApiXato extends Error {
  kod: number;
  constructor(xabar: string, kod: number) {
    super(xabar);
    this.kod = kod;
  }
}

/** Sessiya tugaganda butun ilova xabardor bo'lsin (panel karkasi tinglaydi). */
export const SESSIYA_HODISASI = "rasta:sessiya-tugadi";

async function javobniOch<T>(javob: Response): Promise<T> {
  const matn = await javob.text();
  let malumot: unknown = null;
  try {
    malumot = matn ? JSON.parse(matn) : null;
  } catch {
    throw new ApiXato("Serverdan tushunarsiz javob keldi", javob.status);
  }
  if (!javob.ok) {
    const xabar = (malumot as { xato?: string } | null)?.xato ?? `Xato ${javob.status}`;
    // Faqat server "sessiya_tugadi" deb belgilaganda chiqaramiz. Har qanday 401 ni
    // sessiya tugashi deb hisoblash xato edi: masalan parol almashtirishda noto'g'ri
    // joriy parol ham foydalanuvchini tizimdan chiqarib yuborardi.
    const sessiyaTugadi = (malumot as { sessiya_tugadi?: boolean } | null)?.sessiya_tugadi;
    if (javob.status === 401 && sessiyaTugadi && typeof window !== "undefined"
        && !window.location.pathname.startsWith("/kirish")) {
      window.dispatchEvent(new CustomEvent(SESSIYA_HODISASI));
    }
    throw new ApiXato(xabar, javob.status);
  }
  return malumot as T;
}

export async function olish<T>(yol: string): Promise<T> {
  const javob = await fetch(yol, { credentials: "same-origin", cache: "no-store" });
  return javobniOch<T>(javob);
}

export async function yuborish<T>(
  yol: string,
  tana?: unknown,
  usul: "POST" | "PATCH" | "DELETE" = "POST",
): Promise<T> {
  const javob = await fetch(yol, {
    method: usul,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Rasta": "1" }, // X-Rasta — CSRF himoyasi
    body: tana === undefined ? undefined : JSON.stringify(tana),
  });
  return javobniOch<T>(javob);
}

/** Qiymatni kechiktirib qaytaradi — har bosilgan harfda so'rov ketmasligi uchun. */
export function useKechiktir<T>(qiymat: T, kutish = 350): T {
  const [kechikkan, setKechikkan] = useState(qiymat);
  useEffect(() => {
    const t = setTimeout(() => setKechikkan(qiymat), kutish);
    return () => clearTimeout(t);
  }, [qiymat, kutish]);
  return kechikkan;
}

type Holat<T> = { malumot: T | null; xato: string | null; yuklanmoqda: boolean };

/** Ma'lumot yuklovchi hook. `yol` null bo'lsa so'rov yuborilmaydi.
 *  Filtrlar yo'l satriga kiradi — shuning uchun bitta bog'liqlik yetarli. */
export function useMalumot<T>(yol: string | null) {
  const [holat, setHolat] = useState<Holat<T>>({ malumot: null, xato: null, yuklanmoqda: !!yol });
  const [versiya, setVersiya] = useState(0);

  useEffect(() => {
    if (!yol) return;
    let bekor = false;
    olish<T>(yol)
      .then((m) => { if (!bekor) setHolat({ malumot: m, xato: null, yuklanmoqda: false }); })
      .catch((e: Error) => { if (!bekor) setHolat({ malumot: null, xato: e.message, yuklanmoqda: false }); });
    return () => { bekor = true; };
  }, [yol, versiya]);

  const qayta = useCallback(() => setVersiya((v) => v + 1), []);
  return { ...holat, qayta };
}
