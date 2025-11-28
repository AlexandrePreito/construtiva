"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useObras } from "@/hooks/use-obras";
import type { Obra } from "@/lib/schema";

const obraFormSchema = z.object({
  nome: z.string().min(2, "Informe o nome da obra"),
  cidade: z.string().optional().default(""),
  estado: z
    .string()
    .length(2, "Use a sigla do estado")
    .or(z.literal(""))
    .transform((value) => value.toUpperCase()),
  endereco: z.string().optional().default(""),
});

type ObraFormValues = z.infer<typeof obraFormSchema>;

type FiltrosAplicados = {
  nome: string;
  cidade: string;
  estado: string;
};

export default function ObrasPage() {
  const { obras, isReady, createObra, updateObra, deleteObra } = useObras();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [obraEmEdicao, setObraEmEdicao] = useState<Obra | null>(null);
  const [obraParaExcluir, setObraParaExcluir] = useState<Obra | null>(null);
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const obrasPorPagina = 20;

  const [filtroNomeEntrada, setFiltroNomeEntrada] = useState("");
  const [filtroCidadeEntrada, setFiltroCidadeEntrada] = useState("");
  const [filtroEstadoEntrada, setFiltroEstadoEntrada] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosAplicados>({
    nome: "",
    cidade: "",
    estado: "",
  });

  const formNovo = useForm<ObraFormValues>({
    resolver: zodResolver(obraFormSchema),
    defaultValues: {
      nome: "",
      cidade: "",
      estado: "",
      endereco: "",
    },
  });

  const formEdicao = useForm<ObraFormValues>({
    resolver: zodResolver(obraFormSchema),
    defaultValues: {
      nome: "",
      cidade: "",
      estado: "",
      endereco: "",
    },
  });

  useEffect(() => {
    if (obraEmEdicao) {
      formEdicao.reset({
        nome: obraEmEdicao.nome,
        cidade: obraEmEdicao.cidade ?? "",
        estado: obraEmEdicao.estado ?? "",
        endereco: obraEmEdicao.endereco ?? "",
      });
    }
  }, [obraEmEdicao, formEdicao]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setObrasSelecionadas((prev) => prev.filter((id) => obras.some((obra) => obra.id === id)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [obras]);

  const estadosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    obras.forEach((obra) => {
      if (obra.estado) set.add(obra.estado);
    });
    return Array.from(set).sort();
  }, [obras]);

  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    obras.forEach((obra) => {
      if (obra.cidade) set.add(obra.cidade);
    });
    return Array.from(set).sort();
  }, [obras]);

  const obrasFiltradas = useMemo(() => {
    return obras.filter((obra) => {
      if (
        filtrosAplicados.nome &&
        !obra.nome.toLowerCase().includes(filtrosAplicados.nome.toLowerCase())
      ) {
        return false;
      }
      if (
        filtrosAplicados.cidade &&
        obra.cidade.toLowerCase() !== filtrosAplicados.cidade.toLowerCase()
      ) {
        return false;
      }
      if (
        filtrosAplicados.estado &&
        obra.estado.toLowerCase() !== filtrosAplicados.estado.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [obras, filtrosAplicados]);

  const totalPaginas = Math.max(1, Math.ceil(obrasFiltradas.length / obrasPorPagina) || 1);
  const inicioIndice = (paginaAtual - 1) * obrasPorPagina;
  const obrasPaginadas = useMemo(
    () => obrasFiltradas.slice(inicioIndice, inicioIndice + obrasPorPagina),
    [obrasFiltradas, inicioIndice],
  );
  const exibindoInicio = obrasFiltradas.length === 0 ? 0 : inicioIndice + 1;
  const exibindoFim = Math.min(inicioIndice + obrasPorPagina, obrasFiltradas.length);

  useEffect(() => {
    if (paginaAtual <= totalPaginas) return;
    const timer = window.setTimeout(() => setPaginaAtual(totalPaginas), 0);
    return () => window.clearTimeout(timer);
  }, [paginaAtual, totalPaginas]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPaginaAtual(1), 0);
    return () => window.clearTimeout(timer);
  }, [filtrosAplicados]);

  const todasSelecionadas = useMemo(() => {
    if (obrasFiltradas.length === 0) return false;
    return obrasFiltradas.every((obra) => obrasSelecionadas.includes(obra.id));
  }, [obrasFiltradas, obrasSelecionadas]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      nome: filtroNomeEntrada,
      cidade: filtroCidadeEntrada,
      estado: filtroEstadoEntrada,
    });
  };

  const limparFiltros = () => {
    setFiltroNomeEntrada("");
    setFiltroCidadeEntrada("");
    setFiltroEstadoEntrada("");
    setFiltrosAplicados({ nome: "", cidade: "", estado: "" });
  };

  const onSubmitNovo = formNovo.handleSubmit(async (values) => {
    const resultado = await createObra({
      nome: values.nome,
      cidade: values.cidade ?? "",
      estado: values.estado ?? "",
      endereco: values.endereco ?? "",
    });
    if (!resultado) {
      formNovo.setError("nome", { message: "Já existe uma obra com esse nome." });
      return;
    }
    setMostrarFormNovo(false);
    formNovo.reset({ nome: "", cidade: "", estado: "", endereco: "" });
    setPaginaAtual(1);
  });

  const onSubmitEdicao = formEdicao.handleSubmit(async (values) => {
    if (!obraEmEdicao) return;
    const sucesso = await updateObra(obraEmEdicao.id, {
      nome: values.nome,
      cidade: values.cidade ?? "",
      estado: values.estado ?? "",
      endereco: values.endereco ?? "",
    });
    if (!sucesso) {
      formEdicao.setError("nome", { message: "Já existe uma obra com esse nome." });
      return;
    }
    setObraEmEdicao(null);
  });

  const handleRemoverSelecionados = async () => {
    await Promise.all(obrasSelecionadas.map((id) => deleteObra(id)));
    setObrasSelecionadas([]);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Obras</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="unstyled"
            size="sm"
            className="rounded-full bg-white px-3 text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
            onClick={() => setMostrarFiltros((prev) => !prev)}
            aria-label={`${mostrarFiltros ? "Ocultar" : "Mostrar"} filtros`}
          >
            {mostrarFiltros ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#00AFF0] px-4 text-white hover:bg-[#009cd6]"
            onClick={() => setMostrarFormNovo(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </header>

      {mostrarFiltros ? (
        <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
          <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
            <FiltroCampo
              label="Nome"
              placeholder="Filtrar por nome"
              value={filtroNomeEntrada}
              onChange={setFiltroNomeEntrada}
            />
            <FiltroSelect
              label="Cidade"
              placeholder="Selecionar cidade"
              options={cidadesDisponiveis}
              value={filtroCidadeEntrada}
              onChange={setFiltroCidadeEntrada}
            />
            <FiltroSelect
              label="Estado"
              placeholder="Selecionar estado"
              options={estadosDisponiveis}
              value={filtroEstadoEntrada}
              onChange={setFiltroEstadoEntrada}
            />
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="unstyled"
                className="mt-0 flex items-center justify-center rounded-full bg-white px-3 py-2 text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
                aria-label="Aplicar filtros"
                onClick={aplicarFiltros}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!isReady ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Carregando obras cadastradas...
        </div>
      ) : obras.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Nenhuma obra cadastrada ainda. Clique no botão Adicionar para incluir a primeira.
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          {obrasSelecionadas.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)]/40 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {obrasSelecionadas.length} obra(s) selecionada(s). Você pode remover em massa.
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                onClick={handleRemoverSelecionados}
              >
                <Trash2 className="h-4 w-4" />
                Remover selecionadas
              </Button>
            </div>
          ) : null}

          {obrasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhuma obra encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#f5f7fb] text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        checked={todasSelecionadas}
                        onChange={() => {
                          if (todasSelecionadas) {
                            setObrasSelecionadas((current) =>
                              current.filter((id) => !obrasFiltradas.some((obra) => obra.id === id)),
                            );
                          } else {
                            setObrasSelecionadas((current) => {
                              const conjunto = new Set(current);
                              obrasFiltradas.forEach((obra) => conjunto.add(obra.id));
                              return Array.from(conjunto);
                            });
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Obra
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Cidade
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Estado
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Endereço
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Criada em
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {obrasPaginadas.map((obra) => (
                    <tr
                      key={obra.id}
                      className="cursor-pointer rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                      onClick={() => setObraEmEdicao(obra)}
                    >
                      <td className="rounded-l-xl px-4 py-4 align-top">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--accent)]"
                          checked={obrasSelecionadas.includes(obra.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            setObrasSelecionadas((current) =>
                              current.includes(obra.id)
                                ? current.filter((id) => id !== obra.id)
                                : [...current, obra.id],
                            );
                          }}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-4 align-top text-sm font-semibold text-foreground">
                        {obra.nome}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-foreground">
                        {obra.cidade || "—"}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-foreground">
                        {obra.estado || "—"}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-foreground">
                        {obra.endereco || "—"}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-foreground">
                        {obra.criadoEm
                          ? new Date(obra.criadoEm).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="rounded-r-xl px-4 py-4 align-top text-right">
                        <button
                          type="button"
                          className="text-[var(--accent)] transition hover:opacity-80"
                          aria-label="Editar obra"
                          onClick={(event) => {
                            event.stopPropagation();
                            setObraEmEdicao(obra);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="ml-3 text-[var(--danger)] transition hover:opacity-80"
                          aria-label="Remover obra"
                          onClick={(event) => {
                            event.stopPropagation();
                            setObraParaExcluir(obra);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {obrasFiltradas.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl bg-surface/40 p-4 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {exibindoInicio} - {exibindoFim} de {obrasFiltradas.length} obras
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="unstyled"
                className="h-9 w-9 rounded-full border border-[var(--border)] bg-white text-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:text-[var(--accent)]"
                  onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
                  disabled={paginaAtual === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-foreground">
                  {paginaAtual} / {totalPaginas}
                </span>
                <Button
                  type="button"
                  variant="unstyled"
                className="h-9 w-9 rounded-full border border-[var(--border)] bg-white text-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:text-[var(--accent)]"
                  onClick={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
                  disabled={paginaAtual === totalPaginas}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {mostrarFormNovo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            setMostrarFormNovo(false);
            formNovo.reset({ nome: "", cidade: "", estado: "", endereco: "" });
          }}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                setMostrarFormNovo(false);
                formNovo.reset({ nome: "", cidade: "", estado: "", endereco: "" });
              }}
              aria-label="Fechar formulário de obra"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Adicionar obra</h3>
            </header>
            <form className="space-y-6" onSubmit={onSubmitNovo}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Nome da obra</span>
                  <input
                    className="form-input"
                    placeholder="Nome"
                    {...formNovo.register("nome")}
                  />
                  {formNovo.formState.errors.nome ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.nome.message}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Estado (UF)</span>
                  <input
                    className="form-input"
                    placeholder="Ex: SP"
                    maxLength={2}
                    {...formNovo.register("estado")}
                  />
                  {formNovo.formState.errors.estado ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.estado.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Cidade</span>
                  <input
                    className="form-input"
                    placeholder="Cidade"
                    {...formNovo.register("cidade")}
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Endereço</span>
                  <input
                    className="form-input"
                    placeholder="Endereço completo"
                    {...formNovo.register("endereco")}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    setMostrarFormNovo(false);
                    formNovo.reset({ nome: "", cidade: "", estado: "", endereco: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="rounded-full px-4">
                  Salvar obra
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {obraEmEdicao ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            setObraEmEdicao(null);
            formEdicao.reset();
          }}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                setObraEmEdicao(null);
                formEdicao.reset();
              }}
              aria-label="Fechar formulário de edição"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Editar obra</h3>
            </header>
            <form className="space-y-6" onSubmit={onSubmitEdicao}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Nome da obra</span>
                  <input
                    className="form-input"
                    placeholder="Nome"
                    {...formEdicao.register("nome")}
                  />
                  {formEdicao.formState.errors.nome ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formEdicao.formState.errors.nome.message}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Estado (UF)</span>
                  <input
                    className="form-input"
                    placeholder="Ex: SP"
                    maxLength={2}
                    {...formEdicao.register("estado")}
                  />
                  {formEdicao.formState.errors.estado ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formEdicao.formState.errors.estado.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Cidade</span>
                  <input
                    className="form-input"
                    placeholder="Cidade"
                    {...formEdicao.register("cidade")}
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Endereço</span>
                  <input
                    className="form-input"
                    placeholder="Endereço completo"
                    {...formEdicao.register("endereco")}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    setObraEmEdicao(null);
                    formEdicao.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="rounded-full px-4">
                  Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {obraParaExcluir ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
          onClick={() => setObraParaExcluir(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Confirmar exclusão</h3>
            <p className="mt-2 text-sm text-foreground-muted">
              Tem certeza de que deseja remover a obra
              {" "}
              <span className="font-semibold text-foreground">{obraParaExcluir.nome}</span>
              ? Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-sm font-semibold text-foreground"
                onClick={() => setObraParaExcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                onClick={async () => {
                  await deleteObra(obraParaExcluir.id);
                  setObraParaExcluir(null);
                }}
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FiltroSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (valor: string) => void;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
      <span className="font-semibold text-foreground">{label}</span>
      <select
        className={`form-input w-full text-sm ${hasValue ? "text-foreground" : "text-[var(--foreground-muted)]"}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FiltroCampo({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
      <span className="font-semibold text-foreground">{label}</span>
      <input
        className="form-input w-full"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

