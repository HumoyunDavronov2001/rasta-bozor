"use client";

import { createContext, useContext } from "react";
import type { Bozor, Men } from "./turlar";

type Qiymat = {
  men: Men;
  bozorlar: Bozor[];
  /** Tanlangan bozor. null = barcha bozorlar (faqat admin/nazoratchi uchun). */
  bozorId: number | null;
  bozorTanla: (id: number | null) => void;
  /** Tanlovga mos `?bozor=` qismi — API so'rovlariga qo'shiladi. */
  bozorSorov: string;
  yangila: () => void;
};

export const MenKontekst = createContext<Qiymat | null>(null);

export function useMen(): Qiymat {
  const q = useContext(MenKontekst);
  if (!q) throw new Error("useMen faqat panel ichida ishlaydi");
  return q;
}

/** Rolga qarab yozish huquqi. */
export function yozaOladi(men: Men): boolean {
  return men.rol === "admin" || men.rol === "boshqaruvchi";
}

export function tolovQabulQiladi(men: Men): boolean {
  return men.rol === "admin" || men.rol === "boshqaruvchi" || men.rol === "yiguvchi";
}
