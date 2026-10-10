"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { yuborish } from "@/lib/api";
import { KIRITISH_SINF, Maydon, Tugma, Aylanma } from "@/komponent/asos";

export default function KirishSahifasi() {
  return <Suspense fallback={null}><Ichki /></Suspense>;
}

function Ichki() {
  const yonaltir = useRouter();
  const sabab = useSearchParams().get("sabab");
  const [login, setLogin] = useState("");
  const [parol, setParol] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);

  async function joniat(hodisa: React.FormEvent) {
    hodisa.preventDefault();
    setXato(null);
    setYuborilmoqda(true);
    try {
      await yuborish("/api/kirish", { login, parol });
      yonaltir.replace("/");
    } catch (e) {
      setXato((e as Error).message);
      setYuborilmoqda(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fon p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-asos text-white">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">RASTA</h1>
          <p className="mt-1 text-sm text-xira">Bozorlarni raqamlashtirish platformasi</p>
        </div>

        <form onSubmit={joniat}
              className="space-y-4 rounded-xl border border-chiziq bg-karta p-6 shadow-[0_1px_3px_rgba(16,24,40,.06)]">
          {sabab === "sessiya" && !xato && (
            <p className="rounded-lg border border-sariq/25 bg-sariq-och px-3 py-2 text-[13px] text-sariq">
              Sessiya muddati tugadi — xavfsizlik uchun qaytadan kiring.
            </p>
          )}

          <Maydon yorliq="Login">
            <input className={KIRITISH_SINF} value={login} autoComplete="username" autoFocus
                   onChange={(e) => setLogin(e.target.value)} placeholder="masalan: boshqaruvchi" />
          </Maydon>
          <Maydon yorliq="Parol">
            <input className={KIRITISH_SINF} type="password" value={parol} autoComplete="current-password"
                   onChange={(e) => setParol(e.target.value)} placeholder="••••••••" />
          </Maydon>

          {xato && (
            <p className="rounded-lg border border-qizil/25 bg-qizil-och px-3 py-2 text-[13px] text-qizil">{xato}</p>
          )}

          <Tugma type="submit" disabled={yuborilmoqda || !login || !parol} sinf="w-full">
            {yuborilmoqda ? <><Aylanma /> Tekshirilmoqda…</> : "Kirish"}
          </Tugma>
        </form>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-xira">
          Login yoki parolni unutsangiz — bozor administratoriga murojaat qiling.
        </p>
      </div>
    </main>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 9.5 4 4h16l2 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12v8h16v-8M9.5 20v-5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
