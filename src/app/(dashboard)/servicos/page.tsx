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
import { ColorPicker } from "@/components/ui/color-picker";
import { useObras } from "@/hooks/use-obras";
import { useServicos, type ServicoRegistro } from "@/hooks/use-servicos";

const servicoSchema = z.object({
  obraId: z.string().min(1, "Selecione a obra"),
  nome: z.string().min(2, "Informe o nome do serviço"),
  corHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Cor inválida. Use o formato #RRGGBB"),
});

const editSchema = z.object({
  nome: z.string().min(2, "Informe o nome do serviço"),
  corHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Cor inválida. Use o formato #RRGGBB"),
});

const agruparSchema = z.object({
  nome: z.string().min(2, "Informe o nome do serviço"),
  corHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Cor inválida. Use o formato #RRGGBB"),
});

type ServicoFormValues = z.infer<typeof servicoSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type AgruparFormValues = z.infer<typeof agruparSchema>;

export default function ServicosPage() {
  const { obras, isReady: obrasReady } = useObras();
  const [obraSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [servicoEmEdicao, setServicoEmEdicao] = useState<ServicoRegistro | null>(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState<ServicoRegistro | null>(null);
  const [mostrarAgrupar, setMostrarAgrupar] = useState(false);
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const servicosPorPagina = 20;
  const [novoFilhoAgrupamento, setNovoFilhoAgrupamento] = useState<string>("");

  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [processandoAgrupamento, setProcessandoAgrupamento] = useState(false);
  const [processandoFilho, setProcessandoFilho] = useState(false);
  const [removendoServicos, setRemovendoServicos] = useState(false);

  const {
    servicos,
    isReady: servicosReady,
    isLoading: servicosLoading,
    error: servicosError,
    nomesDisponiveis,
    createServico,
    updateServico,
    deleteServicos,
    createAgrupamento,
    addChildToGroup,
    removeChildFromGroup,
    ungroupServico,
  } = useServicos(obraSelecionada);

  const modalAberto = mostrarFormNovo || servicoEmEdicao !== null || servicoParaExcluir !== null;

  const [filtroServicoEntrada, setFiltroServicoEntrada] = useState("");
  const [filtroObraEntrada, setFiltroObraEntrada] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({ servico: "", obra: "" });

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
      setServicosSelecionados((prev) => prev.filter((id) => servicos.some((servico) => servico.id === id)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [servicos]);

  const formNovo = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      obraId: "",
      nome: "",
      corHex: "#2563EB",
    },
  });

  const formEdicao = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nome: "",
      corHex: "#2563EB",
    },
  });

  const formAgrupar = useForm<AgruparFormValues>({
    resolver: zodResolver(agruparSchema),
    defaultValues: {
      nome: "",
      corHex: "#2563EB",
    },
  });

  useEffect(() => {
    if (mostrarFormNovo) {
      formNovo.setValue("obraId", obraSelecionada ?? "");
      if (!formNovo.getValues("corHex")) {
        formNovo.setValue("corHex", "#2563EB");
      }
    }
  }, [mostrarFormNovo, obraSelecionada, formNovo]);

  useEffect(() => {
    if (servicoEmEdicao) {
      formEdicao.reset({
        nome: servicoEmEdicao.nome,
        corHex: servicoEmEdicao.corHex,
      });
    }
  }, [servicoEmEdicao, formEdicao]);

  useEffect(() => {
    if (servicoEmEdicao?.filhos?.length) {
      setNovoFilhoAgrupamento("");
    }
  }, [servicoEmEdicao]);

  useEffect(() => {
    if (!servicoEmEdicao) return;
    const atualizado = servicos.find((servico) => servico.id === servicoEmEdicao.id);
    if (!atualizado) {
      setServicoEmEdicao(null);
      return;
    }
    const filhosAtual = atualizado.filhos?.length ?? 0;
    const filhosAnterior = servicoEmEdicao.filhos?.length ?? 0;
    if (
      atualizado !== servicoEmEdicao &&
      (atualizado.nome !== servicoEmEdicao.nome ||
        atualizado.corHex !== servicoEmEdicao.corHex ||
        filhosAtual !== filhosAnterior)
    ) {
      setServicoEmEdicao(atualizado);
    }
  }, [servicos, servicoEmEdicao]);

  useEffect(() => {
    if (!mostrarAgrupar) return;
    const selecionados = servicos.filter((servico) => servicosSelecionados.includes(servico.id));
    if (selecionados.length === 0) return;
    const cores = selecionados.map((servico) => servico.corHex);
    const corPadrao = cores[0] ?? "#2563EB";
    formAgrupar.reset({ nome: "", corHex: corPadrao });
  }, [mostrarAgrupar, servicosSelecionados, servicos, formAgrupar]);

  const normalizar = (valor: string) => valor.trim().toLowerCase();

  const servicosFiltrados = useMemo(() => {
    return servicos.filter((servico) => {
      if (filtrosAplicados.servico) {
        if (normalizar(servico.nome) !== normalizar(filtrosAplicados.servico)) {
          return false;
        }
      }
      if (filtrosAplicados.obra) {
        const obra = obras.find((obraItem) => obraItem.id === servico.obraId);
        if (!obra || normalizar(obra.nome) !== normalizar(filtrosAplicados.obra)) {
          return false;
        }
      }
      return true;
    });
  }, [servicos, filtrosAplicados, obras]);

  const totalPaginas = Math.max(1, Math.ceil(servicosFiltrados.length / servicosPorPagina) || 1);
  const inicioIndice = (paginaAtual - 1) * servicosPorPagina;
  const servicosPaginados = useMemo(
    () => servicosFiltrados.slice(inicioIndice, inicioIndice + servicosPorPagina),
    [servicosFiltrados, inicioIndice],
  );
  const exibindoInicio = servicosFiltrados.length === 0 ? 0 : inicioIndice + 1;
  const exibindoFim = Math.min(inicioIndice + servicosPorPagina, servicosFiltrados.length);

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
    if (servicosFiltrados.length === 0) return false;
    return servicosFiltrados.every((servico) => servicosSelecionados.includes(servico.id));
  }, [servicosFiltrados, servicosSelecionados]);

  const podeAgrupar = useMemo(() => {
    if (servicosSelecionados.length < 2) return false;
    const selecionados = servicos.filter((servico) => servicosSelecionados.includes(servico.id));
    if (selecionados.length < 2) return false;
    if (selecionados.some((servico) => servico.filhos && servico.filhos.length > 0)) return false;
    const obraIds = new Set(selecionados.map((servico) => servico.obraId));
    return obraIds.size === 1;
  }, [servicosSelecionados, servicos]);

  const onSubmitNovo = formNovo.handleSubmit(async (values) => {
    if (!values.obraId) {
      formNovo.setError("obraId", { message: "Selecione a obra." });
      return;
    }
    try {
      setErroOperacao(null);
      setSalvandoNovo(true);
      await createServico({
        obraId: values.obraId,
        nome: values.nome.trim(),
        corHex: values.corHex,
      });
      setMostrarFormNovo(false);
      formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", corHex: "#2563EB" });
      setPaginaAtual(1);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível salvar o serviço.";
      setErroOperacao(mensagem);
      formNovo.setError("nome", { message: mensagem });
    } finally {
      setSalvandoNovo(false);
    }
  });

  const onSubmitEdicao = formEdicao.handleSubmit(async (values) => {
    if (!servicoEmEdicao) return;
    try {
      setErroOperacao(null);
      setSalvandoEdicao(true);
      await updateServico({
        id: servicoEmEdicao.id,
        nome: values.nome.trim(),
        corHex: values.corHex,
      });
      setServicoEmEdicao(null);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível atualizar o serviço.";
      setErroOperacao(mensagem);
      formEdicao.setError("nome", { message: mensagem });
    } finally {
      setSalvandoEdicao(false);
    }
  });

  const handleRemoverSelecionados = async () => {
    if (servicosSelecionados.length === 0) return;
    try {
      setErroOperacao(null);
      setRemovendoServicos(true);
      await deleteServicos(servicosSelecionados);
      setServicosSelecionados([]);
      if (servicoEmEdicao && servicosSelecionados.includes(servicoEmEdicao.id)) {
        setServicoEmEdicao(null);
      }
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível remover os serviços.";
      setErroOperacao(mensagem);
    } finally {
      setRemovendoServicos(false);
    }
  };

  const handleAdicionarFilhoAoAgrupamento = async () => {
    if (!servicoEmEdicao?.filhos?.length) return;
    if (!novoFilhoAgrupamento) return;
    const servicoAdicionar = servicos.find((servico) => servico.id === novoFilhoAgrupamento);
    if (!servicoAdicionar || (servicoAdicionar.filhos && servicoAdicionar.filhos.length > 0)) return;

    try {
      setErroOperacao(null);
      setProcessandoFilho(true);
      await addChildToGroup({
        servicoId: servicoAdicionar.id,
        agrupamentoId: servicoEmEdicao.id,
        obraId: servicoEmEdicao.obraId,
      });
      setServicosSelecionados((current) => {
        const conjunto = new Set(current);
        conjunto.delete(servicoAdicionar.id);
        conjunto.add(servicoEmEdicao.id);
        return Array.from(conjunto);
      });
      setNovoFilhoAgrupamento("");
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar o serviço ao agrupamento.";
      setErroOperacao(mensagem);
    } finally {
      setProcessandoFilho(false);
    }
  };

  const handleRemoverFilhoDoAgrupamento = async (childId: string) => {
    if (!servicoEmEdicao?.filhos?.length) return;
    const filhoData = servicoEmEdicao.filhos.find((filho) => filho.id === childId);
    if (!filhoData) return;
    const ultimoFilho = servicoEmEdicao.filhos.length === 1;

    try {
      setErroOperacao(null);
      setProcessandoFilho(true);
      await removeChildFromGroup({ servicoId: childId, obraId: servicoEmEdicao.obraId });

      setServicosSelecionados((current) => {
        const semFilho = current.filter((id) => id !== childId);
        return ultimoFilho ? semFilho.filter((id) => id !== servicoEmEdicao.id) : semFilho;
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível remover o serviço do agrupamento.";
      setErroOperacao(mensagem);
    } finally {
      setProcessandoFilho(false);
    }
  };

  const handleDesagruparServico = async () => {
    if (!servicoEmEdicao?.filhos?.length) return;
    try {
      setErroOperacao(null);
      setProcessandoAgrupamento(true);
      await ungroupServico({ servicoId: servicoEmEdicao.id, obraId: servicoEmEdicao.obraId });
      setServicoEmEdicao(null);
      setServicosSelecionados([]);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível desagrupar o serviço.";
      setErroOperacao(mensagem);
    } finally {
      setProcessandoAgrupamento(false);
    }
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados({ servico: filtroServicoEntrada, obra: filtroObraEntrada });
  };

  const obraAgrupamento = useMemo(() => {
    if (!podeAgrupar) return null;
    const selecionados = servicos.filter((servico) => servicosSelecionados.includes(servico.id));
    return selecionados[0]?.obraId ?? null;
  }, [podeAgrupar, servicosSelecionados, servicos]);

  const agrupadosSelecionados = useMemo(
    () =>
      servicos
        .filter((servico) => servicosSelecionados.includes(servico.id))
        .filter((servico) => !servico.filhos || servico.filhos.length === 0),
    [servicos, servicosSelecionados],
  );

  const servicosDisponiveisParaAgrupar = useMemo(() => {
    if (!servicoEmEdicao?.filhos?.length) return [];
    const filhosIds = new Set(servicoEmEdicao.filhos.map((filho) => filho.id));
    return servicos.filter(
      (servico) =>
        servico.obraId === servicoEmEdicao.obraId &&
        (!servico.filhos || servico.filhos.length === 0) &&
        servico.id !== servicoEmEdicao.id &&
        !filhosIds.has(servico.id),
    );
  }, [servicoEmEdicao, servicos]);

  const onSubmitAgrupar = formAgrupar.handleSubmit(async (values) => {
    if (!podeAgrupar || !obraAgrupamento) return;
    const selecionados = servicos.filter(
      (servico) =>
        servicosSelecionados.includes(servico.id) && !(servico.filhos && servico.filhos.length > 0),
    );
    if (selecionados.length === 0) return;

    try {
      setErroOperacao(null);
      setProcessandoAgrupamento(true);
      const novoId = await createAgrupamento({
        obraId: obraAgrupamento,
        nome: values.nome.trim(),
        corHex: values.corHex,
      });

      await Promise.all(
        selecionados.map((servico) =>
          addChildToGroup({
            servicoId: servico.id,
            agrupamentoId: novoId,
            obraId: obraAgrupamento,
          }),
        ),
      );

      setServicosSelecionados([novoId]);
      setMostrarAgrupar(false);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível criar o agrupamento.";
      setErroOperacao(mensagem);
      formAgrupar.setError("nome", { message: mensagem });
    } finally {
      setProcessandoAgrupamento(false);
    }
  });

  return (
    <section className="space-y-6">
      {servicosError || erroOperacao ? (
        <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {erroOperacao ?? servicosError}
        </div>
      ) : null}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Serviços</h1>
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

      {mostrarFiltros ? (
        <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
          <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
            <FiltroSelect
              label="Serviços"
              placeholder="Filtrar serviço"
              options={nomesDisponiveis}
              value={filtroServicoEntrada}
              onChange={setFiltroServicoEntrada}
            />
            <FiltroSelect
              label="Obras"
              placeholder="Selecionar obra"
              options={obras.map((obra) => obra.nome)}
              value={filtroObraEntrada}
              onChange={setFiltroObraEntrada}
            />
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="unstyled"
                className="mt-6 flex items-center justify-center rounded-full bg-white px-3 py-2 text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
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
          Cadastre uma obra para começar a cadastrar serviços.
        </div>
      ) : !obraSelecionada ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Selecione uma obra para visualizar ou adicionar serviços.
        </div>
      ) : !servicosReady ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Carregando serviços salvos...
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          {servicosSelecionados.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)]/40 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {servicosSelecionados.length} serviço(s) selecionado(s). Você pode remover em massa.
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={handleRemoverSelecionados}
                  disabled={removendoServicos}
                >
                  <Trash2 className="h-4 w-4" />
                  {removendoServicos ? "Removendo..." : "Remover selecionados"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[var(--accent)] px-4 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setMostrarAgrupar(true)}
                  disabled={!podeAgrupar}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Agrupar selecionados
                </Button>
              </div>
            </div>
          ) : null}

          {servicos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhum serviço cadastrado ainda. Clique no botão Adicionar para incluir o primeiro.
            </div>
          ) : servicosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhum serviço encontrado com os filtros aplicados.
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
                            setServicosSelecionados((current) =>
                              current.filter((id) => !servicosFiltrados.some((servico) => servico.id === id)),
                            );
                          } else {
                            setServicosSelecionados((current) => {
                              const conjunto = new Set(current);
                              servicosFiltrados.forEach((servico) => conjunto.add(servico.id));
                              return Array.from(conjunto);
                            });
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Serviço
                        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                      </span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        Cor
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
                  {servicosPaginados.map((servico) => {
                    const obra = obras.find((obraAtual) => obraAtual.id === servico.obraId);
                    return (
                      <tr
                        key={servico.id}
                        className="cursor-pointer rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                        onClick={() => setServicoEmEdicao(servico)}
                      >
                        <td className="rounded-l-xl px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={servicosSelecionados.includes(servico.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              setServicosSelecionados((current) =>
                                current.includes(servico.id)
                                  ? current.filter((id) => id !== servico.id)
                                  : [...current, servico.id],
                              );
                            }}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          <div className="space-y-1">
                            <span className="block text-sm font-semibold text-foreground">{servico.nome}</span>
                            {servico.filhos?.length ? (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-muted)] px-2 py-1 font-semibold text-[var(--accent)]">
                                  Agrupado
                                </span>
                                <span className="font-semibold text-foreground">•</span>
                                <span>Agrupa:</span>
                                <span className="flex flex-wrap items-center gap-1">
                                  {servico.filhos.map((filho) => (
                                    <span
                                      key={filho.id}
                                      className="rounded-full bg-surface px-2 py-0.5 font-medium text-foreground"
                                    >
                                      {filho.nome}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)]"
                            style={{ backgroundColor: servico.corHex }}
                            aria-label={`Cor do serviço ${servico.nome}`}
                          />
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {obra ? obra.nome : "—"}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-foreground">
                          {new Date(servico.criadoEm).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="rounded-r-xl px-4 py-4 align-top text-right">
                          <button
                            type="button"
                            className="text-[var(--accent)] transition hover:opacity-80"
                            aria-label="Editar serviço"
                            onClick={(event) => {
                              event.stopPropagation();
                              setServicoEmEdicao(servico);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="ml-3 text-[var(--danger)] transition hover:opacity-80"
                            aria-label="Excluir serviço"
                            onClick={(event) => {
                              event.stopPropagation();
                              setServicoParaExcluir(servico);
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

          {servicosFiltrados.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl bg-surface/40 p-4 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {exibindoInicio} - {exibindoFim} de {servicosFiltrados.length} serviços
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
            formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", corHex: "#2563EB" });
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
                formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", corHex: "#2563EB" });
                setMostrarFormNovo(false);
              }}
              aria-label="Fechar formulário de serviço"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Adicionar Serviço</h3>
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
                  <span className="font-semibold text-foreground">Serviço</span>
                  <input
                    className="form-input"
                    placeholder="Nome do serviço"
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
                <span className="text-xs font-semibold text-foreground-muted">Cor</span>
                <div className="mt-2 rounded-xl border border-[var(--border)] bg-surface/60 p-4">
                  <ColorPicker
                    value={formNovo.watch("corHex")}
                    onChange={(color) => formNovo.setValue("corHex", color, { shouldDirty: true })}
                    label=""
                  />
                  {formNovo.formState.errors.corHex ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formNovo.formState.errors.corHex.message}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    formNovo.reset({ obraId: obraSelecionada ?? "", nome: "", corHex: "#2563EB" });
                    setMostrarFormNovo(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={salvandoNovo || servicosLoading}
                >
                  {salvandoNovo ? "Salvando..." : "Salvar serviço"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {servicoEmEdicao ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            setServicoEmEdicao(null);
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
                setServicoEmEdicao(null);
                formEdicao.reset();
              }}
              aria-label="Fechar formulário de edição"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Editar Serviço</h3>
            </header>
            <form className="space-y-6" onSubmit={onSubmitEdicao}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Serviço</span>
                  <input
                    className="form-input"
                    placeholder="Nome do serviço"
                    {...formEdicao.register("nome")}
                  />
                  {formEdicao.formState.errors.nome ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formEdicao.formState.errors.nome.message}
                    </span>
                  ) : null}
                </label>
                <div className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Cor</span>
                  <div className="rounded-xl border border-[var(--border)] bg-surface/60 p-4">
                    <ColorPicker
                      value={formEdicao.watch("corHex")}
                      onChange={(color) => formEdicao.setValue("corHex", color, { shouldDirty: true })}
                      label=""
                    />
                    {formEdicao.formState.errors.corHex ? (
                      <span className="text-xs font-semibold text-[var(--danger)]">
                        {formEdicao.formState.errors.corHex.message}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              {servicoEmEdicao?.filhos?.length ? (
                <div className="space-y-3 rounded-xl border border-[var(--border)] bg-surface/60 p-4">
                  <div className="flex flex-col gap-2 text-xs text-foreground-muted">
                    <span className="text-sm font-semibold text-foreground">Serviços agrupados</span>
                    <span className="text-xs text-foreground-muted">
                      Remova um serviço para trazê-lo de volta à lista principal ou adicione novos serviços da mesma obra.
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {servicoEmEdicao.filhos.map((filho) => (
                      <li
                        key={filho.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2"
                      >
                        <span>{filho.nome}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--danger)] px-3 py-1 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)]/10 disabled:opacity-60"
                          onClick={() => handleRemoverFilhoDoAgrupamento(filho.id)}
                          disabled={processandoFilho}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 text-xs text-foreground-muted">
                    <span className="font-semibold text-foreground">Adicionar serviço ao agrupamento</span>
                    {servicosDisponiveisParaAgrupar.length > 0 ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          className="form-input sm:w-64"
                          value={novoFilhoAgrupamento}
                          onChange={(event) => setNovoFilhoAgrupamento(event.target.value)}
                          disabled={processandoFilho}
                        >
                          <option value="">Selecione um serviço</option>
                          {servicosDisponiveisParaAgrupar.map((servico) => (
                            <option key={servico.id} value={servico.id}>
                              {servico.nome}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full px-4"
                          onClick={handleAdicionarFilhoAoAgrupamento}
                          disabled={!novoFilhoAgrupamento || processandoFilho}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Adicionar ao agrupamento
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-muted">
                        Nenhum outro serviço disponível para agrupar.
                      </span>
                    )}
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full px-4 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-60"
                      onClick={handleDesagruparServico}
                      disabled={processandoAgrupamento}
                    >
                      Desagrupar serviços
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => {
                    setServicoEmEdicao(null);
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

      {servicoParaExcluir ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
          onClick={() => setServicoParaExcluir(null)}
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
              Tem certeza de que deseja remover o serviço
              {" "}
              <span className="font-semibold text-foreground">{servicoParaExcluir.nome}</span>
              ? Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-sm font-semibold text-foreground"
                onClick={() => setServicoParaExcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                disabled={removendoServicos}
                onClick={async () => {
                  try {
                    setErroOperacao(null);
                    setRemovendoServicos(true);
                    await deleteServicos([servicoParaExcluir.id]);
                    setServicosSelecionados((current) => current.filter((id) => id !== servicoParaExcluir.id));
                    setServicoParaExcluir(null);
                  } catch (error) {
                    const mensagem =
                      error instanceof Error ? error.message : "Não foi possível remover o serviço.";
                    setErroOperacao(mensagem);
                  } finally {
                    setRemovendoServicos(false);
                  }
                }}
              >
                {removendoServicos ? "Excluindo..." : "Sim, excluir"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {mostrarAgrupar && obraAgrupamento ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/45 px-4"
          onClick={() => setMostrarAgrupar(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => setMostrarAgrupar(false)}
              aria-label="Fechar modal de agrupamento"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Agrupar serviços</h3>
              <p className="text-sm text-foreground-muted">
                {agrupadosSelecionados.length} serviço(s) serão combinados em um novo serviço desta obra.
              </p>
            </header>
            <div className="mb-4 rounded-xl border border-[var(--border)] bg-surface/60 p-4 text-sm text-foreground-muted">
              <span className="font-semibold text-foreground">Serviços selecionados:</span>
              <ul className="mt-2 list-disc pl-5">
                {agrupadosSelecionados.map((servico) => (
                  <li key={servico.id}>{servico.nome}</li>
                ))}
              </ul>
            </div>
            <form className="space-y-6" onSubmit={onSubmitAgrupar}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Obra</span>
                  <div className="form-input flex h-12 items-center bg-[var(--surface-muted)] text-sm font-semibold text-foreground">
                    {obras.find((obra) => obra.id === obraAgrupamento)?.nome ?? "—"}
                  </div>
                </div>
                <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">Nome do novo serviço</span>
                  <input
                    className="form-input"
                    placeholder="Nome do serviço agrupado"
                    {...formAgrupar.register("nome")}
                  />
                  {formAgrupar.formState.errors.nome ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formAgrupar.formState.errors.nome.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground-muted">Cor</span>
                <div className="mt-2 rounded-xl border border-[var(--border)] bg-surface/60 p-4">
                  <ColorPicker
                    value={formAgrupar.watch("corHex")}
                    onChange={(color) => formAgrupar.setValue("corHex", color, { shouldDirty: true })}
                    label=""
                  />
                  {formAgrupar.formState.errors.corHex ? (
                    <span className="text-xs font-semibold text-[var(--danger)]">
                      {formAgrupar.formState.errors.corHex.message}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => setMostrarAgrupar(false)}
                  disabled={processandoAgrupamento}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={processandoAgrupamento}
                >
                  {processandoAgrupamento ? "Criando..." : "Criar serviço agrupado"}
                </Button>
              </div>
            </form>
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

