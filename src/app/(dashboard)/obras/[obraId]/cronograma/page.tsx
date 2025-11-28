"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FilePlus,
  Hand,
  Loader2,
  RefreshCw,
  Save,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObras } from "@/hooks/use-obras";
import { parseCronogramaFile } from "@/lib/importers/cronograma";
import { useCronograma, type CronogramaLinha } from "@/hooks/use-cronograma";

const templateLines: CronogramaLinha[] = [
  {
    id: "template-1",
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "Térreo",
    dataInicio: "2025-07-04",
    dataFim: "2025-07-31",
  },
  {
    id: "template-2",
    item: "ESTRUTURA",
    servico: "Estrutura",
    etapa: "1º Pavimento",
    dataInicio: "2025-08-04",
    dataFim: "2025-08-18",
  },
];

export default function CronogramaPage({
  params,
}: {
  params: { obraId: string };
}) {
  const router = useRouter();
  const { getObra } = useObras();
  const obra = getObra(params.obraId);
  const {
    linhas,
    isReady,
    isLoading: cronogramaLoading,
    error: cronogramaError,
    resumo,
    replaceLinhas,
    addLinha,
    updateLinha,
    removeLinhas,
    limpar,
  } = useCronograma(obra?.id ?? null);
  const [linhasLocais, setLinhasLocais] = useState<CronogramaLinha[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const [operacaoEmProgresso, setOperacaoEmProgresso] = useState(false);
  const [removendoLinhaId, setRemovendoLinhaId] = useState<string | null>(null);

  useEffect(() => {
    setLinhasLocais(linhas);
  }, [linhas]);

  const servicosUnicos = useMemo(() => {
    const set = new Set<string>();
    linhasLocais.forEach((linha) => set.add(linha.servico));
    return Array.from(set.values());
  }, [linhasLocais]);

  if (!obra) {
    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Obra não encontrada
          </h1>
          <p className="text-base text-foreground-muted">
            Selecione uma obra válida para importar o cronograma.
          </p>
        </header>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="rounded-full px-5"
          onClick={() => router.push("/obras")}
        >
          Voltar para as obras
        </Button>
      </section>
    );
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setErroOperacao(null);
    setUploading(true);

    try {
      const parsed = await parseCronogramaFile(file);
      await replaceLinhas(parsed);
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

  const handleAddLinha = async () => {
    if (!obra) return;
    const novaLinha: CronogramaLinha = {
      id: crypto.randomUUID(),
      item: "",
      servico: servicosUnicos[0] ?? "",
      etapa: "",
      dataInicio: "",
      dataFim: "",
    };

    setLinhasLocais((prev) => [...prev, novaLinha]);
    setOperacaoEmProgresso(true);
    setErroOperacao(null);
    try {
      await addLinha(novaLinha);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível adicionar a linha.";
      setErroOperacao(mensagem);
      setLinhasLocais((prev) => prev.filter((linha) => linha.id !== novaLinha.id));
    } finally {
      setOperacaoEmProgresso(false);
    }
  };

  const handleChangeLinha = (
    linhaId: string,
    campo: keyof Omit<CronogramaLinha, "id">,
    valor: string,
  ) => {
    setLinhasLocais((prev) =>
      prev.map((linha) =>
        linha.id === linhaId ? { ...linha, [campo]: valor } : linha,
      ),
    );
  };

  const handleBlurLinha = async (linhaId: string) => {
    const linhaAtual = linhasLocais.find((linha) => linha.id === linhaId);
    if (!linhaAtual) return;
    const original = linhas.find((linha) => linha.id === linhaId);
    if (
      original &&
      original.item === linhaAtual.item &&
      original.servico === linhaAtual.servico &&
      original.etapa === linhaAtual.etapa &&
      original.dataInicio === linhaAtual.dataInicio &&
      original.dataFim === linhaAtual.dataFim
    ) {
      return;
    }

    setErroOperacao(null);
    try {
      await updateLinha(linhaId, {
        item: linhaAtual.item,
        servico: linhaAtual.servico,
        etapa: linhaAtual.etapa,
        dataInicio: linhaAtual.dataInicio,
        dataFim: linhaAtual.dataFim,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível salvar a linha.";
      setErroOperacao(mensagem);
      if (original) {
        setLinhasLocais((prev) =>
          prev.map((linha) => (linha.id === linhaId ? { ...original } : linha)),
        );
      }
    }
  };

  const handleDeleteLinha = async (linhaId: string) => {
    const anterior = linhasLocais.map((linha) => ({ ...linha }));
    setLinhasLocais((prev) => prev.filter((linha) => linha.id !== linhaId));
    setRemovendoLinhaId(linhaId);
    setErroOperacao(null);
    try {
      await removeLinhas([linhaId]);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível excluir a linha.";
      setErroOperacao(mensagem);
      setLinhasLocais(anterior);
    } finally {
      setRemovendoLinhaId(null);
    }
  };

  const handleAplicarTemplate = async () => {
    setOperacaoEmProgresso(true);
    setErroOperacao(null);
    const novas = templateLines.map((linha) => ({
      ...linha,
      id: crypto.randomUUID(),
    }));
    setLinhasLocais(novas);
    try {
      await replaceLinhas(novas);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível aplicar o template.";
      setErroOperacao(mensagem);
      setLinhasLocais(linhas);
    } finally {
      setOperacaoEmProgresso(false);
    }
  };

  const handleLimpar = async () => {
    setOperacaoEmProgresso(true);
    setErroOperacao(null);
    try {
      await limpar();
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível limpar o cronograma.";
      setErroOperacao(mensagem);
    } finally {
      setOperacaoEmProgresso(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Cronograma • {obra.nome}
          </h1>
          <p className="mt-2 max-w-3xl text-base text-foreground-muted">
            Importe a planilha para visualizar, editar etapas e preparar o
            gráfico de Gantt. O salvamento é automático.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/obras/${obra.id}`} className="inline-flex">
            <Button variant="ghost" className="rounded-full text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full px-4"
            onClick={handleAplicarTemplate}
          >
            <Download className="h-4 w-4" />
            Carregar exemplo
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="rounded-full px-4"
            onClick={async () => {
              const confirmar = window.confirm(
                "Deseja limpar todas as linhas importadas desta obra?",
              );
              if (!confirmar) return;
              await handleLimpar();
            }}
            disabled={operacaoEmProgresso || cronogramaLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Limpar tudo
          </Button>
        </div>
      </header>

      <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              1. Importar planilha
            </h2>
            <p className="text-sm text-foreground-muted">
              Formatos aceitos: XLSX ou CSV com colunas para Item, Serviço,
              Etapa, Data Inicial e Data Término.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="rounded-full px-5"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              <UploadCloud className="h-4 w-4" />
              Selecionar arquivo
            </Button>
          </div>
        </div>
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
        {!isReady || cronogramaLoading ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-sm text-foreground-muted">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            Carregando cronograma salvo...
          </div>
        ) : null}
      </div>

      <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              2. Revisar e editar etapas
            </h2>
            <p className="text-sm text-foreground-muted">
              Clique nos campos para editar. Alterações são salvas
              automaticamente para esta obra.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full px-4"
              onClick={handleAddLinha}
              disabled={operacaoEmProgresso || cronogramaLoading}
            >
              <FilePlus className="h-4 w-4" />
              Adicionar linha
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full px-4 text-sm font-semibold text-foreground"
              onClick={handleAplicarTemplate}
              disabled={operacaoEmProgresso || cronogramaLoading}
            >
              <Hand className="h-4 w-4" />
              Sugestão de etapas
            </Button>
          </div>
        </div>

        {linhasLocais.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-surface/60 p-10 text-center text-sm text-foreground-muted">
            Nenhuma linha importada ainda. Use o botão acima para carregar um
            arquivo ou inserir etapas manualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-foreground-muted">
                  <th className="rounded-l-xl bg-surface/70 px-4 py-3 font-semibold">
                    Item
                  </th>
                  <th className="bg-surface/70 px-4 py-3 font-semibold">
                    Serviço
                  </th>
                  <th className="bg-surface/70 px-4 py-3 font-semibold">
                    Etapa
                  </th>
                  <th className="bg-surface/70 px-4 py-3 font-semibold">
                    Data início
                  </th>
                  <th className="bg-surface/70 px-4 py-3 font-semibold">
                    Data fim
                  </th>
                  <th className="rounded-r-xl bg-surface/70 px-4 py-3 text-right font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhasLocais.map((linha) => (
                  <tr
                    key={linha.id}
                    className="rounded-xl border border-[var(--border)] bg-white shadow-sm"
                  >
                    <td className="rounded-l-xl px-4 py-4 align-top">
                      <input
                        value={linha.item}
                        onChange={(event) =>
                          handleChangeLinha(linha.id, "item", event.target.value)
                        }
                        onBlur={() => handleBlurLinha(linha.id)}
                        className="form-input h-10 rounded-lg bg-white"
                        placeholder="Item"
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        value={linha.servico}
                        onChange={(event) =>
                          handleChangeLinha(
                            linha.id,
                            "servico",
                            event.target.value,
                          )
                        }
                        onBlur={() => handleBlurLinha(linha.id)}
                        className="form-input h-10 rounded-lg bg-white"
                        placeholder="Serviço"
                        list={`servico-sugestoes-${obra.id}`}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        value={linha.etapa}
                        onChange={(event) =>
                          handleChangeLinha(
                            linha.id,
                            "etapa",
                            event.target.value,
                          )
                        }
                        onBlur={() => handleBlurLinha(linha.id)}
                        className="form-input h-10 rounded-lg bg-white"
                        placeholder="Etapa"
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        type="date"
                        value={linha.dataInicio}
                        onChange={(event) =>
                          handleChangeLinha(
                            linha.id,
                            "dataInicio",
                            event.target.value,
                          )
                        }
                        onBlur={() => handleBlurLinha(linha.id)}
                        className="form-input h-10 rounded-lg bg-white"
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input
                        type="date"
                        value={linha.dataFim}
                        onChange={(event) =>
                          handleChangeLinha(
                            linha.id,
                            "dataFim",
                            event.target.value,
                          )
                        }
                        onBlur={() => handleBlurLinha(linha.id)}
                        className="form-input h-10 rounded-lg bg-white"
                      />
                    </td>
                    <td className="rounded-r-xl px-4 py-4 align-top text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger)]/30"
                        onClick={() => void handleDeleteLinha(linha.id)}
                        disabled={removendoLinhaId === linha.id}
                      >
                        <X className="h-3.5 w-3.5" />
                        {removendoLinhaId === linha.id ? "Removendo..." : "Remover"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id={`servico-sugestoes-${obra.id}`}>
              {servicosUnicos.map((servico) => (
                <option key={servico} value={servico} />
              ))}
            </datalist>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <article className="space-y-6 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Resumo do cronograma
              </h2>
              <p className="text-sm text-foreground-muted">
                Dados atualizados automaticamente conforme você edita.
              </p>
            </div>
            <span className="rounded-full bg-[var(--accent-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              Auto-save
            </span>
          </header>

          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">
                Linhas
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {linhas.length}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">
                Dias totais
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {resumo.totalDias}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">
                Serviços únicos
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {servicosUnicos.length}
              </dd>
            </div>
          </dl>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Serviços identificados
            </h3>
            {resumo.servicos.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                Nenhum serviço listado até o momento.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {resumo.servicos.map((item) => (
                  <li
                    key={item.servico}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {item.servico}
                    </span>
                    <span className="text-xs font-semibold text-foreground-muted">
                      {item.quantidade} etapa(s)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <aside className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Próximos passos</h2>
          <ol className="space-y-3 text-sm text-foreground-muted">
            <li className="flex items-start gap-3">
              <Save className="mt-1 h-4 w-4 text-[var(--accent)]" />
              <span>
                Personalize os serviços na aba{" "}
                <Link
                  href="/servicos"
                  className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  Serviços
                </Link>{" "}
                para aplicar cores ao gráfico de Gantt.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-1 h-4 w-4 text-[var(--accent)]" />
              <span>
                Gere o gráfico de Gantt acessando a aba dedicada e exporte em PDF
                para gestão à vista.
              </span>
            </li>
          </ol>
        </aside>
      </div>
    </section>
  );
}

