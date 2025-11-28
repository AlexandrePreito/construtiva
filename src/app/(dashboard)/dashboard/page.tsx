"use client";

import { TrendingUp, CalendarRange, Users, ClipboardList } from "lucide-react";

const metrics = [
  {
    label: "Obras ativas",
    value: "0",
    caption: "aguardando cadastro",
    icon: BuildingIcon,
  },
  {
    label: "Etapas concluídas",
    value: "0%",
    caption: "sem informações importadas",
    icon: TrendingUp,
  },
  {
    label: "Próxima entrega",
    value: "—",
    caption: "importação pendente",
    icon: CalendarRange,
  },
  {
    label: "Equipe envolvida",
    value: "0",
    caption: "controle de usuários a configurar",
    icon: Users,
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Painéis de Obras</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground-muted">
                {metric.label}
              </span>
              <span className="rounded-full bg-[var(--accent-muted)] p-2 text-[var(--accent)]">
                <metric.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-foreground">
              {metric.value}
            </p>
            <p className="mt-2 text-sm text-foreground-muted">
              {metric.caption}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Cronogramas recentes
              </h2>
              <p className="text-sm text-foreground-muted">
                Importe sua planilha de etapas para começar o acompanhamento.
              </p>
            </div>
            <span className="rounded-full bg-[var(--accent-muted)] p-2 text-[var(--accent)]">
              <ClipboardList className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-surface/60 py-12 text-center text-sm text-foreground-muted">
            <p>Nenhuma importação realizada.</p>
            <p>Use o menu lateral para cadastrar obras e carregar o cronograma.</p>
          </div>
        </article>

        <aside className="rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Próximos passos
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-foreground-muted">
            <li>1. Cadastre a primeira obra com dados básicos.</li>
            <li>2. Configure as etapas padrões do cronograma.</li>
            <li>3. Personalize serviços com cores e agrupamentos.</li>
            <li>4. Gera o Gantt e exporte em PDF para a obra.</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}

function BuildingIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      {...props}
    >
      <path d="M4 21h16" />
      <path d="M14 21V6.5a1.5 1.5 0 0 0-1.276-1.482L6.724 4.026A1.5 1.5 0 0 0 5 5.5V21" />
      <path d="M10 12h.01M10 16h.01M10 8h.01M6 12h.01M6 16h.01M6 8h.01" />
      <path d="M18 21v-9h1a1 1 0 0 1 1 1v8" />
      <path d="M14 12h4" />
    </svg>
  );
}

