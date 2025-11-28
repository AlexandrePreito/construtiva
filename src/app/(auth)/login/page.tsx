"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  HardHat,
  PieChart,
  Settings,
  ShieldCheck,
  Triangle,
  TrendingUp,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { hashPassword } from "@/lib/security";
import { clearSession, saveSession } from "@/lib/session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  nome: z.string().min(2, "Informe o usuário."),
  senha: z.string().min(4, "Informe a senha."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nome: "", senha: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErro(null);
    setCarregando(true);
    try {
      const usuario = values.nome.trim();
      const { data, error } = await supabase
        .from("usuarios_app")
        .select("id, nome, senha_hash")
        .eq("nome", usuario)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setErro("Usuário ou senha inválidos.");
        return;
      }

      const senhaHash = await hashPassword(values.senha);
      if (senhaHash !== data.senha_hash) {
        setErro("Usuário ou senha inválidos.");
        return;
      }

      clearSession();
      saveSession({
        id: data.id,
        nome: data.nome,
        loggedAt: new Date().toISOString(),
      });

      router.replace("/dashboard");
    } catch (loginError) {
      const mensagem =
        loginError instanceof Error
          ? loginError.message
          : "Não foi possível entrar. Tente novamente.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  });

  const abrirModal = () => {
    setErro(null);
    setModalAberto(true);
    window.setTimeout(() => {
      document.getElementById("login-nome-input")?.focus();
    }, 150);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setErro(null);
    setCarregando(false);
    form.reset();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1160px] flex-col justify-center px-6 py-12 lg:px-12">
      <section className="flex flex-col justify-between rounded-3xl border border-[var(--border)] bg-card/80 px-10 py-12 shadow-xl md:px-16 md:py-16">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-3 rounded-full bg-[var(--accent-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              <Triangle className="h-4 w-4 rotate-90" />
                Construtiva
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                  Controle total da obra em uma linha do tempo visual.
                </h1>
                <p className="text-lg text-foreground-muted">
                  Acompanhe cronogramas, serviços e estágios com exportações em Excel, fluxo L.O.B. colorido e políticas de acesso para toda a equipe.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="self-start rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              onClick={abrirModal}
            >
              Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {informativos.map((info) => (
              <div
                key={info.titulo}
                className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
                  {info.icone}
                </div>
                <dt className="text-base font-semibold text-foreground">{info.titulo}</dt>
                <dd className="mt-2 text-sm text-foreground-muted">{info.descricao}</dd>
              </div>
            ))}
          </dl>
        </div>
          <div className="pt-16 text-sm text-foreground-muted">
            <p>
              Precisa de ajuda? <span className="font-semibold text-[var(--accent)]">contato@construtiva.app</span>
            </p>
          </div>
        </section>

      {modalAberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          onClick={fecharModal}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-white/95 p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-foreground transition hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]"
              onClick={fecharModal}
              aria-label="Fechar formulário de login"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 space-y-1 pr-12">
              <h3 className="text-xl font-semibold text-foreground">Entrar no sistema</h3>
              <p className="text-sm text-foreground-muted">
                Informe seu usuário e senha cadastrados para continuar.
              </p>
            </header>
            {erro ? (
              <div className="mb-6 rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
                {erro}
              </div>
            ) : null}
            <form className="space-y-5" onSubmit={onSubmit}>
              <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                <span className="font-semibold text-foreground">Usuário</span>
                <input
                  id="login-nome-input"
                  type="text"
                  className="form-input"
                  placeholder="Nome do usuário"
                  {...form.register("nome")}
                />
                {form.formState.errors.nome ? (
                  <span className="text-xs font-semibold text-[var(--danger)]">
                    {form.formState.errors.nome.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                <span className="font-semibold text-foreground">Senha</span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Digite sua senha"
                  {...form.register("senha")}
                />
                {form.formState.errors.senha ? (
                  <span className="text-xs font-semibold text-[var(--danger)]">
                    {form.formState.errors.senha.message}
                  </span>
                ) : null}
              </label>

              <Button
                type="submit"
                size="sm"
                className="mt-2 w-full justify-center gap-2 rounded-full bg-[var(--accent)] px-4 text-white transition hover:bg-[var(--accent-strong)]"
                disabled={carregando}
              >
                {carregando ? "Entrando..." : "Entrar"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const informativos = [
  {
    titulo: "Cronograma inteligente",
    descricao: "Edite e compartilhe o cronograma com importação de planilhas e histórico de alterações.",
    icone: <CalendarRange className="h-5 w-5" />,
  },
  {
    titulo: "Fluxo L.O.B colorido",
    descricao: "Visualize serviços em cores contínuas com exportação direta para Excel para colar nas paredes do canteiro.",
    icone: <BarChart3 className="h-5 w-5" />,
  },
  {
    titulo: "Validação em campo",
    descricao: "Checklist mobile para registrar fotos, responsáveis e datas de conclusão de cada etapa.",
    icone: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    titulo: "Acesso seguro",
    descricao: "Controle granular de usuários, papéis e auditoria das ações importantes dentro do sistema.",
    icone: <ShieldCheck className="h-5 w-5" />,
  },
  {
    titulo: "Controle financeiro de obras",
    descricao: "Organize despesas, previsões e comparativos de orçamento em um só painel.",
    icone: <Settings className="h-5 w-5" />,
  },
  {
    titulo: "Curva S",
    descricao: "Compare o avanço físico e financeiro acumulado com projeções dinâmicas.",
    icone: <Activity className="h-5 w-5" />,
  },
  {
    titulo: "Fluxo de recebimento",
    descricao: "Programe entradas de clientes, contratos e aditivos para equilibrar o caixa.",
    icone: <TrendingUp className="h-5 w-5" />,
  },
  {
    titulo: "Gerenciamento de obras",
    descricao: "Delegue responsáveis, controle pendências e integre equipes em cada frente.",
    icone: <HardHat className="h-5 w-5" />,
  },
  {
    titulo: "Viabilidade financeira",
    descricao: "Simule cenários de retorno e margens para tomar decisões com segurança.",
    icone: <PieChart className="h-5 w-5" />,
  },
] as const;

