"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "sending">(
    (statusParam as any) || "idle"
  );

  async function handleUnsubscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="border border-brand-border rounded-xl p-8 bg-white max-w-md w-full text-center">
          <span className="text-5xl block mb-4">👋</span>
          <h1 className="text-2xl font-bold text-brand-text mb-3">
            Inscrição cancelada
          </h1>
          <p className="text-brand-muted text-sm mb-6">
            Você foi removido(a) da lista do Atalaia. Sentiremos sua falta!
          </p>
          <p className="text-brand-muted/50 text-xs mb-6">
            Se foi um engano, você pode se inscrever novamente a qualquer momento.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 border border-brand-trust/50 text-brand-trust font-semibold rounded-lg hover:bg-brand-trust/10 transition-colors text-sm"
          >
            Voltar ao Atalaia
          </a>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="border border-brand-border rounded-xl p-8 bg-white max-w-md w-full text-center">
          <span className="text-5xl block mb-4">😕</span>
          <h1 className="text-2xl font-bold text-brand-text mb-3">
            Algo deu errado
          </h1>
          <p className="text-brand-muted text-sm mb-6">
            Não conseguimos processar seu pedido. Tente novamente ou entre em contato conosco.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="inline-block px-6 py-3 border border-brand-trust/50 text-brand-trust font-semibold rounded-lg hover:bg-brand-trust/10 transition-colors text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
      <div className="border border-brand-border rounded-xl p-8 bg-white max-w-md w-full">
        <div className="text-center mb-6">
          <span className="text-4xl block mb-3">📨</span>
          <h1 className="text-2xl font-bold text-brand-text mb-2">
            Cancelar inscrição
          </h1>
          <p className="text-brand-muted text-sm">
            Digite seu email para cancelar a newsletter do Atalaia.
          </p>
        </div>

        <form onSubmit={handleUnsubscribe} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-trust/50"
          />
          <button
            type="submit"
            disabled={!email || status === "sending"}
            className="w-full py-3 bg-brand-cta text-white font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-30 text-sm"
          >
            {status === "sending" ? "Processando..." : "Cancelar inscrição"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-brand-border text-center">
          <a
            href="/"
            className="text-xs text-brand-muted hover:text-brand-trust transition-colors"
          >
            Voltar ao Atalaia
          </a>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <p className="text-brand-muted">Carregando...</p>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
