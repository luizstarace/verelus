"use client";

import { useState, useEffect } from "react";

interface Edition {
  id: string;
  title: string;
  subject: string;
  sent_at: string;
  open_rate: number | null;
  click_rate: number | null;
  content_html: string | null;
}


export default function ArchivePage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null);

  useEffect(() => {
    fetch("/api/editions?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setEditions(data.editions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-brand-border">
        <a href="/" className="flex items-center gap-3">
          <div>
            <span className="text-xl font-bold text-brand-trust">Verelus</span>
            <p className="text-xs text-brand-muted">Arquivo de Newsletters</p>
          </div>
        </a>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Inscrever-se
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-3">
            Arquivo de <span className="text-brand-trust">Edições</span>
          </h1>
          <p className="text-brand-muted max-w-2xl mx-auto">
            Todas as edições da newsletter Verelus. Inteligência musical com IA, toda segunda-feira.
          </p>
        </div>

        {/* Selected Edition View */}
        {selectedEdition && (
          <div className="mb-8">
            <button
              onClick={() => setSelectedEdition(null)}
              className="text-sm text-brand-trust hover:text-brand-trust/80 transition-colors mb-4 flex items-center gap-1"
            >
              ← Voltar ao arquivo
            </button>
            <div className="border border-brand-border rounded-xl bg-white">
              <div className="px-6 py-4 border-b border-brand-border">
                <h2 className="text-xl font-bold text-brand-text">
                  {selectedEdition.subject}
                </h2>
                <p className="text-xs text-brand-muted mt-1">
                  {new Date(selectedEdition.sent_at).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div
                className="px-6 py-6 prose max-w-none text-brand-muted text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: selectedEdition.content_html || "<p>Conteúdo não disponível.</p>",
                }}
              />
            </div>
          </div>
        )}

        {/* Editions List */}
        {!selectedEdition && (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <p className="text-brand-muted">Carregando...</p>
              </div>
            ) : editions.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-5xl block mb-4">📨</span>
                <h2 className="text-xl font-bold text-brand-text mb-2">
                  Primeira edição em breve!
                </h2>
                <p className="text-brand-muted mb-6">
                  Nossa primeira newsletter sai na próxima segunda-feira. Inscreva-se para não perder!
                </p>
                <a
                  href="/"
                  className="inline-block px-6 py-3 bg-brand-cta text-white font-bold rounded-lg hover:brightness-110 transition-all"
                >
                  Inscrever-se Grátis
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {editions.map((edition) => (
                  <button
                    key={edition.id}
                    onClick={() => setSelectedEdition(edition)}
                    className="w-full text-left border border-brand-border rounded-xl p-5 bg-white hover:bg-brand-surface transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-brand-text group-hover:text-brand-trust transition-colors truncate">
                          {edition.subject}
                        </h3>
                        <p className="text-xs text-brand-muted mt-1">
                          {new Date(edition.sent_at).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {edition.open_rate && (
                          <span className="text-[10px] text-brand-muted font-mono">
                            {(edition.open_rate * 100).toFixed(0)}% opens
                          </span>
                        )}
                        <span className="text-brand-trust text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-brand-border mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-brand-trust">Verelus</span>
          </div>
          <p className="text-xs text-brand-muted">
            Inteligência musical com IA para artistas independentes.
          </p>
          <p className="text-xs text-brand-muted">
            © 2026 Verelus. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
