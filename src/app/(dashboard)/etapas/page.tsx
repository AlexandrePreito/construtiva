"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
import { useEtapas, type EtapaRegistro } from "@/hooks/use-etapas";

const ordemSchema = z
  .coerce.number()
  .refine((value) => !Number.isNaN(value), { message: "Informe a ordem" })
  .refine((value) => Number.isInteger(value), { message: "Use apenas números inteiros" })
  .min(1, "A ordem deve ser maior que zero");

const etapaSchema = z.object({
  obraId: z.string().min(1, "Selecione a obra"),
  nome: z.string().min(2, "Informe o nome da etapa"),
  ordem: ordemSchema,
});

const editSchema = z.object({
  nome: z.string().min(2, "Informe o nome da etapa"),
  ordem: ordemSchema,
});

type EtapaFormValues = z.infer<typeof etapaSchema>;
type EditFormValues = z.infer<typeof editSchema>;

type FiltrosAplicados = {
  obra: string;
  etapa: string;
};

export default function EtapasPage() {
  const { obras, isReady: obrasReady } = useObras();
  const [obraSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [etapaEmEdicao, setEtapaEmEdicao] = useState<EtapaRegistro | null>(null);
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<EtapaRegistro | null>(null);
  const [etapasSelecionadas, setEtapasSelecionadas] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const etapasPorPagina = 20;
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);

  const {
    etapas,
    isReady: etapasReady,
    isLoading: etapasLoading,
    nomesDisponiveis,
    createEtapa,
    updateEtapa,
    deleteEtapas,
    error: etapasError,
  } = useEtapas(obraSelecionada);
  const carregandoEtapas = etapasLoading && !etapasReady;

  const ordenarEtapasLocal = useCallback(
    (lista: EtapaRegistro[]) =>
      [...lista].sort((a, b) =>
        a.ordem === b.ordem ? a.nome.localeCompare(b.nome, "pt-BR") : a.ordem - b.ordem,
      ),
    [],
  );

  const proximaOrdem = useMemo(() => {
    if (!obraSelecionada) return 1;
    const daObra = etapas.filter((etapa) => etapa.obraId === obraSelecionada);
    if (daObra.length === 0) return 1;
    const maior = Math.max(...daObra.map((etapa) => etapa.ordem));
    return maior + 1;
  }, [etapas, obraSelecionada]);

  const [filtroObraEntrada, setFiltroObraEntrada] = useState("");
  const [filtroEtapaEntrada, setFiltroEtapaEntrada] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosAplicados>({ obra: "", etapa: "" });

  const formNovo = useForm<EtapaFormValues>({
    resolver: zodResolver(etapaSchema) as Resolver<EtapaFormValues>,
    defaultValues: {
      obraId: "",
      nome: "",
      ordem: 1,
    },
  });

  const formEdicao = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as Resolver<EditFormValues>,
    defaultValues: {
      nome: "",
      ordem: 1,
    },
  });

  useEffect(() => {
    if (obrasReady && obras.length > 0 && !obraSelecionada) {
      const timer = window.setTimeout(() => setObraSelecionada(obras[0].id), 0);
      return () => window.clearTimeout(timer);
    }
  }, [obrasReady, obras, obraSelecionada]);

  useEffect(() => {
    if (mostrarFormNovo) {
      formNovo.setValue("obraId", obraSelecionada ?? "");
      formNovo.setValue("ordem", proximaOrdem);
    }
  }, [mostrarFormNovo, obraSelecionada, proximaOrdem, formNovo]);

  useEffect(() => {
    if (etapaEmEdicao) {
      formEdicao.reset({ nome: etapaEmEdicao.nome, ordem: etapaEmEdicao.ordem });
    }
  }, [etapaEmEdicao, formEdicao]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEtapasSelecionadas((prev) => prev.filter((id) => etapas.some((etapa) => etapa.id === id)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [etapas]);

  const etapasFiltradas = useMemo(() => {
    const filtradas = etapas.filter((etapa) => {
      if (filtrosAplicados.etapa) {
        if (!etapa.nome.toLowerCase().includes(filtrosAplicados.etapa.toLowerCase())) {
          return false;
        }
      }
      if (filtrosAplicados.obra) {
        const obra = obras.find((obraItem) => obraItem.id === etapa.obraId);
        if (!obra || obra.nome.toLowerCase() !== filtrosAplicados.obra.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
    return ordenarEtapasLocal(filtradas);
  }, [etapas, filtrosAplicados, obras, ordenarEtapasLocal]);

  const totalPaginas = Math.max(1, Math.ceil(etapasFiltradas.length / etapasPorPagina) || 1);
  const inicioIndice = (paginaAtual - 1) * etapasPorPagina;
  const etapasPaginadas = useMemo(
    () => etapasFiltradas.slice(inicioIndice, inicioIndice + etapasPorPagina),
    [etapasFiltradas, inicioIndice],
  );
  const exibindoInicio = etapasFiltradas.length === 0 ? 0 : inicioIndice + 1;
  const exibindoFim = Math.min(inicioIndice + etapasPorPagina, etapasFiltradas.length);

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
    if (etapasFiltradas.length === 0) return false;
    return etapasFiltradas.every((etapa) => etapasSelecionadas.includes(etapa.id));
  }, [etapasFiltradas, etapasSelecionadas]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({ obra: filtroObraEntrada, etapa: filtroEtapaEntrada });
  };

  const limparFiltros = () => {
    setFiltroObraEntrada("");
    setFiltroEtapaEntrada("");
    setFiltrosAplicados({ obra: "", etapa: "" });
  };

  const onSubmitNovo = formNovo.handleSubmit(async (values) => {
    try {
      setErroOperacao(null);
      setSalvandoNovo(true);
      const nomeLimpo = values.nome.trim();
      const nomeDuplicado = etapas.some(
        (etapa) =>
          etapa.obraId === values.obraId &&
          etapa.nome.trim().toLowerCase() === nomeLimpo.toLowerCase(),
      );
      if (nomeDuplicado) {
        formNovo.setError("nome", { message: "Já existe uma etapa com esse nome para a obra." });
        return;
      }

      await createEtapa({
        obraId: values.obraId,
        nome: nomeLimpo,
        ordem: values.ordem,
      });

      setMostrarFormNovo(false);
      formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", ordem: proximaOrdem });
      setPaginaAtual(1);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível salvar a etapa.";
      setErroOperacao(mensagem);
      formNovo.setError("ordem", { message: mensagem });
    } finally {
      setSalvandoNovo(false);
    }
  });

  const onSubmitEdicao = formEdicao.handleSubmit(async (values) => {
    if (!etapaEmEdicao) return;
    try {
      setErroOperacao(null);
      setSalvandoEdicao(true);
      const nomeLimpo = values.nome.trim();
      const nomeDuplicado = etapas.some(
        (etapa) =>
          etapa.id !== etapaEmEdicao.id &&
          etapa.obraId === etapaEmEdicao.obraId &&
          etapa.nome.trim().toLowerCase() === nomeLimpo.toLowerCase(),
      );
      if (nomeDuplicado) {
        formEdicao.setError("nome", { message: "Já existe uma etapa com esse nome para a obra." });
        return;
      }

      await updateEtapa({
        id: etapaEmEdicao.id,
        obraId: etapaEmEdicao.obraId,
        nome: nomeLimpo,
        ordem: values.ordem,
        ordemAnterior: etapaEmEdicao.ordem,
      });

      setEtapaEmEdicao(null);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível atualizar a etapa.";
      setErroOperacao(mensagem);
      formEdicao.setError("ordem", { message: mensagem });
    } finally {
      setSalvandoEdicao(false);
    }
  });

  const handleRemoverSelecionados = async () => {
    if (etapasSelecionadas.length === 0) return;
    try {
      setErroOperacao(null);
      setRemovendo(true);
      const registros = etapas.filter((etapa) => etapasSelecionadas.includes(etapa.id));
      await deleteEtapas(registros);
      setEtapasSelecionadas([]);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível remover as etapas.";
      setErroOperacao(mensagem);
    } finally {
      setRemovendo(false);
    }
  };

  useEffect(() => {
    if (!obraSelecionada) return;
    const obra = obras.find((item) => item.id === obraSelecionada);
    const timer = window.setTimeout(() => {
      setFiltroObraEntrada(obra?.nome ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [obraSelecionada, obras]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Etapas</h1>
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
            disabled={!obraSelecionada}
          >
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </header>

      {etapasError || erroOperacao ? (
        <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {erroOperacao ?? etapasError}
        </div>
      ) : null}

      {mostrarFiltros ? (
        <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
          <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
            <FiltroSelect
              label="Obra"
              placeholder="Selecionar obra"
              options={obras.map((obra) => obra.nome)}
              value={filtroObraEntrada}
              onChange={setFiltroObraEntrada}
            />
            <FiltroSelect
              label="Etapa"
              placeholder="Filtrar etapa"
              options={nomesDisponiveis}
              value={filtroEtapaEntrada}
              onChange={setFiltroEtapaEntrada}
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

      {!obrasReady ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Carregando obras cadastradas...
        </div>
      ) : obras.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Cadastre uma obra para começar a lançar etapas.
        </div>
      ) : !obraSelecionada ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Selecione uma obra para visualizar ou adicionar etapas.
        </div>
      ) : carregandoEtapas ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Carregando etapas salvas...
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          {etapasSelecionadas.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)]/40 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {etapasSelecionadas.length} etapa(s) selecionada(s). Você pode remover em massa.
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                onClick={handleRemoverSelecionados}
                disabled={removendo || carregandoEtapas}
              >
                <Trash2 className="h-4 w-4" />
                {removendo ? "Removendo..." : "Remover selecionadas"}
              </Button>
            </div>
          ) : null}

          {etapasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhuma etapa encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#f5f7fb] text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        checked={todasSelecionadas}
                        onChange={() => {
                          if (todasSelecionadas) {
                            setEtapasSelecionadas((current) =>
                              current.filter((id) => !etapasFiltradas.some((etapa) => etapa.id === id)),
                            );
                          } else {
                            setEtapasSelecionadas((current) => {
                              const conjunto = new Set(current);
                              etapasFiltradas.forEach((etapa) => conjunto.add(etapa.id));
                              return Array.from(conjunto);
                            });
                          }
                        }}
                      />
                    </th>
                    <th className="w-20 px-4 py-3">
                      <span className="flex items-center gap-2">
                        Ordem
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Etapa
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Obra
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
                  {etapasPaginadas.map((etapa) => {
                    const obra = obras.find((obraItem) => obraItem.id === etapa.obraId);
                    return (
                      <tr
                        key={etapa.id}
                        className="cursor-pointer rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                        onClick={() => setEtapaEmEdicao(etapa)}
                      >
                        <td className="rounded-l-xl px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={etapasSelecionadas.includes(etapa.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              setEtapasSelecionadas((current) =>
                                current.includes(etapa.id)
                                  ? current.filter((id) => id !== etapa.id)
                                  : [...current, etapa.id],
                              );
                            }}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-foreground">
                          {etapa.ordem}
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-foreground">
                          {etapa.nome}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {obra ? obra.nome : "—"}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {new Date(etapa.criadoEm).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="rounded-r-xl px-4 py-4 align-top text-right">
                          <button
                            type="button"
                            className="text-[var(--accent)] transition hover:opacity-80"
                            aria-label="Editar etapa"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEtapaEmEdicao(etapa);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="ml-3 text-[var(--danger)] transition hover:opacity-80"
                            aria-label="Excluir etapa"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEtapaParaExcluir(etapa);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {etapasFiltradas.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl bg-surface/40 p-4 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {exibindoInicio} - {exibindoFim} de {etapasFiltradas.length} etapas
              </span>
              <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="unstyled"
            className="h-10 w-10 rounded-full border border-[var(--border)] bg-white text-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:text-[var(--accent)]"
            onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
            disabled={paginaAtual === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
                <span className="text-sm font-semibold text-foreground">
                  {paginaAtual} / {totalPaginas}
                </span>
          <Button
            type="button"
            variant="unstyled"
            className="h-10 w-10 rounded-full border border-[var(--border)] bg-white text-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:text-[var(--accent)]"
            onClick={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
            disabled={paginaAtual === totalPaginas}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-5 w-5" />
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
            formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", ordem: proximaOrdem });
          }}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                setMostrarFormNovo(false);
                formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", ordem: proximaOrdem });
              }}
              aria-label="Fechar formulário de etapa"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Adicionar etapa</h3>
            </header>
            <form className="space-y-4" onSubmit={onSubmitNovo}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Obra</span>
                  <select className="form-input" {...formNovo.register("obraId")}>
                    <option value="">{obraSelecionada ? "Usar obra selecionada" : "Selecione"}</option>
                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>
                        {obra.nome}
                      </option>
                    ))}
                  </select>
                  {formNovo.formState.errors.obraId ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.obraId.message}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Nome da etapa</span>
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
                  <span className="font-semibold text-foreground">Ordem</span>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    placeholder="1"
                    {...formNovo.register("ordem")}
                  />
                  {formNovo.formState.errors.ordem ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.ordem.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    setMostrarFormNovo(false);
                  formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", ordem: proximaOrdem });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={salvandoNovo || carregandoEtapas}
                >
                  {salvandoNovo ? "Salvando..." : "Salvar etapa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {etapaEmEdicao ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            setEtapaEmEdicao(null);
            formEdicao.reset();
          }}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                setEtapaEmEdicao(null);
                formEdicao.reset();
              }}
              aria-label="Fechar formulário de edição"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Editar etapa</h3>
            </header>
            <form className="space-y-4" onSubmit={onSubmitEdicao}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Nome da etapa</span>
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
                  <span className="font-semibold text-foreground">Ordem</span>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    placeholder="1"
                    {...formEdicao.register("ordem")}
                  />
                  {formEdicao.formState.errors.ordem ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formEdicao.formState.errors.ordem.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    setEtapaEmEdicao(null);
                    formEdicao.reset();
                  }}
                  disabled={salvandoEdicao}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={salvandoEdicao || carregandoEtapas}
                >
                  {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {etapaParaExcluir ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
          onClick={() => setEtapaParaExcluir(null)}
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
              Tem certeza de que deseja remover a etapa
              {" "}
              <span className="font-semibold text-foreground">{etapaParaExcluir.nome}</span>
              ? Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-sm font-semibold text-foreground"
                onClick={() => setEtapaParaExcluir(null)}
                disabled={removendo}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                disabled={removendo}
                onClick={async () => {
                  if (!etapaParaExcluir) return;
                  try {
                    setErroOperacao(null);
                    setRemovendo(true);
                    await deleteEtapas([etapaParaExcluir]);
                    setEtapasSelecionadas((current) =>
                      current.filter((id) => id !== etapaParaExcluir.id),
                    );
                    setEtapaParaExcluir(null);
                  } catch (error) {
                    const mensagem =
                      error instanceof Error
                        ? error.message
                        : "Não foi possível remover a etapa.";
                    setErroOperacao(mensagem);
                  } finally {
                    setRemovendo(false);
                  }
                }}
              >
                {removendo ? "Excluindo..." : "Sim, excluir"}
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
        {options
          .filter(Boolean)
          .map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
      </select>
    </label>
  );
}
