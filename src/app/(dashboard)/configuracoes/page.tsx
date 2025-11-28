"use client";

import Link from "next/link";
import { Activity, Shield, UserCog, UsersRound } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">
          Configurações e acessos
        </h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/configuracoes/usuarios"
          className="group relative flex h-full flex-col justify-between rounded-2xl border border-[var(--border)] bg-card p-6 text-foreground shadow-sm transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-md no-underline hover:no-underline focus-visible:no-underline"
        >
          <div className="space-y-4">
            <UsersRound className="h-6 w-6 text-[var(--accent)] transition group-hover:scale-110" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Usuários
              </h2>
              <p className="text-sm text-foreground-muted">
                Cadastre rapidamente novos usuários definindo nome e senha. Ideal para liberar o acesso de engenheiros e supervisores.
              </p>
            </div>
          </div>
        </Link>

        <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <Shield className="h-6 w-6 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-foreground">
            Papéis personalizados
          </h2>
          <p className="text-sm text-foreground-muted">
            Defina perfis como Administrador, Engenheiro, Membro da obra e subcontratados.
          </p>
        </article>

        <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <UserCog className="h-6 w-6 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-foreground">
            Controle de acessos
          </h2>
          <p className="text-sm text-foreground-muted">
            Configure quem pode editar cronogramas, validar etapas em campo ou gerar relatórios.
          </p>
        </article>

        <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <Activity className="h-6 w-6 text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-foreground">
            Logs de auditoria
          </h2>
          <p className="text-sm text-foreground-muted">
            Registre importações, alterações de etapas e validações mobile para manter rastreabilidade.
          </p>
        </article>
      </div>
    </section>
  );
}

