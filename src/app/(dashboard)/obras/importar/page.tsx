"use client";

import Link from "next/link";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { useObras } from "@/hooks/use-obras";
import { Button } from "@/components/ui/button";

export default function ImportarCronogramaPage() {
  const { obras, isReady } = useObras();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Cronograma de obra
          </h1>
          <p className="mt-2 max-w-2xl text-base text-foreground-muted">
            Escolha a obra para importar uma planilha (XLSX ou CSV), revisar as
            etapas e salvar o cronograma.
          </p>
        </div>
        <Link href="/obras" className="self-end md:self-auto">
          <Button
            variant="ghost"
            className="rounded-full text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-card p-8 shadow-sm">
        <header className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            1. Selecione a obra
          </h2>
          <p className="text-sm text-foreground-muted">
            O cronograma será vinculado à obra escolhida. Você poderá importar
            novamente caso precise substituir os dados.
          </p>
        </header>

        {!isReady ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-sm text-foreground-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            Carregando suas obras...
          </div>
        ) : obras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
            Nenhuma obra encontrada. Cadastre uma obra antes de importar o
            cronograma.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {obras.map((obra) => (
              <article
                key={obra.id}
                className="flex h-full flex-col justify-between rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {obra.nome}
                  </h3>
                  <p className="text-sm text-foreground-muted">
                    {obra.cidade} / {obra.estado}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-foreground-muted">
                    Atualizado em{" "}
                    {obra.atualizadoEm
                      ? new Date(obra.atualizadoEm).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
                <Link
                  href={`/obras/${obra.id}/cronograma`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:underline"
                >
                  <UploadCloud className="h-4 w-4" />
                  Importar cronograma
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

