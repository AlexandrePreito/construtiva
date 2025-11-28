"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useItens, type ItemRegistro } from "@/hooks/use-itens";

const itemSchema = z.object({
  obraId: z.string().min(1, "Selecione a obra"),
  nome: z.string().min(2, "Informe o nome do item"),
  descricao: z.string().max(200).optional(),
});

const editSchema = z.object({
  nome: z.string().min(2, "Informe o nome do item"),
  descricao: z.string().max(200).optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;
type EditFormValues = z.infer<typeof editSchema>;

export default function ItensPage() {
  const { obras, isReady: obrasReady } = useObras();
  const [obraSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemRegistro | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemRegistro | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [removendoItens, setRemovendoItens] = useState(false);

  const {
    itens,
    isReady: itensReady,
    isLoading: itensLoading,
    error: itensError,
    nomesDisponiveis,
    createItem,
    updateItem,
    deleteItens,
  } = useItens(obraSelecionada);
  const modalAberto = mostrarFormNovo || itemEmEdicao !== null || itemParaExcluir !== null;

  const [filtroItem, setFiltroItem] = useState("");
  const [filtroObra, setFiltroObra] = useState("");

  useEffect(() => {
    if (obrasReady && obras.length > 0 && !obraSelecionada) {
      const timer = window.setTimeout(() => {
        setObraSelecionada(obras[0].id);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [obrasReady, obras, obraSelecionada]);

  useEffect(() => {
    if (modalAberto) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAberto]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItensSelecionados((prev) => prev.filter((id) => itens.some((item) => item.id === id)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [itens]);

  const formNovo = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      obraId: "",
      nome: "",
      descricao: "",
    },
  });

  useEffect(() => {
    if (mostrarFormNovo) {
      formNovo.setValue("obraId", obraSelecionada ?? "");
    }
  }, [mostrarFormNovo, obraSelecionada, formNovo]);

  const formEdicao = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nome: "",
      descricao: "",
    },
  });

  useEffect(() => {
    if (itemEmEdicao) {
      formEdicao.reset({
        nome: itemEmEdicao.nome,
        descricao: itemEmEdicao.descricao,
      });
    }
  }, [itemEmEdicao, formEdicao]);

  const normalizar = (valor: string) => valor.trim().toLowerCase();

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      if (filtroItem && normalizar(item.nome) !== normalizar(filtroItem)) {
        return false;
      }
      if (filtroObra) {
        const obra = obras.find((obra) => obra.id === item.obraId);
        if (!obra || normalizar(obra.nome) !== normalizar(filtroObra)) return false;
      }
      return true;
    });
  }, [itens, filtroItem, filtroObra, obras]);

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina) || 1);
  const inicioIndice = (paginaAtual - 1) * itensPorPagina;
  const itensPaginados = useMemo(
    () => itensFiltrados.slice(inicioIndice, inicioIndice + itensPorPagina),
    [itensFiltrados, inicioIndice],
  );
  const exibindoInicio = itensFiltrados.length === 0 ? 0 : inicioIndice + 1;
  const exibindoFim = Math.min(inicioIndice + itensPorPagina, itensFiltrados.length);

  useEffect(() => {
    if (paginaAtual <= totalPaginas) return;
    const timer = window.setTimeout(() => {
      setPaginaAtual(totalPaginas);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [paginaAtual, totalPaginas]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPaginaAtual(1), 0);
    return () => window.clearTimeout(timer);
  }, [filtroItem, filtroObra, obraSelecionada]);

  const todasSelecionadas = useMemo(() => {
    if (itensFiltrados.length === 0) return false;
    return itensFiltrados.every((item) => itensSelecionados.includes(item.id));
  }, [itensFiltrados, itensSelecionados]);

  const onSubmitNovo = formNovo.handleSubmit(async (values) => {
    if (!values.obraId) {
      formNovo.setError("obraId", { message: "Selecione a obra." });
      return;
    }
    try {
      setErroOperacao(null);
      setSalvandoNovo(true);
      await createItem({
        obraId: values.obraId,
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() ?? "",
      });
      setMostrarFormNovo(false);
      formNovo.reset();
      setPaginaAtual(1);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível salvar o item.";
      setErroOperacao(mensagem);
      formNovo.setError("nome", { message: mensagem });
    } finally {
      setSalvandoNovo(false);
    }
  });

  const onSubmitEdicao = formEdicao.handleSubmit(async (values) => {
    if (!itemEmEdicao) return;
    try {
      setErroOperacao(null);
      setSalvandoEdicao(true);
      await updateItem({
        id: itemEmEdicao.id,
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() ?? "",
      });
      setItemEmEdicao(null);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível atualizar o item.";
      setErroOperacao(mensagem);
      formEdicao.setError("nome", { message: mensagem });
    } finally {
      setSalvandoEdicao(false);
    }
  });

  const handleRemoverSelecionados = async () => {
    if (itensSelecionados.length === 0) return;
    try {
      setErroOperacao(null);
      setRemovendoItens(true);
      await deleteItens(itensSelecionados);
      setItensSelecionados([]);
      if (itemEmEdicao && itensSelecionados.includes(itemEmEdicao.id)) {
        setItemEmEdicao(null);
      }
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível remover os itens.";
      setErroOperacao(mensagem);
    } finally {
      setRemovendoItens(false);
    }
  };

  const limparFiltros = () => {
    setFiltroItem("");
    setFiltroObra("");
  };

  const downloadRef = useRef<HTMLButtonElement | null>(null);

  return (
    <section className="space-y-6">
      {itensError || erroOperacao ? (
        <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {erroOperacao ?? itensError}
        </div>
      ) : null}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Itens</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            ref={downloadRef}
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

      {mostrarFiltros ? (
        <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
          <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
            <FiltroSelect
              label="Itens"
              placeholder="Filtrar item"
              options={nomesDisponiveis}
              value={filtroItem}
              onChange={setFiltroItem}
            />
            <FiltroSelect
              label="Obras"
              placeholder="Selecionar obra"
              options={obras.map((obra) => obra.nome)}
              value={filtroObra}
              onChange={setFiltroObra}
            />
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="unstyled"
                className="mt-6 flex items-center justify-center rounded-full bg-white px-3 py-2 text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
                aria-label="Aplicar filtros"
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
          Cadastre uma obra para começar a lançar itens.
        </div>
      ) : !obraSelecionada ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Selecione uma obra para visualizar ou adicionar itens.
        </div>
      ) : !itensReady ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Carregando itens salvos...
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          {itensSelecionados.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)]/40 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {itensSelecionados.length} item(ns) selecionado(s). Você pode remover em massa.
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                onClick={handleRemoverSelecionados}
                  disabled={removendoItens}
              >
                <Trash2 className="h-4 w-4" />
                  {removendoItens ? "Removendo..." : "Remover selecionados"}
              </Button>
            </div>
          ) : null}

          {itens.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhum item cadastrado ainda. Clique no botão Adicionar para incluir o primeiro.
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhum item encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#f5f7fb] text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        checked={todasSelecionadas}
                        onChange={() => {
                          if (todasSelecionadas) {
                            setItensSelecionados((current) =>
                              current.filter((id) => !itensFiltrados.some((item) => item.id === id)),
                            );
                          } else {
                            setItensSelecionados((current) => {
                              const conjunto = new Set(current);
                              itensFiltrados.forEach((item) => conjunto.add(item.id));
                              return Array.from(conjunto);
                            });
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Item
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Descrição
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
                        Criado em
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPaginados.map((item) => {
                    const obra = obras.find((obraAtual) => obraAtual.id === item.obraId);
                    return (
                      <tr
                        key={item.id}
                        className="cursor-pointer rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                        onClick={() => setItemEmEdicao(item)}
                      >
                        <td className="rounded-l-xl px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={itensSelecionados.includes(item.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              setItensSelecionados((current) =>
                                current.includes(item.id)
                                  ? current.filter((id) => id !== item.id)
                                  : [...current, item.id],
                              );
                            }}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">{item.nome || "—"}</td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {item.descricao ? item.descricao : "—"}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {obra ? obra.nome : "—"}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="rounded-r-xl px-4 py-4 align-top text-right">
                          <button
                            type="button"
                            className="text-[var(--accent)] transition hover:opacity-80"
                            aria-label="Editar item"
                            onClick={(event) => {
                              event.stopPropagation();
                              setItemEmEdicao(item);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="ml-3 text-[var(--danger)] transition hover:opacity-80"
                            aria-label="Excluir item"
                            onClick={(event) => {
                              event.stopPropagation();
                              setItemParaExcluir(item);
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

          {itensFiltrados.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl bg-surface/40 p-4 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {exibindoInicio} - {exibindoFim} de {itensFiltrados.length} itens
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
                  onClick={() =>
                    setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
                  }
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
            formNovo.reset();
            setMostrarFormNovo(false);
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
                formNovo.reset();
                setMostrarFormNovo(false);
              }}
              aria-label="Fechar formulário de item"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Adicionar Item</h3>
            </header>
            <form className="space-y-6" onSubmit={onSubmitNovo}>
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
                  <span className="font-semibold text-foreground">Item</span>
                  <input
                    className="form-input"
                    placeholder="Nome do item"
                    {...formNovo.register("nome")}
                  />
                  {formNovo.formState.errors.nome ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.nome.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Descrição</span>
                  <textarea
                    className="form-input h-24 resize-none"
                    placeholder="Detalhes, escopo ou observações do item"
                    {...formNovo.register("descricao")}
                  />
                  {formNovo.formState.errors.descricao ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.descricao.message}
                    </span>
                  ) : null}
                </label>
              </div>
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
                  disabled={salvandoNovo || itensLoading}
                >
                  {salvandoNovo ? "Salvando..." : "Salvar item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {itemEmEdicao ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            setItemEmEdicao(null);
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
                setItemEmEdicao(null);
                formEdicao.reset();
              }}
              aria-label="Fechar formulário de edição"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Editar Item</h3>
            </header>
            <form className="space-y-6" onSubmit={onSubmitEdicao}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Item</span>
                  <input
                    className="form-input"
                    placeholder="Nome do item"
                    {...formEdicao.register("nome")}
                  />
                  {formEdicao.formState.errors.nome ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formEdicao.formState.errors.nome.message}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Descrição</span>
                  <textarea
                    className="form-input h-24 resize-none"
                    placeholder="Detalhes, escopo ou observações do item"
                    {...formEdicao.register("descricao")}
                  />
                  {formEdicao.formState.errors.descricao ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formEdicao.formState.errors.descricao.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    setItemEmEdicao(null);
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
                  disabled={salvandoEdicao}
                >
                  {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {itemParaExcluir ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
          onClick={() => setItemParaExcluir(null)}
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
              Tem certeza de que deseja remover o item
              {" "}
              <span className="font-semibold text-foreground">
                {itemParaExcluir.nome}
              </span>
              ? Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-sm font-semibold text-foreground"
                onClick={() => setItemParaExcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                disabled={removendoItens}
                onClick={async () => {
                  try {
                    setErroOperacao(null);
                    setRemovendoItens(true);
                    await deleteItens([itemParaExcluir.id]);
                    setItensSelecionados((current) =>
                      current.filter((id) => id !== itemParaExcluir.id),
                    );
                    setItemParaExcluir(null);
                  } catch (error) {
                    const mensagem =
                      error instanceof Error
                        ? error.message
                        : "Não foi possível remover o item.";
                    setErroOperacao(mensagem);
                  } finally {
                    setRemovendoItens(false);
                  }
                }}
              >
                {removendoItens ? "Excluindo..." : "Sim, excluir"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <datalist id="itens-disponiveis">
        {nomesDisponiveis.map((nome) => (
          <option key={nome} value={nome} />
        ))}
      </datalist>
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
