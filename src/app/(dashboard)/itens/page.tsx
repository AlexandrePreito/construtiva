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
  descricao: z.string().max(200).default(""),
});

const editSchema = z.object({
  nome: z.string().min(2, "Informe o nome do item"),
  descricao: z.string().max(200).default(""),
});

type ItemFormValues = z.input<typeof itemSchema>;
type EditFormValues = z.input<typeof editSchema>;

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
                            setItensSelecionados((current్