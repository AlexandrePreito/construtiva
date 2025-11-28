"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ChangeEvent } from "react";
import clsx from "clsx";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Filter,
  UploadCloud,
  Download,
  Trash2,
  X,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObras } from "@/hooks/use-obras";
import { useCronograma } from "@/hooks/use-cronograma";
import { useItens } from "@/hooks/use-itens";
import { useServicos } from "@/hooks/use-servicos";
import { useEtapas } from "@/hooks/use-etapas";
import { parseCronogramaFile } from "@/lib/importers/cronograma";
import type { CronogramaLinha } from "@/hooks/use-cronograma";

const SERVICO_COLOR_PALETTE = [
  "#2563EB",
  "#F97316",
  "#10B981",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F59E0B",
  "#EF4444",
  "#22D3EE",
  "#6366F1",
];

function getNextServicoColor(existingColors: string[]) {
  const usados = existingColors.map((cor) => cor.toLowerCase());
  for (const cor of SERVICO_COLOR_PALETTE) {
    if (!usados.includes(cor.toLowerCase())) {
      return cor;
    }
  }
  return SERVICO_COLOR_PALETTE[existingColors.length % SERVICO_COLOR_PALETTE.length];
}

function isUniqueOrderConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as {
    code?: string;
    details?: string | null;
    message?: string;
  };
  if (maybe.code === "23505") return true;
  if (typeof maybe.details === "string" && maybe.details.includes("duplicate key value")) return true;
  if (typeof maybe.message === "string" && maybe.message.includes("duplicate key value")) return true;
  return false;
}

const modeloCronograma: Array<{
  item: string;
  servico: string;
  etapa: string;
  dataInicio: string;
  dataFim: string;
}> = [
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "Térreo",
    dataInicio: "2025-07-04",
    dataFim: "2025-07-31",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "1º PAV",
    dataInicio: "2025-08-04",
    dataFim: "2025-08-18",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "2º PAV",
    dataInicio: "2025-08-19",
    dataFim: "2025-08-29",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "3º PAVIMENTO",
    dataInicio: "2025-09-01",
    dataFim: "2025-09-10",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "4º PAVIMENTO",
    dataInicio: "2025-09-11",
    dataFim: "2025-09-19",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "5º PAVIMENTO",
    dataInicio: "2025-09-22",
    dataFim: "2025-09-29",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "6º PAVIMENTO",
    dataInicio: "2025-09-30",
    dataFim: "2025-10-08",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "7º PAVIMENTO",
    dataInicio: "2025-10-09",
    dataFim: "2025-10-17",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "8º PAVIMENTO",
    dataInicio: "2025-10-20",
    dataFim: "2025-10-29",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "9º PAVIMENTO",
    dataInicio: "2025-10-30",
    dataFim: "2025-11-07",
  },
  {
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "10º PAVIMENTO",
    dataInicio: "2025-11-10",
    dataFim: "2025-11-18",
  },
];

export default function CronogramaCentralPage() {
  const { obras, isReady: obrasReady } = useObras();
  const [obraSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<CronogramaLinha | null>(
    null,
  );
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [linhaParaExcluir, setLinhaParaExcluir] = useState<CronogramaLinha | null>(null);
  const [mostrarModalImportacao, setMostrarModalImportacao] = useState(false);
  const [obraImportacaoId, setObraImportacaoId] = useState<string>("");
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const [salvandoLinhaManual, setSalvandoLinhaManual] = useState(false);
  const [salvandoLinhaEdicao, setSalvandoLinhaEdicao] = useState(false);
  const [removendoLinhasSelecionadas, setRemovendoLinhasSelecionadas] = useState(false);

  const {
    linhas,
    isReady: cronogramaReady,
    error: cronogramaError,
    replaceLinhas,
    addLinha,
    updateLinha,
    removeLinhas,
  } = useCronograma(obraSelecionada);
  const { itens, createItem } = useItens(obraSelecionada);
  const { servicos, createServico } = useServicos(obraSelecionada);
  const { etapas: etapasCadastradas, createEtapa } = useEtapas(obraSelecionada);
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<string[]>([]);
  const [filtroItem, setFiltroItem] = useState("");
  const [filtroServico, setFiltroServico] = useState<string[]>([]);
  const [filtroEtapa, setFiltroEtapa] = useState<string[]>([]);
  const [filtroDataInicial, setFiltroDataInicial] = useState<string>("");
  const [filtroDataFinal, setFiltroDataFinal] = useState<string>("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    item: "",
    servicos: [] as string[],
    etapas: [] as string[],
    dataInicial: "",
    dataFinal: "",
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const linhasPorPagina = 20;
  const normalizar = useCallback((valor: string) => valor.trim().toLowerCase(), []);
  const itensDisponiveis = useMemo(
    () =>
      itens
        .map((item) => item.nome)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
    [itens],
  );
  const servicosDisponiveis = useMemo(
    () =>
      servicos
        .map((servico) => servico.nome)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
    [servicos],
  );
  const etapasDisponiveis = useMemo(
    () =>
      etapasCadastradas
        .map((etapa) => etapa.nome)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })),
    [etapasCadastradas],
  );
  const linhasFiltradas = useMemo(() => {
    const dataInicialFiltro = filtrosAplicados.dataInicial
      ? (() => {
          const data = new Date(filtrosAplicados.dataInicial);
          data.setHours(0, 0, 0, 0);
          return data;
        })()
      : null;
    const dataFinalFiltro = filtrosAplicados.dataFinal
      ? (() => {
          const data = new Date(filtrosAplicados.dataFinal);
          data.setHours(23, 59, 59, 999);
          return data;
        })()
      : null;

    return linhas.filter((linha) => {
      if (filtrosAplicados.item) {
        if (normalizar(linha.item) !== normalizar(filtrosAplicados.item)) {
          return false;
        }
      }

      if (filtrosAplicados.servicos.length > 0) {
        const nomeServico = normalizar(linha.servico);
        if (!filtrosAplicados.servicos.includes(nomeServico)) {
          return false;
        }
      }

      if (filtrosAplicados.etapas.length > 0) {
        const nomeEtapa = normalizar(linha.etapa);
        if (!filtrosAplicados.etapas.includes(nomeEtapa)) {
          return false;
        }
      }

      if (dataInicialFiltro || dataFinalFiltro) {
        const inicioLinha = linha.dataInicio ? new Date(linha.dataInicio) : null;
        const fimLinha = linha.dataFim ? new Date(linha.dataFim) : null;

        if (inicioLinha) inicioLinha.setHours(0, 0, 0, 0);
        if (fimLinha) fimLinha.setHours(23, 59, 59, 999);

        if (dataInicialFiltro && (!fimLinha || fimLinha.getTime() < dataInicialFiltro.getTime())) {
          return false;
        }

        if (dataFinalFiltro && (!inicioLinha || inicioLinha.getTime() > dataFinalFiltro.getTime())) {
          return false;
        }
      }

      return true;
    });
  }, [linhas, filtrosAplicados, normalizar]);
  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(linhasFiltradas.length / linhasPorPagina) || 1);
  }, [linhasFiltradas.length]);
  const inicioIndice = (paginaAtual - 1) * linhasPorPagina;
  const linhasPaginadas = useMemo(
    () => linhasFiltradas.slice(inicioIndice, inicioIndice + linhasPorPagina),
    [linhasFiltradas, inicioIndice, linhasPorPagina],
  );
  const exibindoInicio = linhasFiltradas.length === 0 ? 0 : inicioIndice + 1;
  const exibindoFim = Math.min(inicioIndice + linhasPorPagina, linhasFiltradas.length);
  const todasSelecionadas = useMemo(() => {
    if (linhasFiltradas.length === 0) return false;
    return linhasFiltradas.every((linha) => linhasSelecionadas.includes(linha.id));
  }, [linhasFiltradas, linhasSelecionadas]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [obraSelecionada]);

  useEffect(() => {
    setFiltroItem("");
    setFiltroServico([]);
    setFiltroEtapa([]);
    setFiltroDataInicial("");
    setFiltroDataFinal("");
    setFiltrosAplicados({
      item: "",
      servicos: [],
      etapas: [],
      dataInicial: "",
      dataFinal: "",
    });
  }, [obraSelecionada]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtrosAplicados]);

  const manualSchema = z.object({
    obraId: z.string().min(1, "Selecione a obra"),
    item: z.string().min(1, "Informe o item"),
    servico: z.string().min(1, "Informe o serviço"),
    etapa: z.string().min(1, "Informe a etapa"),
    dataInicio: z.string().min(1, "Informe a data inicial"),
    dataFim: z.string().min(1, "Informe a data término"),
  });

  type ManualValues = z.infer<typeof manualSchema>;

  const editSchema = z.object({
    item: z.string().min(1, "Informe o item"),
    servico: z.string().min(1, "Informe o serviço"),
    etapa: z.string().min(1, "Informe a etapa"),
    dataInicio: z.string().min(1, "Informe a data inicial"),
    dataFim: z.string().min(1, "Informe a data término"),
  });

  type EditValues = z.infer<typeof editSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError: setManualError,
    formState: { errors: manualErrors },
  } = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      obraId: "",
      item: "",
      servico: "",
      etapa: "",
      dataInicio: "",
      dataFim: "",
    },
  });

  useEffect(() => {
    if (mostrarFormManual) {
      setValue("obraId", obraSelecionada ?? "");
    }
  }, [mostrarFormManual, obraSelecionada, setValue]);

  useEffect(() => {
    if (!mostrarFormManual) return;
    if (itensDisponiveis.length > 0) {
      setValue("item", itensDisponiveis[0], { shouldValidate: true });
    }
    if (servicosDisponiveis.length > 0) {
      setValue("servico", servicosDisponiveis[0], { shouldValidate: true });
    }
    if (etapasDisponiveis.length > 0) {
      setValue("etapa", etapasDisponiveis[0], { shouldValidate: true });
    }
  }, [mostrarFormManual, itensDisponiveis, servicosDisponiveis, etapasDisponiveis, setValue]);
  const alternarFiltroServico = useCallback((valor: string) => {
    setFiltroServico((atual) => {
      if (atual.includes(valor)) {
        return atual.filter((item) => item !== valor);
      }
      return [...atual, valor];
    });
  }, []);

  const alternarFiltroEtapa = useCallback((valor: string) => {
    setFiltroEtapa((atual) => {
      if (atual.includes(valor)) {
        return atual.filter((item) => item !== valor);
      }
      return [...atual, valor];
    });
  }, []);


  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setError: setEditError,
    formState: { errors: editErrors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      item: "",
      servico: "",
      etapa: "",
      dataInicio: "",
      dataFim: "",
    },
  });

  useEffect(() => {
    if (linhaEmEdicao) {
      resetEdit({
        item: linhaEmEdicao.item,
        servico: linhaEmEdicao.servico,
        etapa: linhaEmEdicao.etapa,
        dataInicio: linhaEmEdicao.dataInicio,
        dataFim: linhaEmEdicao.dataFim,
      });
    }
  }, [linhaEmEdicao, resetEdit]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!obraSelecionada) {
      setErrorMessage("Selecione uma obra antes de importar uma planilha.");
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setUploading(true);

    try {
      const parsed = await parseCronogramaFile(file);
      const obraId = obraSelecionada;
      const nomesItensImportados = new Set(
        parsed
          .map((linha) => linha.item?.trim())
          .filter((nome): nome is string => Boolean(nome)),
      );
      const nomesServicosImportados = new Set(
        parsed
          .map((linha) => linha.servico?.trim())
          .filter((nome): nome is string => Boolean(nome)),
      );
      const nomesEtapasImportadas = new Set(
        parsed
          .map((linha) => linha.etapa?.trim())
          .filter((nome): nome is string => Boolean(nome)),
      );

      if (nomesItensImportados.size > 0) {
        const nomesExistentes = new Set(
          itens
            .filter((item) => item.obraId === obraId)
            .map((item) => item.nome.trim().toLowerCase()),
        );
        for (const nome of nomesItensImportados) {
          const nomeNormalizado = nome.toLowerCase();
          if (nomesExistentes.has(nomeNormalizado)) continue;
          await createItem({
            obraId,
            nome,
            descricao: "",
          });
          nomesExistentes.add(nomeNormalizado);
        }
      }

      if (nomesServicosImportados.size > 0) {
        const nomesExistentesServicos = new Set(
          servicos
            .filter((servico) => servico.obraId === obraId)
            .map((servico) => servico.nome.trim().toLowerCase()),
        );
        let coresDaObra = servicos
          .filter((servico) => servico.obraId === obraId)
          .map((servico) => servico.corHex);

        for (const nome of nomesServicosImportados) {
          const nomeNormalizado = nome.toLowerCase();
          if (nomesExistentesServicos.has(nomeNormalizado)) continue;
          const corHex = getNextServicoColor(coresDaObra);
          await createServico({
            obraId,
            nome,
            corHex,
          });
          nomesExistentesServicos.add(nomeNormalizado);
          coresDaObra = [...coresDaObra, corHex];
        }
      }

      if (nomesEtapasImportadas.size > 0) {
        const etapasDaObra = etapasCadastradas.filter((etapa) => etapa.obraId === obraId);
        const nomesExistentes = new Set(
          etapasDaObra.map((etapa) => etapa.nome.trim().toLowerCase()),
        );
        let proximaOrdem =
          etapasDaObra.length > 0
            ? Math.max(...etapasDaObra.map((etapa) => etapa.ordem)) + 1
            : 1;

        for (const nome of nomesEtapasImportadas) {
          const nomeNormalizado = nome.toLowerCase();
          if (nomesExistentes.has(nomeNormalizado)) {
            continue;
          }
          let tentativaOrdem = proximaOrdem;
          let criada = false;
          while (!criada) {
            try {
              await createEtapa({
                obraId,
                nome,
                ordem: tentativaOrdem,
              });
              nomesExistentes.add(nomeNormalizado);
              proximaOrdem = tentativaOrdem + 1;
              criada = true;
            } catch (error) {
              if (isUniqueOrderConflict(error)) {
                tentativaOrdem += 1;
                continue;
              }
              console.error("Falha ao criar etapa importada", error);
              criada = true;
            }
          }
        }
      }

      await replaceLinhas(parsed);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ler a planilha. Tente novamente.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleSelecao = (linhaId: string) => {
    setLinhasSelecionadas((current) =>
      current.includes(linhaId)
        ? current.filter((id) => id !== linhaId)
        : [...current, linhaId],
    );
  };

  const handleToggleTodas = () => {
    if (todasSelecionadas) {
      setLinhasSelecionadas((current) =>
        current.filter(
          (id) => !linhasFiltradas.some((linhaFiltrada) => linhaFiltrada.id === id),
        ),
      );
    } else {
      setLinhasSelecionadas((current) => {
        const conjunto = new Set(current);
        linhasFiltradas.forEach((linha) => conjunto.add(linha.id));
        return Array.from(conjunto);
      });
    }
  };

  const handleRemoverSelecionadas = async () => {
    if (linhasSelecionadas.length === 0) return;
    try {
      setErroOperacao(null);
      setRemovendoLinhasSelecionadas(true);
      await removeLinhas(linhasSelecionadas);
      setLinhasSelecionadas([]);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível remover as linhas selecionadas.";
      setErroOperacao(mensagem);
    } finally {
      setRemovendoLinhasSelecionadas(false);
    }
  };

  const handleDownloadModelo = () => {
    const header = "ITEM;SERVIÇO;ETAPA;INÍCIO;TÉRMINO";
    const body = modeloCronograma
      .map((linha) =>
        [
          linha.item,
          linha.servico,
          linha.etapa,
          linha.dataInicio.split("-").reverse().join("/"),
          linha.dataFim.split("-").reverse().join("/"),
        ].join(";"),
      )
      .join("\n");

    const csv = `\uFEFF${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo-cronograma.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onManualSubmit = handleSubmit(async (values) => {
    const obraId = values.obraId || obraSelecionada;
    if (!obraId) {
      return;
    }
    if (!itensDisponiveis.includes(values.item)) {
      setManualError("item", { message: "Selecione um item cadastrado." });
      return;
    }
    if (!servicosDisponiveis.includes(values.servico)) {
      setManualError("servico", { message: "Selecione um serviço cadastrado." });
      return;
    }
    if (!etapasDisponiveis.includes(values.etapa)) {
      setManualError("etapa", { message: "Selecione uma etapa cadastrada." });
      return;
    }
    try {
      setErroOperacao(null);
      setSalvandoLinhaManual(true);
      await addLinha({
        id: crypto.randomUUID(),
        item: values.item.trim(),
        servico: values.servico.trim(),
        etapa: values.etapa.trim(),
        dataInicio: values.dataInicio,
        dataFim: values.dataFim,
      });
      reset({ ...values, item: "", servico: "", etapa: "", dataInicio: "", dataFim: "" });
      setMostrarFormManual(false);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível adicionar a linha.";
      setErroOperacao(mensagem);
    } finally {
      setSalvandoLinhaManual(false);
    }
  });

  const onEditSubmit = handleSubmitEdit(async (values) => {
    if (!linhaEmEdicao) return;
    if (!itensDisponiveis.includes(values.item)) {
      setEditError("item", { message: "Selecione um item cadastrado." });
      return;
    }
    if (!servicosDisponiveis.includes(values.servico)) {
      setEditError("servico", { message: "Selecione um serviço cadastrado." });
      return;
    }
    if (!etapasDisponiveis.includes(values.etapa)) {
      setEditError("etapa", { message: "Selecione uma etapa cadastrada." });
      return;
    }
    try {
      setErroOperacao(null);
      setSalvandoLinhaEdicao(true);
      await updateLinha(linhaEmEdicao.id, {
        item: values.item.trim(),
        servico: values.servico.trim(),
        etapa: values.etapa.trim(),
        dataInicio: values.dataInicio,
        dataFim: values.dataFim,
      });
      setLinhaEmEdicao(null);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível atualizar a linha.";
      setErroOperacao(mensagem);
    } finally {
      setSalvandoLinhaEdicao(false);
    }
  });

  const selecionouObra = Boolean(obraSelecionada);
  const obraAtual = useMemo(
    () => obras.find((obra) => obra.id === obraSelecionada) ?? null,
    [obras, obraSelecionada],
  );
  const modalAberto = mostrarFormManual || linhaEmEdicao !== null || linhaParaExcluir !== null;

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

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Cronograma</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="unstyled"
            size="sm"
            className="rounded-full bg-white px-3 text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
            onClick={() => setMostrarFiltros((prev) => !prev)}
            aria-label={`${mostrarFiltros ? "Ocultar" : "Mostrar"} filtros`}
          >
            {mostrarFiltros ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={!selecionouObra}
          />
          <Button
            variant="unstyled"
            size="sm"
            className="rounded-full bg-white px-4 text-[var(--accent)] hover:bg-[var(--accent-muted)]"
            onClick={handleDownloadModelo}
          >
            <Download className="h-4 w-4" />
            Baixar
          </Button>
          <Button
            variant="unstyled"
            size="sm"
            className="rounded-full bg-[#55D266] px-4 text-white hover:bg-[#49c35b] focus-visible:ring-[#55D266] focus-visible:ring-offset-2"
            onClick={() => {
              if (!obrasReady || obras.length === 0) return;
              const padrao = obraSelecionada ?? obras[0].id;
              setObraImportacaoId(padrao);
              setMostrarModalImportacao(true);
            }}
            disabled={obras.length === 0}
            loading={uploading}
          >
            <UploadCloud className="h-4 w-4" />
            Importar
          </Button>
          <Button
            size="sm"
            className="rounded-full px-4 bg-[#00AFF0] text-white hover:bg-[#009cd6]"
            onClick={() => setMostrarFormManual(true)}
            disabled={!selecionouObra}
          >
            <span className="mr-1">+</span>
            Adicionar
          </Button>
        </div>
      </header>

      {errorMessage ? (
        <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {errorMessage}
        </div>
      ) : null}

      {cronogramaError || erroOperacao ? (
        <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {erroOperacao ?? cronogramaError}
        </div>
      ) : null}

      {mostrarFiltros ? (
        <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
          <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[repeat(6,minmax(0,1fr))_auto] md:items-end">
            <label className="flex flex-col gap-2 text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">Obra</span>
              <select
                className="form-input"
                value={obraSelecionada ?? ""}
                onChange={(event) => setObraSelecionada(event.target.value || null)}
                disabled={!obrasReady || obras.length === 0}
                required
              >
                <option value="">Selecione uma obra</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </label>

            <FiltroSelect
              label="Itens"
              placeholder="Filtrar item"
              options={
                itensDisponiveis.length > 0
                  ? itensDisponiveis
                  : Array.from(
                      new Set(
                        linhas
                          .map((linha) => linha.item)
                          .filter((valor): valor is string => Boolean(valor)),
                      ),
                    ).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
              }
              value={filtroItem}
              onChange={setFiltroItem}
              disabled={!obraSelecionada}
            />

            <MultiSelectCheckbox
              label="Serviços"
              placeholder={
                servicosDisponiveis.length === 0
                  ? "Cadastre serviços para esta obra"
                  : "Todos os serviços"
              }
              options={servicosDisponiveis}
              selected={filtroServico}
              onToggle={alternarFiltroServico}
              disabled={!obraSelecionada || servicosDisponiveis.length === 0}
            />

            <MultiSelectCheckbox
              label="Etapas"
              placeholder={
                etapasDisponiveis.length === 0
                  ? "Cadastre etapas para esta obra"
                  : "Todas as etapas"
              }
              options={etapasDisponiveis}
              selected={filtroEtapa}
              onToggle={alternarFiltroEtapa}
              disabled={!obraSelecionada || etapasDisponiveis.length === 0}
            />

            <label className="flex flex-col gap-2 text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">Data inicial</span>
              <input
                type="date"
                className="form-input"
                value={filtroDataInicial}
                max={filtroDataFinal || undefined}
                onChange={(event) => setFiltroDataInicial(event.target.value)}
                disabled={!obraSelecionada}
              />
            </label>

            <label className="flex flex-col gap-2 text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">Data final</span>
              <input
                type="date"
                className="form-input"
                value={filtroDataFinal}
                min={filtroDataInicial || undefined}
                onChange={(event) => setFiltroDataFinal(event.target.value)}
                disabled={!obraSelecionada}
              />
            </label>

            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="unstyled"
                className="mt-6 flex items-center justify-center rounded-full bg-white px-3 py-2 text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
                aria-label="Aplicar filtros"
                onClick={() => {
                  if (!obraSelecionada) {
                    return;
                  }

                  const dataInicialNormalizada =
                    filtroDataInicial && filtroDataFinal && filtroDataInicial > filtroDataFinal
                      ? filtroDataFinal
                      : filtroDataInicial;
                  const dataFinalNormalizada =
                    filtroDataInicial && filtroDataFinal && filtroDataInicial > filtroDataFinal
                      ? filtroDataInicial
                      : filtroDataFinal;

                  setFiltrosAplicados({
                    item: filtroItem,
                    servicos: filtroServico.map((valor) => normalizar(valor)),
                    etapas: filtroEtapa.map((valor) => normalizar(valor)),
                    dataInicial: dataInicialNormalizada,
                    dataFinal: dataFinalNormalizada,
                  });
                }}
                disabled={!obraSelecionada}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {mostrarModalImportacao ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setMostrarModalImportacao(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => setMostrarModalImportacao(false)}
              aria-label="Fechar seleção de obra"
            >
              <X className="h-4 w-4" />
            </button>
            <header className="mb-6 pr-10">
              <h3 className="text-lg font-semibold text-foreground">Selecionar obra</h3>
              <p className="text-sm text-foreground-muted">
                Escolha para qual obra a planilha importada será vinculada.
              </p>
            </header>
            <div className="space-y-4">
              <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                <span className="font-semibold text-foreground">Obra</span>
                <select
                  className="form-input"
                  value={obraImportacaoId}
                  onChange={(event) => setObraImportacaoId(event.target.value)}
                >
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold text-foreground hover:text-[var(--danger)]"
                  onClick={() => setMostrarModalImportacao(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[#55D266] px-4 text-white hover:bg-[#49c35b]"
                  onClick={() => {
                    setMostrarModalImportacao(false);
                    setObraSelecionada(obraImportacaoId);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                >
                  Continuar
                </Button>
              </div>
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
          Cadastre uma obra para liberar o cronograma.
        </div>
      ) : !selecionouObra ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Selecione uma obra para visualizar ou editar o cronograma.
        </div>
      ) : !cronogramaReady ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
          Carregando cronograma salvo...
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          {linhasSelecionadas.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)]/40 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {linhasSelecionadas.length} linha(s) selecionada(s). Você pode remover em massa.
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="rounded-full px-4"
                onClick={handleRemoverSelecionadas}
                  disabled={removendoLinhasSelecionadas}
              >
                <Trash2 className="h-4 w-4" />
                  {removendoLinhasSelecionadas ? "Removendo..." : "Remover selecionadas"}
              </Button>
            </div>
          ) : null}

          {linhas.length === 0 ? (
             <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
               Nenhuma etapa cadastrada ainda. Use os botões acima para importar ou adicionar.
             </div>
          ) : linhasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
              Nenhum resultado encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#f5f7fb] text-left text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        checked={todasSelecionadas}
                        onChange={handleToggleTodas}
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
                          Serviço
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
                          Início
                          <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                        </span>
                      </th>
                      <th className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          Término
                          <ArrowDownUp className="h-3.5 w-3.5 text-[var(--border-strong)]" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasPaginadas.map((linha) => (
                    <tr
                      key={linha.id}
                      className="cursor-pointer rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                      onClick={() => setLinhaEmEdicao(linha)}
                    >
                      <td className="rounded-l-xl px-4 py-4 align-top">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--accent)]"
                          checked={linhasSelecionadas.includes(linha.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => handleToggleSelecao(linha.id)}
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="block text-sm text-foreground">
                          {linha.item || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="block text-sm text-foreground">
                          {linha.servico || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="block text-sm text-foreground">
                          {linha.etapa || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="block text-sm text-foreground">
                          {obraAtual?.nome ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="block text-sm text-foreground">
                          {linha.dataInicio
                            ? new Date(linha.dataInicio).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="block text-sm text-foreground">
                          {linha.dataFim
                            ? new Date(linha.dataFim).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </td>
                      <td className="rounded-r-xl px-4 py-4 align-top text-right">
                        <button
                          type="button"
                          className="text-[var(--accent)] transition hover:opacity-80"
                          aria-label="Editar linha"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLinhaEmEdicao(linha);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="ml-3 text-[var(--danger)] transition hover:opacity-80"
                          aria-label="Remover linha"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLinhaParaExcluir(linha);
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

          {linhasFiltradas.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl bg-surface/40 p-4 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {exibindoInicio} - {exibindoFim} de {linhasFiltradas.length} linhas
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="unstyled"
                className="h-9 w-9 rounded-full border border-[var(--border)] bg-white text-foreground transition hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="h-9 w-9 rounded-full border border-[var(--border)] bg-white text-foreground transition hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() =>
                    setPaginaAtual((pagina) =>
                      Math.min(totalPaginas, pagina + 1),
                    )
                  }
                  disabled={paginaAtual === totalPaginas || linhas.length === 0}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {mostrarFormManual ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
              onClick={() => {
                reset();
                setMostrarFormManual(false);
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
                    reset();
                    setMostrarFormManual(false);
                  }}
                  aria-label="Fechar formulário de adição"
                >
                  <X className="h-4 w-4" />
                </button>
                <header className="mb-6 pr-10">
                  <h3 className="text-lg font-semibold text-foreground">
                    Adicionar Etapa
                  </h3>
                </header>
                <form className="space-y-6" onSubmit={onManualSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Obra</span>
                      <select
                        className="form-input"
                        {...register("obraId")}
                        defaultValue={obraSelecionada ?? ""}
                      >
                        <option value="">{obraSelecionada ? "Usar obra selecionada" : "Selecione"}</option>
                        {obras.map((obra) => (
                          <option key={obra.id} value={obra.id}>
                            {obra.nome}
                          </option>
                        ))}
                      </select>
                      {manualErrors.obraId ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {manualErrors.obraId.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Item</span>
                      <select className="form-input" {...register("item")}>
                        {itensDisponiveis.length === 0 ? (
                          <option value="">Cadastre itens para esta obra</option>
                        ) : (
                          itensDisponiveis.map((nome) => (
                            <option key={nome} value={nome}>
                              {nome}
                            </option>
                          ))
                        )}
                      </select>
                      {manualErrors.item ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {manualErrors.item.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Serviço</span>
                      <select className="form-input" {...register("servico")}>
                        {servicosDisponiveis.length === 0 ? (
                          <option value="">Cadastre serviços para esta obra</option>
                        ) : (
                          servicosDisponiveis.map((nome) => (
                            <option key={nome} value={nome}>
                              {nome}
                            </option>
                          ))
                        )}
                      </select>
                      {manualErrors.servico ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {manualErrors.servico.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Etapa</span>
                      <select className="form-input" {...register("etapa")}>
                        {etapasDisponiveis.length === 0 ? (
                          <option value="">Cadastre etapas para esta obra</option>
                        ) : (
                          etapasDisponiveis.map((nome) => (
                            <option key={nome} value={nome}>
                              {nome}
                            </option>
                          ))
                        )}
                      </select>
                      {manualErrors.etapa ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {manualErrors.etapa.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Data início</span>
                      <input
                        type="date"
                        className="form-input"
                        {...register("dataInicio")}
                      />
                      {manualErrors.dataInicio ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {manualErrors.dataInicio.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Data término</span>
                      <input
                        type="date"
                        className="form-input"
                        {...register("dataFim")}
                      />
                      {manualErrors.dataFim ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {manualErrors.dataFim.message}
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
                        reset();
                        setMostrarFormManual(false);
                      }}
                    disabled={salvandoLinhaManual}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-full px-4"
                      disabled={
                      salvandoLinhaManual ||
                      itensDisponiveis.length === 0 ||
                      servicosDisponiveis.length === 0 ||
                      etapasDisponiveis.length === 0
                      }
                    >
                    {salvandoLinhaManual ? "Salvando..." : "Salvar etapa"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {linhaEmEdicao ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
              onClick={() => {
                setLinhaEmEdicao(null);
                resetEdit();
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
                    setLinhaEmEdicao(null);
                    resetEdit();
                  }}
                  aria-label="Fechar formulário de edição"
                >
                  <X className="h-4 w-4" />
                </button>
                <header className="mb-6 pr-10">
                  <h3 className="text-lg font-semibold text-foreground">Editar Etapa</h3>
                </header>
                <form className="space-y-6" onSubmit={onEditSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Item</span>
                      <select className="form-input" {...registerEdit("item")}>
                        {itensDisponiveis.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                      {editErrors.item ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {editErrors.item.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Serviço</span>
                      <select className="form-input" {...registerEdit("servico")}>
                        {servicosDisponiveis.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                      {editErrors.servico ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {editErrors.servico.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Etapa</span>
                      <select className="form-input" {...registerEdit("etapa")}>
                        {etapasDisponiveis.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                      {editErrors.etapa ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {editErrors.etapa.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Data início</span>
                      <input
                        type="date"
                        className="form-input"
                        {...registerEdit("dataInicio")}
                      />
                      {editErrors.dataInicio ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {editErrors.dataInicio.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                      <span className="font-semibold text-foreground">Data término</span>
                      <input
                        type="date"
                        className="form-input"
                        {...registerEdit("dataFim")}
                      />
                      {editErrors.dataFim ? (
                        <span className="text-xs font-semibold text-[var(--danger)]">
                          {editErrors.dataFim.message}
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
                        setLinhaEmEdicao(null);
                        resetEdit();
                      }}
                    disabled={salvandoLinhaEdicao}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-full px-4"
                    disabled={salvandoLinhaEdicao}
                    >
                    {salvandoLinhaEdicao ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {linhaParaExcluir ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
              onClick={() => setLinhaParaExcluir(null)}
            >
              <div
                className="relative w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Confirmar exclusão
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Tem certeza de que deseja remover a etapa
                  {" "}
                  <span className="font-semibold text-foreground">
                    {linhaParaExcluir.item || "Sem item"} — {linhaParaExcluir.etapa || "Sem etapa"}
                  </span>
                  ? Essa ação não pode ser desfeita.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-4 text-sm font-semibold text-foreground"
                    onClick={() => setLinhaParaExcluir(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="rounded-full px-4"
                    disabled={removendoLinhasSelecionadas}
                    onClick={async () => {
                      if (!linhaParaExcluir) return;
                      try {
                        setErroOperacao(null);
                        setRemovendoLinhasSelecionadas(true);
                        await removeLinhas([linhaParaExcluir.id]);
                        setLinhasSelecionadas((atuais) =>
                          atuais.filter((id) => id !== linhaParaExcluir.id),
                        );
                        setLinhaParaExcluir(null);
                      } catch (error) {
                        const mensagem =
                          error instanceof Error
                            ? error.message
                            : "Não foi possível remover a linha.";
                        setErroOperacao(mensagem);
                      } finally {
                        setRemovendoLinhasSelecionadas(false);
                      }
                    }}
                  >
                    {removendoLinhasSelecionadas ? "Excluindo..." : "Sim, excluir"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      )}
    </section>
  );
}

type MultiSelectCheckboxProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
};

function MultiSelectCheckbox({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  disabled = false,
}: MultiSelectCheckboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const displayText =
    selected.length === 0 ? placeholder : selected.slice(0, 3).join(", ") + (selected.length > 3 ? "…" : "");

  return (
    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
      <span className="font-semibold text-foreground">{label}</span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          className={clsx(
            "form-input flex h-10 w-full items-center justify-between gap-2 text-left",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev);
            }
          }}
          disabled={disabled}
        >
          <span
            className={clsx(
              "truncate text-sm",
              selected.length === 0 ? "text-foreground-muted" : "text-foreground",
            )}
          >
            {displayText}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground-muted" />
        </button>
        {open ? (
          <div className="absolute z-30 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--border)] bg-card shadow-lg">
            {options.length === 0 ? (
              <span className="block px-3 py-2 text-xs text-foreground-muted">{placeholder}</span>
            ) : (
              options.map((option) => {
                const marcado = selected.includes(option);
                return (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-muted)]"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      checked={marcado}
                      onChange={() => onToggle(option)}
                    />
                    <span className="flex-1 truncate">{option}</span>
                  </label>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function FiltroSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const currentValue = value ?? "";
  const selectProps = {
    value: currentValue,
    onChange: onChange
      ? (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)
      : undefined,
  };
  const hasValue = currentValue !== "";

  return (
    <label className="flex flex-col gap-2 text-xs text-foreground-muted">
      <span className="font-semibold text-foreground">{label}</span>
      <select
        className={`form-input w-full text-sm ${hasValue ? "text-foreground" : "text-[var(--foreground-muted)]"}`}
        disabled={disabled}
        {...selectProps}
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

