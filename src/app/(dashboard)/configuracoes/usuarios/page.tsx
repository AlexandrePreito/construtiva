"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Filter, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUsuariosApp } from "@/hooks/use-usuarios";

const usuarioSchema = z.object({
  nome: z.string().min(2, "Informe pelo menos 2 caracteres."),
  senha: z.string().min(4, "Defina uma senha com no mínimo 4 caracteres."),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

export default function CadastroUsuariosPage() {
  const { usuarios, isReady, isLoading, error, createUsuario, deleteUsuario } = useUsuariosApp();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const formNovo = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { nome: "", senha: "" },
  });

  const adicionarUsuario = formNovo.handleSubmit(async (values) => {
    try {
      setErroOperacao(null);
      setSalvandoNovo(true);
      await createUsuario({ nome: values.nome.trim(), senha: values.senha });
      formNovo.reset();
      setMostrarFormNovo(false);
    } catch (submitError) {
      const mensagem =
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar o usuário.";
      setErroOperacao(mensagem);
    } finally {
      setSalvandoNovo(false);
    }
  });

  const usuariosFiltrados = useMemo(() => {
    if (!filtroNome.trim()) return usuarios;
    const termo = filtroNome.trim().toLowerCase();
    return usuarios.filter((usuario) => usuario.nome.toLowerCase().includes(termo));
  }, [usuarios, filtroNome]);

  const limparFiltros = () => setFiltroNome("");

  return (
    <section className="space-y-6">
      {error || erroOperacao ? (
        <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {erroOperacao ?? error}
        </div>
      ) : null}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-semibold text-foreground">Cadastro de usuários</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="unstyled"
            size="sm"
            className="rounded-full bg-white px-3 text-[var(--accent)] shadow-sm transition hover:bg-[var(--accent-muted)]"
            onClick={() => setMostrarFiltros((prev) => !prev)}
            aria-label={`${mostrarFiltros ? "Ocultar" : "Mostrar"} filtros`}
          >
            {mostrarFiltros ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#00AFF0] px-4 text-white transition hover:bg-[#009cd6]"
            onClick={() => setMostrarFormNovo(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
          <Link
            href="/configuracoes"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--accent)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
            aria-label="Voltar para configurações"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {mostrarFiltros ? (
        <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
          <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="flex flex-col gap-2 text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">Nome</span>
              <input
                className="form-input"
                placeholder="Filtrar por nome"
                value={filtroNome}
                onChange={(event) => setFiltroNome(event.target.value)}
              />
            </label>
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="unstyled"
                className="mt-6 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
                aria-label="Aplicar filtros"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
        {isReady && usuariosFiltrados.length > 0 ? (
          <div className="flex items-center justify-end">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
              {usuariosFiltrados.length} registro(s)
            </span>
          </div>
        ) : null}
        {isReady && isLoading ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            Atualizando lista...
          </p>
        ) : null}

        {!isReady ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/40 p-10 text-center text-sm text-foreground-muted">
            Carregando usuários...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/40 p-10 text-center text-sm text-foreground-muted">
            Nenhum usuário cadastrado ainda. Clique em Adicionar para incluir o primeiro acesso.
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/40 p-10 text-center text-sm text-foreground-muted">
            Nenhum usuário encontrado com os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-[#f5f7fb] text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                  <th className="rounded-l-xl px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="rounded-r-xl px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                  >
                    <td className="rounded-l-xl px-4 py-4 align-top text-sm font-semibold text-foreground">
                      {usuario.nome}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-foreground">
                      {new Date(usuario.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="rounded-r-xl px-4 py-4 align-top text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-full p-0 text-[var(--danger)] hover:bg-[var(--danger-muted)]"
                        disabled={removendoId === usuario.id}
                        onClick={async () => {
                          try {
                            setErroOperacao(null);
                            setRemovendoId(usuario.id);
                            await deleteUsuario(usuario.id);
                          } catch (deleteError) {
                            const mensagem =
                              deleteError instanceof Error
                                ? deleteError.message
                                : "Não foi possível remover o usuário.";
                            setErroOperacao(mensagem);
                          } finally {
                            setRemovendoId(null);
                          }
                        }}
                        aria-label={`Remover ${usuario.nome}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {mostrarFormNovo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            formNovo.reset();
            setMostrarFormNovo(false);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                formNovo.reset();
                setMostrarFormNovo(false);
              }}
              aria-label="Fechar formulário de usuário"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Adicionar usuário</h3>
              <p className="text-sm text-foreground-muted">
                Informe nome e senha real. Futuramente este fluxo será integrado ao Supabase.
              </p>
            </header>
            <form className="space-y-5" onSubmit={adicionarUsuario}>
              <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                <span className="font-semibold text-foreground">Nome</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex.: Maria Engenheira"
                  {...formNovo.register("nome")}
                />
                {formNovo.formState.errors.nome ? (
                  <span className="text-xs font-semibold text-[var(--danger)]">
                    {formNovo.formState.errors.nome.message}
                  </span>
                ) : null}
              </label>

              <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                <span className="font-semibold text-foreground">Senha real</span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Informe uma senha inicial"
                  {...formNovo.register("senha")}
                />
                {formNovo.formState.errors.senha ? (
                  <span className="text-xs font-semibold text-[var(--danger)]">
                    {formNovo.formState.errors.senha.message}
                  </span>
                ) : null}
              </label>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    formNovo.reset();
                    setMostrarFormNovo(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={salvandoNovo}
                >
                  {salvandoNovo ? "Salvando..." : "Salvar usuário"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
