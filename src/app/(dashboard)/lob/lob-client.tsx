"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { z } from "zod";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { useObras } from "@/hooks/use-obras";
import { useCronograma } from "@/hooks/use-cronograma";
import { useServicos } from "@/hooks/use-servicos";
import { useEtapas } from "@/hooks/use-etapas";

const dateSchema = z.string().transform((value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
});

const LABEL_COLUMN_WIDTH = 160;
const DAY_WIDTH = 28;
const BAR_HEIGHT = 18;
const BAR_GAP = 8;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
function normalizeHexColor(hex: string, fallback = "#2563EB") {
  const value = typeof hex === "string" && hex.trim() ? hex.trim() : fallback;
  let normalized = value.replace("#", "").toUpperCase();
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (normalized.length !== 6) {
    normalized = fallback.replace("#", "").toUpperCase();
  }
  return normalized;
}

function hexToExcelArgb(hex: string) {
  const normalized = normalizeHexColor(hex);
  return `FF${normalized}`;
}

function textColorForBackground(hex: string) {
  const normalized = normalizeHexColor(hex);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 180 ? "FF0F172A" : "FFFFFFFF";
}


const FALLBACK_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#22C55E",
  "#F97316",
  "#D946EF",
  "#FACC15",
  "#14B8A6",
  "#FB7185",
  "#9CA3AF",
];

interface TimelineTask {
  id: string;
  etapa: string;
  servico: string;
  inicio: Date;
  fim: Date;
  color: string;
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
              <span className="block px-3 py-2 text-xs text-foreground-muted">
                Nenhuma opção disponível.
              </span>
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

export default function LobClientPage() {
  const { obras, isReady: obrasReady } = useObras();
  const [obraSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroServico, setFiltroServico] = useState<string[]>([]);
  const [filtroEtapa, setFiltroEtapa] = useState<string[]>([]);
  const [filtroDataInicial, setFiltroDataInicial] = useState<string>("");
  const [filtroDataFinal, setFiltroDataFinal] = useState<string>("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    servicos: [] as string[],
    etapas: [] as string[],
    dataInicial: "",
    dataFinal: "",
  });
  const [mesVisivelIndex, setMesVisivelIndex] = useState(0);
  const [mostrarVisaoCompleta, setMostrarVisaoCompleta] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const compactWrapperRef = useRef<HTMLDivElement | null>(null);
  const compactContentRef = useRef<HTMLDivElement | null>(null);
  const timelineContentRef = useRef<HTMLDivElement | null>(null);

  const [compactFitScale, setCompactFitScale] = useState(1);
  const [zoomNivel, setZoomNivel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { linhas, isReady: cronogramaReady } = useCronograma(obraSelecionada);
  const { servicos } = useServicos(obraSelecionada);
  const { etapas: etapasDaObra } = useEtapas(obraSelecionada);

  const normalizar = useCallback((valor: string) => valor.trim().toLowerCase(), []);
  const appliedScale = useMemo(() => compactFitScale * zoomNivel, [compactFitScale, zoomNivel]);


  const alterarZoom = useCallback((step: number) => {
    setZoomNivel((current) => {
      const next = Math.min(6, Math.max(0.2, Math.round((current + step) * 10) / 10));
      return next;
    });
  }, []);

  const obraAtual = useMemo(
    () => obras.find((obra) => obra.id === obraSelecionada) ?? null,
    [obras, obraSelecionada],
  );

  const tarefasBase = useMemo(() => {
    if (!cronogramaReady) return [] as TimelineTask[];
    return linhas
      .map((linha) => {
        const etapa = linha.etapa?.trim() || "Etapa não informada";
        const servico = linha.servico?.trim() || "Serviço não informado";
        const inicio = dateSchema.parse(linha.dataInicio);
        const fim = dateSchema.parse(linha.dataFim);
        if (!inicio || !fim || fim.getTime() < inicio.getTime()) return null;

        const registroServico = servicos.find(
          (srv) => srv.nome.trim().toLowerCase() === servico.toLowerCase(),
        );

        const fallbackIndex = Math.abs(
          servico.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % FALLBACK_COLORS.length;

        const color = registroServico?.corHex
          ? registroServico.corHex
          : FALLBACK_COLORS[fallbackIndex];

        return {
          id: linha.id,
          etapa,
          servico,
          inicio,
          fim,
          color,
        } satisfies TimelineTask;
      })
      .filter(Boolean) as TimelineTask[];
  }, [linhas, cronogramaReady, servicos]);

  const servicosDisponiveis = useMemo(() => {
    const nomes = new Set<string>();
    tarefasBase.forEach((tarefa) => nomes.add(tarefa.servico));
    return Array.from(nomes).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
    );
  }, [tarefasBase]);

  const etapasDisponiveis = useMemo(() => {
    const nomes = new Set<string>();
    tarefasBase.forEach((tarefa) => nomes.add(tarefa.etapa));
    return Array.from(nomes).sort((a, b) =>
      b.localeCompare(a, "pt-BR", { numeric: true, sensitivity: "base" }),
    );
  }, [tarefasBase]);

  const tarefas = useMemo(() => {
    if (tarefasBase.length === 0) return [] as TimelineTask[];

    const servicosFiltro = filtrosAplicados.servicos;
    const etapasFiltro = filtrosAplicados.etapas;
    const dataInicialFiltro = filtrosAplicados.dataInicial
      ? new Date(filtrosAplicados.dataInicial)
      : null;
    const dataFinalFiltro = filtrosAplicados.dataFinal ? new Date(filtrosAplicados.dataFinal) : null;

    if (dataInicialFiltro) {
      dataInicialFiltro.setHours(0, 0, 0, 0);
    }
    if (dataFinalFiltro) {
      dataFinalFiltro.setHours(23, 59, 59, 999);
    }

    return tarefasBase.filter((tarefa) => {
      if (servicosFiltro.length > 0) {
        const nomeServico = normalizar(tarefa.servico);
        if (!servicosFiltro.includes(nomeServico)) {
          return false;
        }
      }
      if (etapasFiltro.length > 0) {
        const nomeEtapa = normalizar(tarefa.etapa);
        if (!etapasFiltro.includes(nomeEtapa)) {
          return false;
        }
      }
      if (dataInicialFiltro) {
        if (tarefa.fim.getTime() < dataInicialFiltro.getTime()) {
          return false;
        }
      }
      if (dataFinalFiltro) {
        if (tarefa.inicio.getTime() > dataFinalFiltro.getTime()) {
          return false;
        }
      }
      return true;
    });
  }, [tarefasBase, filtrosAplicados, normalizar]);

  const servicosLegenda = useMemo(() => {
    const mapa = new Map<string, string>();
    tarefas.forEach((tarefa) => {
      if (!mapa.has(tarefa.servico)) {
        mapa.set(tarefa.servico, tarefa.color);
      }
    });
    return Array.from(mapa.entries()).map(([nome, cor]) => ({ nome, cor }));
  }, [tarefas]);

  const etapasOrdenadas = useMemo(() => {
    if (!obraSelecionada) {
      return [] as string[];
    }

    if (etapasDaObra.length > 0) {
      return etapasDaObra
        .slice()
        .sort((a, b) => a.ordem - b.ordem)
        .map((etapa) => etapa.nome)
        .filter((nome) => tarefas.some((tarefa) => tarefa.etapa === nome));
    }

    const nomes = Array.from(new Set(tarefas.map((tarefa) => tarefa.etapa)));
    return nomes.sort((a, b) =>
      b.localeCompare(a, "pt-BR", { numeric: true, sensitivity: "base" }),
    );
  }, [etapasDaObra, obraSelecionada, tarefas]);

  const tarefasPorEtapa = useMemo(() => {
    const agrupado = new Map<string, TimelineTask[][]>();
    const agrupamentoTemporal = new Map<string, TimelineTask[]>();

    tarefas.forEach((tarefa) => {
      const existente = agrupamentoTemporal.get(tarefa.etapa);
      if (existente) {
        existente.push(tarefa);
      } else {
        agrupamentoTemporal.set(tarefa.etapa, [tarefa]);
      }
    });

    agrupamentoTemporal.forEach((lista, etapa) => {
      const ordenadas = lista
        .slice()
        .sort((a, b) => {
          const inicioDiff = a.inicio.getTime() - b.inicio.getTime();
          if (inicioDiff !== 0) return inicioDiff;
          return a.fim.getTime() - b.fim.getTime();
        });

      const trilhos: TimelineTask[][] = [];
      ordenadas.forEach((tarefa) => {
        const trilhoDisponivel = trilhos.find(
          (trilho) => tarefa.inicio.getTime() > trilho[trilho.length - 1].fim.getTime(),
        );
        if (trilhoDisponivel) {
          trilhoDisponivel.push(tarefa);
        } else {
          trilhos.push([tarefa]);
        }
      });

      agrupado.set(etapa, trilhos);
    });

    return agrupado;
  }, [tarefas]);

  const intervalo = useMemo(() => {
    if (tarefas.length === 0) return null as null | { dias: Date[]; inicio: Date; fim: Date };
    const inicioMin = tarefas.reduce(
      (min, tarefa) => (tarefa.inicio.getTime() < min.getTime() ? tarefa.inicio : min),
      tarefas[0].inicio,
    );
    const fimMax = tarefas.reduce(
      (max, tarefa) => (tarefa.fim.getTime() > max.getTime() ? tarefa.fim : max),
      tarefas[0].fim,
    );

    const inicio = new Date(inicioMin.getFullYear(), inicioMin.getMonth(), 1);
    const fim = new Date(fimMax.getFullYear(), fimMax.getMonth() + 1, 0);

    const dias: Date[] = [];
    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    while (cursor.getTime() <= fim.getTime()) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return { dias, inicio, fim };
  }, [tarefas]);

  const segmentosMes = useMemo(() => {
    if (!intervalo) return [] as Array<{ inicioIndex: number; span: number; rotulo: string; indice: number }>;
    const { dias } = intervalo;
    const segmentos: Array<{ inicioIndex: number; span: number; rotulo: string; indice: number }> = [];
    let segmentoInicio = 0;
    let segmentoAtual = `${dias[0].toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
    let indice = 0;

    for (let i = 1; i < dias.length; i += 1) {
      const rotuloDia = `${dias[i].toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
      if (rotuloDia !== segmentoAtual) {
        segmentos.push({
          inicioIndex: segmentoInicio,
          span: i - segmentoInicio,
          rotulo: segmentoAtual.toUpperCase(),
          indice,
        });
        segmentoInicio = i;
        segmentoAtual = rotuloDia;
        indice += 1;
      }
    }
    segmentos.push({
      inicioIndex: segmentoInicio,
      span: dias.length - segmentoInicio,
      rotulo: segmentoAtual.toUpperCase(),
      indice,
    });
    return segmentos;
  }, [intervalo]);

  const totalDias = intervalo?.dias.length ?? 0;

  const obterIndiceDia = (data: Date) => {
    if (!intervalo) return 0;
    const { inicio } = intervalo;
    return Math.round((data.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  };

  const aplicarFiltros = () => {
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
      servicos: filtroServico.map((valor) => normalizar(valor)),
      etapas: filtroEtapa.map((valor) => normalizar(valor)),
      dataInicial: dataInicialNormalizada,
      dataFinal: dataFinalNormalizada,
    });
    setMesVisivelIndex(0);
  };

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

  useEffect(() => {
    setFiltroServico([]);
    setFiltroEtapa([]);
    setFiltroDataInicial("");
    setFiltroDataFinal("");
    setFiltrosAplicados({
      servicos: [],
      etapas: [],
      dataInicial: "",
      dataFinal: "",
    });
  }, [obraSelecionada]);

  useEffect(() => {
    if (segmentosMes.length === 0) {
      setMesVisivelIndex(0);
      return;
    }
    setMesVisivelIndex((prev) => Math.min(prev, segmentosMes.length - 1));
  }, [segmentosMes]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    if (segmentosMes.length === 0) return;
    const segmento = segmentosMes[mesVisivelIndex];
    scrollContainerRef.current.scrollTo({
      left: Math.max(segmento.inicioIndex * DAY_WIDTH - 8, 0),
      behavior: "smooth",
    });
  }, [mesVisivelIndex, segmentosMes]);

  useEffect(() => {
    if (!mostrarVisaoCompleta) return;
    const previousOverflow = document.body.style.overflow;
    const previousClasses = document.body.className;
    document.body.style.overflow = "hidden";
    document.body.classList.add("lob-fullscreen");
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.className = previousClasses;
    };
  }, [mostrarVisaoCompleta]);

  useEffect(() => {
    if (!mostrarVisaoCompleta) return;
    const container = compactWrapperRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY;
      setZoomNivel((current) => {
        const step = delta > 0 ? -0.1 : 0.1;
        const next = Math.min(6, Math.max(0.2, Math.round((current + step) * 10) / 10));
        return next;
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMostrarVisaoCompleta(false);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mostrarVisaoCompleta]);

  useLayoutEffect(() => {
    if (!mostrarVisaoCompleta) {
      setCompactFitScale(1);
      setZoomNivel(1);
      return;
    }
    const wrapper = compactWrapperRef.current;
    const content = compactContentRef.current;
    if (!wrapper || !content) return;

    const measure = () => {
      const previousTransform = content.style.transform;
      content.style.transform = "scale(1)";
      const contentRect = content.getBoundingClientRect();
      content.style.transform = previousTransform;

      const wrapperRect = wrapper.getBoundingClientRect();

      const width = contentRect.width;
      const height = contentRect.height;
      if (!width || !height || !wrapperRect.width || !wrapperRect.height) {
        setCompactFitScale(1);
        return;
      }

      const scale = Math.min(wrapperRect.width / width, wrapperRect.height / height, 1);
      const floor = Math.max(0.8, Math.min(scale, 1));
      setCompactFitScale(floor);
    };

    measure();

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(wrapper);
    resizeObserver.observe(content);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [mostrarVisaoCompleta, totalDias, etapasOrdenadas.length, tarefas.length]);

  const irParaMes = (novoIndice: number) => {
    if (segmentosMes.length === 0) return;
    const indice = Math.max(0, Math.min(segmentosMes.length - 1, novoIndice));
    setMesVisivelIndex(indice);
  };

  const irParaMesAnterior = () => irParaMes(mesVisivelIndex - 1);
  const irParaMesSeguinte = () => irParaMes(mesVisivelIndex + 1);

  const handleExportExcel = useCallback(async () => {
    if (!timelineContentRef.current || tarefas.length === 0 || segmentosMes.length === 0 || !intervalo) return;
    try {
      setIsExporting(true);
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet("L.O.B.", {
        views: [{ state: "frozen", xSplit: 1, ySplit: 2, showGridLines: false }],
      });

      const etapaColumnWidth = Number((LABEL_COLUMN_WIDTH / 6.5).toFixed(2));
      const dayColumnWidth = Number((DAY_WIDTH / 6.5).toFixed(2));
      sheet.getColumn(1).width = etapaColumnWidth;
      for (let col = 2; col <= intervalo.dias.length + 1; col += 1) {
        sheet.getColumn(col).width = dayColumnWidth;
      }

      sheet.mergeCells(1, 1, 2, 1);
      const headerEtapa = sheet.getCell(1, 1);
      headerEtapa.value = "Etapa";
      headerEtapa.alignment = { horizontal: "center", vertical: "middle" };
      headerEtapa.font = { bold: true };
      headerEtapa.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEDF2FF" },
      };

      const headerMes = sheet.getRow(1);
      const headerDia = sheet.getRow(2);
      headerMes.height = BAR_HEIGHT + BAR_GAP;
      headerDia.height = BAR_HEIGHT;

      const monthInfos = intervalo.dias.map((dia, index) => {
        const monthLabel = dia.toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        });
        const monthIndex = segmentosMes.find((segmento) =>
          index >= segmento.inicioIndex && index < segmento.inicioIndex + segmento.span,
        )?.indice ?? 0;
        return {
          monthLabel: monthLabel.toUpperCase(),
          day: dia.getDate(),
          headerFillColor: monthIndex % 2 === 0 ? "FFE5E7EB" : "FFD1D5DB",
          dayFillColor: monthIndex % 2 === 0 ? "FFF1F5F9" : "FFE2E8F0",
        };
      });

      monthInfos.forEach((info, index) => {
        const col = index + 2;
        const cellMes = headerMes.getCell(col);
        cellMes.value = info.monthLabel;
        cellMes.alignment = { horizontal: "center", vertical: "middle" };
        cellMes.font = { bold: true };
        cellMes.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: info.headerFillColor },
        };

        const cellDia = headerDia.getCell(col);
        cellDia.value = info.day;
        cellDia.alignment = { horizontal: "center", vertical: "middle" };
        cellDia.font = { bold: true, size: 9 };
        cellDia.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: info.dayFillColor },
        };
      });

      // Merge de meses
      let startCol = 2;
      while (startCol <= intervalo.dias.length + 1) {
        const currentLabel = headerMes.getCell(startCol).value;
        let endCol = startCol;
        while (
          endCol + 1 <= intervalo.dias.length + 1 &&
          headerMes.getCell(endCol + 1).value === currentLabel
        ) {
          endCol += 1;
        }
        if (endCol > startCol) {
          sheet.mergeCells(1, startCol, 1, endCol);
        }
        startCol = endCol + 1;
      }

      const ultimaColuna = intervalo.dias.length + 1;
      headerMes.eachCell((cell, colNumber) => {
        if (colNumber === 1) return;
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: colNumber === ultimaColuna ? { style: "thin", color: { argb: "FFE2E8F0" } } : undefined,
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
      headerDia.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });

      // Conteúdo das etapas
      const etapasParaExportar = (() => {
        if (!obraSelecionada || etapasDaObra.length === 0) return etapasOrdenadas;
        const nomesOrdenados = etapasDaObra
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((etapa) => etapa.nome);
        return nomesOrdenados.filter((nome) =>
          etapasOrdenadas.includes(nome),
        );
      })();

      etapasParaExportar.forEach((etapa, etapaIndex) => {
        const trilhos = tarefasPorEtapa.get(etapa) ?? [];
        const totalServicosEtapa = trilhos.reduce((acc, trilho) => acc + trilho.length, 0);
        const tracks = trilhos.length > 0 ? trilhos : [[]];

        tracks.forEach((trilho, trackIndex) => {
          const isPrimeiro = trackIndex === 0;
          const row = sheet.addRow([
            isPrimeiro ? etapa : "",
          ]);
          row.height = BAR_HEIGHT + BAR_GAP;

          const cellEtapa = row.getCell(1);
          cellEtapa.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
          };
          cellEtapa.font = { bold: isPrimeiro };
          cellEtapa.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isPrimeiro ? "FFF8FAFC" : "FFFFFFFF" },
          };
          cellEtapa.border = {
            top: { style: isPrimeiro ? "thin" : "hair", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          };

          monthInfos.forEach((info, index) => {
            const col = index + 2;
            const baseCell = row.getCell(col);
            baseCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: info.dayFillColor },
            };
            baseCell.border = {
              top: { style: "hair", color: { argb: "FFE2E8F0" } },
              left: { style: "hair", color: { argb: "FFE2E8F0" } },
              bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
            };
          });

          trilho.forEach((tarefa) => {
            const inicioIndex = Math.max(
              0,
              Math.floor((tarefa.inicio.getTime() - intervalo.inicio.getTime()) / DAY_IN_MS),
            );
            const fimIndex = Math.min(
              intervalo.dias.length - 1,
              Math.floor((tarefa.fim.getTime() - intervalo.inicio.getTime()) / DAY_IN_MS),
            );
            const startCol = inicioIndex + 2;
            const endCol = fimIndex + 2;
            if (endCol > startCol) {
              sheet.mergeCells(row.number, startCol, row.number, endCol);
            }

            const cell = row.getCell(startCol);
            const fgColor = hexToExcelArgb(tarefa.color);
            const fontColor = textColorForBackground(tarefa.color);
            cell.value = tarefa.servico;
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: fgColor },
            };
            cell.font = {
              color: { argb: fontColor },
              bold: true,
              size: 9,
            };

            for (let col = startCol; col <= endCol; col += 1) {
              const mergedCell = row.getCell(col);
              mergedCell.border = {
                top: { style: "hair", color: { argb: "FFE2E8F0" } },
                left: { style: "hair", color: { argb: "FFE2E8F0" } },
                bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
              };
            }
          });
        });

        if (etapaIndex < etapasOrdenadas.length - 1) {
          const spacerRow = sheet.addRow([""]);
          spacerRow.height = Math.max(4, BAR_GAP);
          spacerRow.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
          };
          monthInfos.forEach((info, index) => {
            const col = index + 2;
            const cell = spacerRow.getCell(col);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: info.dayFillColor },
            };
          });
        }
      });

      const footerDiaRow = sheet.addRow([""]);
      const footerMesRow = sheet.addRow([""]);
      footerDiaRow.height = 18;
      footerMesRow.height = 20;

      const footerLabelDia = footerDiaRow.getCell(1);
      footerLabelDia.value = "Dia";
      footerLabelDia.alignment = { horizontal: "center", vertical: "middle" };
      footerLabelDia.font = { bold: true };
      footerLabelDia.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEDF2FF" },
      };
      footerLabelDia.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      const footerLabelMes = footerMesRow.getCell(1);
      footerLabelMes.value = "Mês";
      footerLabelMes.alignment = { horizontal: "center", vertical: "middle" };
      footerLabelMes.font = { bold: true };
      footerLabelMes.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEDF2FF" },
      };
      footerLabelMes.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      monthInfos.forEach((info, index) => {
        const col = index + 2;
        const cellDiaRodape = footerDiaRow.getCell(col);
        cellDiaRodape.value = info.day;
        cellDiaRodape.alignment = { horizontal: "center", vertical: "middle" };
        cellDiaRodape.font = { bold: true, size: 9 };
        cellDiaRodape.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: info.dayFillColor },
        };
        cellDiaRodape.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        const cellMesRodape = footerMesRow.getCell(col);
        cellMesRodape.value = info.monthLabel;
        cellMesRodape.alignment = { horizontal: "center", vertical: "middle" };
        cellMesRodape.font = { bold: true };
        cellMesRodape.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: info.headerFillColor },
        };
        cellMesRodape.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });

      let footerStart = 2;
      while (footerStart <= intervalo.dias.length + 1) {
        const currentFooter = footerMesRow.getCell(footerStart).value;
        let footerEnd = footerStart;
        while (
          footerEnd + 1 <= intervalo.dias.length + 1 &&
          footerMesRow.getCell(footerEnd + 1).value === currentFooter
        ) {
          footerEnd += 1;
        }
        if (footerEnd > footerStart) {
          sheet.mergeCells(footerMesRow.number, footerStart, footerMesRow.number, footerEnd);
        }
        footerStart = footerEnd + 1;
      }

      const sanitizedName =
        obraAtual?.nome
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-") ?? "timeline";

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lob-${sanitizedName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Falha ao exportar planilha", error);
    } finally {
      setIsExporting(false);
    }
  }, [etapasOrdenadas, intervalo, obraAtual?.nome, segmentosMes, tarefas.length, tarefasPorEtapa]);

  type TimelineOptions = {
    labelWidth?: number;
    mostrarServicoTexto?: boolean;
    mostrarResumo?: boolean;
    mostrarCabecalhos?: boolean;
    mostrarNomeEtapa?: boolean;
    mostrarQuantidadeServicos?: boolean;
    mostrarDiasDetalhados?: boolean;
    mostrarEtiquetasDias?: boolean;
    mostrarCabecalhoResumo?: boolean;
    mostrarRodape?: boolean;
    mostrarFaixasMes?: boolean;
    mostrarFaixasEtapa?: boolean;
    mostrarGradeVertical?: boolean;
    layoutCompacto?: boolean;
    dayWidth?: number;
    barHeight?: number;
    barGap?: number;
    containerRef?: MutableRefObject<HTMLDivElement | null>;
    contentRef?: MutableRefObject<HTMLDivElement | null>;
  };

  const renderTimeline = ({
    labelWidth = LABEL_COLUMN_WIDTH,
    mostrarServicoTexto = true,
    mostrarResumo = true,
    mostrarCabecalhos = true,
    mostrarNomeEtapa = true,
    mostrarQuantidadeServicos = true,
    mostrarDiasDetalhados = true,
    mostrarEtiquetasDias = true,
    mostrarCabecalhoResumo = true,
    mostrarRodape = true,
    mostrarFaixasMes = true,
    mostrarFaixasEtapa = true,
    mostrarGradeVertical = true,
    layoutCompacto = false,
    dayWidth = DAY_WIDTH,
    barHeight = BAR_HEIGHT,
    barGap = BAR_GAP,
    containerRef,
    contentRef,
  }: TimelineOptions = {}) => {
    if (!intervalo) return null;
    const timelineWidth = totalDias * dayWidth;
    const isCompactLayout = layoutCompacto;

    const wrapperClasses = layoutCompacto
      ? "rounded-3xl border border-[var(--border)] bg-white/95 p-4 shadow-lg"
      : "space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm";

    return (
      <div
        ref={contentRef ?? undefined}
        className={wrapperClasses}
      >
        {mostrarCabecalhos && mostrarCabecalhoResumo ? (
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            <span>Etapas</span>
            <span className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4" />
              Timeline ({intervalo?.inicio.toLocaleDateString("pt-BR")}
              {" – "}
              {intervalo?.fim.toLocaleDateString("pt-BR")})
            </span>
          </div>
        ) : null}
        <div
          className="overflow-x-auto"
          ref={containerRef ?? undefined}
          id={containerRef === scrollContainerRef ? "lob-scroll-container" : undefined}
        >
          <div
            className="relative"
            style={{ width: labelWidth + timelineWidth }}
          >
            {mostrarCabecalhos ? (
              <>
                <div className="flex">
                  {labelWidth > 0 ? (
                    <div
                      className="sticky left-0 z-10 bg-card px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                      style={{ width: labelWidth }}
                    >
                      Mês
                    </div>
                  ) : null}
                  <div
                    className="relative h-12 border-b border-[var(--border)]"
                    style={{ width: timelineWidth }}
                  >
                    {segmentosMes.map((segmento) => (
                      <div
                        key={`${segmento.rotulo}-${segmento.inicioIndex}`}
                        className={`absolute top-0 flex h-full items-center justify-center text-xs font-semibold text-foreground ${
                          mostrarGradeVertical ? "border-r border-[var(--border)]" : ""
                        }`}
                        style={{
                          left: segmento.inicioIndex * dayWidth,
                          width: segmento.span * dayWidth,
                          backgroundColor:
                            mostrarFaixasMes
                              ? segmento.indice % 2 === 0
                                ? "rgba(15, 23, 42, 0.06)"
                                : "rgba(15, 23, 42, 0.02)"
                              : "transparent",
                          pointerEvents: "none",
                        }}
                      >
                        {segmento.rotulo}
                      </div>
                    ))}
                  </div>
                </div>
                {mostrarDiasDetalhados ? (
                  <div className="flex">
                    {labelWidth > 0 ? (
                      <div
                        className="sticky left-0 z-10 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                        style={{ width: labelWidth }}
                      >
                        Dia
                      </div>
                    ) : null}
                    <div className="flex" style={{ width: timelineWidth }}>
                      {intervalo?.dias.map((dia, index) => {
                        const segmentoAtual = segmentosMes.find((segmento) =>
                          index >= segmento.inicioIndex &&
                          index < segmento.inicioIndex + segmento.span,
                        );
                        const fundoSegmento = segmentoAtual
                          ? segmentoAtual.indice % 2 === 0
                            ? mostrarFaixasMes
                              ? "rgba(15, 23, 42, 0.06)"
                              : "transparent"
                            : mostrarFaixasMes
                              ? "rgba(15, 23, 42, 0.02)"
                              : "transparent"
                          : "transparent";

                        return (
                          <div
                            key={index}
                            className={`flex h-10 flex-col items-center justify-center text-[0.65rem] font-semibold ${
                              mostrarGradeVertical ? "border-r border-[var(--border)]" : ""
                            } ${mostrarEtiquetasDias ? "text-foreground-muted" : "text-transparent"}`}
                            style={{ width: dayWidth, backgroundColor: fundoSegmento }}
                          >
                            <span>{mostrarEtiquetasDias ? dia.getDate() : ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {etapasOrdenadas.map((etapa, index) => {
              const trilhos = tarefasPorEtapa.get(etapa) ?? [];
              const totalServicosEtapa = trilhos.reduce(
                (acc, trilho) => acc + trilho.length,
                0,
              );
              const alturaContainer = trilhos.length * (barHeight + barGap) + barGap;
              return (
                <div
                  key={etapa}
                  className="flex border-t border-[var(--border)]"
                  style={{
                    backgroundColor:
                      mostrarFaixasEtapa
                        ? index % 2 === 0
                          ? "rgba(148, 163, 184, 0.08)"
                          : "rgba(148, 163, 184, 0.02)"
                        : "transparent",
                  }}
                >
                  {labelWidth > 0 && (mostrarNomeEtapa || mostrarQuantidadeServicos) ? (
                    <div
                      className="sticky left-0 z-10 flex flex-col gap-1 bg-card px-4 py-3 text-sm font-semibold text-foreground"
                      style={{ width: labelWidth }}
                      title={etapa}
                    >
                      {mostrarNomeEtapa ? (
                        <span className="leading-snug">{etapa}</span>
                      ) : null}
                      
                    </div>
                  ) : null}
                  <div className="relative" style={{ width: timelineWidth }}>
                    <div
                      className="relative"
                      style={{
                        width: timelineWidth,
                        height: Math.max(alturaContainer, barHeight + barGap * 2),
                        backgroundImage: mostrarGradeVertical
                          ? `repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent ${dayWidth}px)`
                          : "none",
                        backgroundColor: "transparent",
                      }}
                    >
                    {segmentosMes.map((segmento) => (
                      <div
                        key={`bg-${etapa}-${segmento.inicioIndex}`}
                        className="absolute inset-y-0"
                        style={{
                          left: segmento.inicioIndex * dayWidth,
                          width: segmento.span * dayWidth,
                          backgroundColor:
                            mostrarFaixasMes
                              ? segmento.indice % 2 === 0
                                ? "rgba(15, 23, 42, 0.04)"
                                : "rgba(15, 23, 42, 0.01)"
                              : "transparent",
                          pointerEvents: "none",
                        }}
                      />
                    ))}
                    {trilhos.map((trilho, trilhoIndex) =>
                      trilho.map((tarefa) => {
                        const inicioIndex = Math.max(0, obterIndiceDia(tarefa.inicio));
                        const fimIndex = Math.max(0, obterIndiceDia(tarefa.fim));
                        const span = Math.max(fimIndex - inicioIndex + 1, 1);
                        const left = isCompactLayout ? 0 : inicioIndex * dayWidth;
                        const widthBase = span * dayWidth;
                        const width = isCompactLayout
                          ? timelineWidth
                          : Math.max(widthBase - 6, dayWidth);
                        const top = trilhoIndex * (barHeight + barGap) + barGap;
                        const mostrarTextoBarra = mostrarServicoTexto && !isCompactLayout;
                        return (
                          <div
                            key={`${tarefa.id}-${trilhoIndex}`}
                            className={clsx(
                              "absolute flex items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm",
                              mostrarTextoBarra ? "px-3" : "px-1",
                            )}
                            style={{
                              left,
                              top,
                              width,
                              height: barHeight,
                              backgroundColor: tarefa.color,
                            }}
                            title={`${tarefa.servico} (${tarefa.inicio.toLocaleDateString("pt-BR")} – ${tarefa.fim.toLocaleDateString("pt-BR")})`}
                          >
                            {mostrarTextoBarra ? <span className="truncate">{tarefa.servico}</span> : null}
                          </div>
                        );
                      }),
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
            {mostrarRodape ? (
              <>
                <div className="flex border-t border-[var(--border)]">
                  {labelWidth > 0 ? (
                    <div
                      className="sticky left-0 z-10 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                      style={{ width: labelWidth }}
                    >
                      Dia
                    </div>
                  ) : null}
                  <div className="flex" style={{ width: timelineWidth }}>
                    {intervalo?.dias.map((dia, index) => {
                      const segmentoAtual = segmentosMes.find(
                        (segmento) =>
                          index >= segmento.inicioIndex &&
                          index < segmento.inicioIndex + segmento.span,
                      );
                      const fundoSegmento = segmentoAtual
                        ? segmentoAtual.indice % 2 === 0
                          ? mostrarFaixasMes
                            ? "rgba(15, 23, 42, 0.06)"
                            : "transparent"
                          : mostrarFaixasMes
                            ? "rgba(15, 23, 42, 0.02)"
                            : "transparent"
                        : "transparent";

                      return (
                        <div
                          key={`footer-dia-${index}`}
                          className={`flex h-10 flex-col items-center justify-center text-[0.65rem] font-semibold ${
                            mostrarGradeVertical ? "border-r border-[var(--border)]" : ""
                          } text-foreground-muted`}
                          style={{ width: dayWidth, backgroundColor: fundoSegmento }}
                        >
                          <span>{dia.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex border-t border-[var(--border)]">
                  {labelWidth > 0 ? (
                    <div
                      className="sticky left-0 z-10 bg-card px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                      style={{ width: labelWidth }}
                    >
                      Mês
                    </div>
                  ) : null}
                  <div
                    className="relative h-12 border-b border-[var(--border)]"
                    style={{ width: timelineWidth }}
                  >
                    {segmentosMes.map((segmento) => (
                      <div
                        key={`footer-mes-${segmento.rotulo}-${segmento.inicioIndex}`}
                        className={`absolute top-0 flex h-full items-center justify-center text-xs font-semibold text-foreground ${
                          mostrarGradeVertical ? "border-r border-[var(--border)]" : ""
                        }`}
                        style={{
                          left: segmento.inicioIndex * dayWidth,
                          width: segmento.span * dayWidth,
                          backgroundColor:
                            mostrarFaixasMes
                              ? segmento.indice % 2 === 0
                                ? "rgba(15, 23, 42, 0.06)"
                                : "rgba(15, 23, 42, 0.02)"
                              : "transparent",
                          pointerEvents: "none",
                        }}
                      >
                        {segmento.rotulo}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
        {mostrarResumo ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Mostrando {etapasOrdenadas.length} etapa(s)</span>
            <span className="min-w-[96px] text-right font-semibold text-foreground">
              {segmentosMes[mesVisivelIndex]?.rotulo ?? "Sem meses"}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <section className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">L.O.B</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="unstyled"
              size="sm"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm transition hover:bg-[var(--accent-muted)]"
              onClick={() => setMostrarVisaoCompleta(true)}
              disabled={tarefas.length === 0}
              aria-label="Expandir gráfico"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="unstyled"
              size="sm"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm transition hover:bg-[var(--accent-muted)]"
              onClick={handleExportExcel}
              disabled={tarefas.length === 0 || isExporting}
              aria-label="Exportar planilha do gráfico"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="unstyled"
              size="sm"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
              onClick={() => setMostrarFiltros((prev) => !prev)}
              aria-label={`${mostrarFiltros ? "Ocultar" : "Mostrar"} filtros`}
            >
              {mostrarFiltros ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {mostrarFiltros ? (
          <div className="rounded-2xl border border-[var(--border)] bg-transparent p-3 md:p-4">
            <div className="grid gap-3 rounded-xl bg-card/60 px-4 py-4 md:grid-cols-[repeat(5,minmax(0,1fr))_auto] md:items-end">
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

              <MultiSelectCheckbox
                label="Serviços"
                placeholder="Todos os serviços"
                disabled={tarefasBase.length === 0}
                options={servicosDisponiveis}
                selected={filtroServico}
                onToggle={alternarFiltroServico}
              />

              <MultiSelectCheckbox
                label="Etapas"
                placeholder="Todas as etapas"
                disabled={tarefasBase.length === 0}
                options={etapasDisponiveis}
                selected={filtroEtapa}
                onToggle={alternarFiltroEtapa}
              />

              <label className="flex flex-col gap-2 text-xs text-foreground-muted">
                <span className="font-semibold text-foreground">Data inicial</span>
                <input
                  type="date"
                  className="form-input"
                  value={filtroDataInicial}
                  max={filtroDataFinal || undefined}
                  onChange={(event) => setFiltroDataInicial(event.target.value)}
                  disabled={tarefasBase.length === 0}
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
                  disabled={tarefasBase.length === 0}
                />
              </label>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="unstyled"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-sm hover:bg-[var(--accent-muted)]"
                  aria-label="Aplicar filtros"
                  onClick={aplicarFiltros}
                  disabled={tarefasBase.length === 0 || !obraSelecionada}
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
            Cadastre uma obra para visualizar o gráfico L.O.B.
          </div>
        ) : !obraSelecionada ? (
          <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
            Selecione uma obra para exibir o gráfico L.O.B.
          </div>
        ) : !cronogramaReady ? (
          <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
            Carregando dados do cronograma...
          </div>
        ) : tarefasBase.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
            Importe ou cadastre itens no cronograma para visualizar o gráfico L.O.B.
          </div>
        ) : tarefas.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-card p-10 text-center text-sm text-foreground-muted">
            Ajuste os filtros para exibir resultados no gráfico.
          </div>
        ) : (
          <>
            {renderTimeline({
              containerRef: scrollContainerRef,
              contentRef: timelineContentRef,
              mostrarServicoTexto: true,
              mostrarResumo: true,
              mostrarCabecalhos: true,
              mostrarNomeEtapa: true,
            })}
          </>
        )}
      </section>
      <div className="fixed inset-y-1/2 left-6 z-40 flex -translate-y-1/2 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full border border-[var(--border)] bg-white text-[var(--accent)] shadow-lg hover:bg-[var(--accent-muted)] disabled:opacity-40"
          onClick={irParaMesAnterior}
          disabled={mesVisivelIndex === 0 || segmentosMes.length === 0}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="fixed inset-y-1/2 right-6 z-40 flex -translate-y-1/2 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full border border-[var(--border)] bg-white text-[var(--accent)] shadow-lg hover:bg-[var(--accent-muted)] disabled:opacity-40"
          onClick={irParaMesSeguinte}
          disabled={
            segmentosMes.length === 0 || mesVisivelIndex >= segmentosMes.length - 1
          }
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
      {mostrarVisaoCompleta ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/80">
          <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/95 px-3 py-2 text-xs font-semibold text-foreground shadow pointer-events-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-[var(--border)] bg-white text-[var(--accent)] hover:bg-[var(--accent-muted)]"
              onClick={() => alterarZoom(0.2)}
              aria-label="Aproximar"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center text-xs font-medium">{Math.round(appliedScale * 100)}%</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-[var(--border)] bg-white text-[var(--accent)] hover:bg-[var(--accent-muted)]"
              onClick={() => alterarZoom(-0.2)}
              aria-label="Afastar"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-[var(--border)] bg-white text-[var(--accent)] hover:bg-[var(--accent-muted)]"
              onClick={() => setMostrarVisaoCompleta(false)}
              aria-label="Fechar visualização completa"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <div
              ref={compactWrapperRef}
              className="h-full w-full overflow-auto rounded-3xl border border-[var(--border)] bg-white shadow-inner"
            >
              <div
                ref={compactContentRef}
                className="inline-block origin-top-left"
                style={{
                  transform: `scale(${appliedScale})`,
                  transformOrigin: "top left",
                }}
              >
                {renderTimeline({
                  mostrarResumo: true,
                  mostrarCabecalhos: true,
                  mostrarNomeEtapa: true,
                  mostrarQuantidadeServicos: false,
                  mostrarDiasDetalhados: true,
                  mostrarEtiquetasDias: true,
                  mostrarRodape: true,
                  mostrarFaixasMes: true,
                  mostrarFaixasEtapa: true,
                  mostrarGradeVertical: true,
                  containerRef: compactWrapperRef,
                  contentRef: compactContentRef,
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}

