"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type CronogramaLinha = {
  id: string;
  item: string;
  servico: string;
  etapa: string;
  dataInicio: string;
  dataFim: string;
};

type CronogramaRow = Database["public"]["Tables"]["cronograma_linhas"]["Row"];

function mapLinhas(rows: CronogramaRow[]): CronogramaLinha[] {
  return rows
    .map((row) => ({
      id: row.id,
      item: row.item ?? "Item não informado",
      servico: row.servico ?? "Serviço não informado",
      etapa: row.etapa ?? "",
      dataInicio: row.data_inicio ?? "",
      dataFim: row.data_fim ?? "",
    }))
    .sort((a, b) => a.item.localeCompare(b.item, "pt-BR", { sensitivity: "base" }));
}

export function useCronograma(obraId: string | null | undefined) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [linhas, setLinhas] = useState<CronogramaLinha[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (targetObra?: string | null | undefined) => {
      const obraAlvo = targetObra ?? obraId;
      if (!obraAlvo) {
        setLinhas([]);
        setIsReady(true);
        setError(null);
        return;
      }

      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from("cronograma_linhas")
        .select("id, obra_id, item, servico, etapa, data_inicio, data_fim, criado_em")
        .eq("obra_id", obraAlvo)
        .order("data_inicio", { ascending: true })
        .order("item", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setLinhas([]);
      } else {
        setError(null);
        setLinhas(mapLinhas(data ?? []));
      }
      setIsLoading(false);
      setIsReady(true);
    },
    [obraId, supabase],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const replaceLinhas = useCallback(
    async (novas: CronogramaLinha[]) => {
      if (!obraId) throw new Error("Selecione a obra.");

      const payload = novas.map((linha) => ({
        id: linha.id,
        obra_id: obraId,
        item: linha.item,
        servico: linha.servico,
        etapa: linha.etapa,
        data_inicio: linha.dataInicio || null,
        data_fim: linha.dataFim || null,
      }));

      setIsLoading(true);
      const { error: deleteError } = await supabase
        .from("cronograma_linhas")
        .delete()
        .eq("obra_id", obraId);

      if (deleteError) {
        setError(deleteError.message);
        setIsLoading(false);
        throw deleteError;
      }

      if (payload.length > 0) {
        const { error: insertError } = await supabase.from("cronograma_linhas").insert(payload);
        if (insertError) {
          setError(insertError.message);
          setIsLoading(false);
          throw insertError;
        }
      }

      await refresh(obraId);
      setIsLoading(false);
    },
    [obraId, supabase, refresh],
  );

  const addLinha = useCallback(
    async (linha: CronogramaLinha) => {
      if (!obraId) throw new Error("Selecione a obra.");
      const payload = {
        id: linha.id,
        obra_id: obraId,
        item: linha.item,
        servico: linha.servico,
        etapa: linha.etapa,
        data_inicio: linha.dataInicio || null,
        data_fim: linha.dataFim || null,
      };
      const { error: insertError } = await supabase.from("cronograma_linhas").insert(payload);
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      await refresh(obraId);
    },
    [obraId, supabase, refresh],
  );

  const updateLinha = useCallback(
    async (id: string, dados: Partial<CronogramaLinha>) => {
      const payload = {
        item: dados.item,
        servico: dados.servico,
        etapa: dados.etapa,
        data_inicio: dados.dataInicio ?? null,
        data_fim: dados.dataFim ?? null,
      };

      const { error: updateError } = await supabase
        .from("cronograma_linhas")
        .update(payload)
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }

      await refresh();
    },
    [supabase, refresh],
  );

  const removeLinhas = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error: deleteError } = await supabase
        .from("cronograma_linhas")
        .delete()
        .in("id", ids);
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }
      await refresh();
    },
    [supabase, refresh],
  );

  const limpar = useCallback(async () => {
    if (!obraId) return;
    const { error: deleteError } = await supabase
      .from("cronograma_linhas")
      .delete()
      .eq("obra_id", obraId);
    if (deleteError) {
      setError(deleteError.message);
      throw deleteError;
    }
    await refresh(obraId);
  }, [supabase, obraId, refresh]);

  const resumo = useMemo(() => {
    const totalDias = linhas.reduce((acc, linha) => {
      const inicio = linha.dataInicio ? new Date(linha.dataInicio) : null;
      const fim = linha.dataFim ? new Date(linha.dataFim) : null;
      if (!inicio || !fim) return acc;
      const diff = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      return acc + (Number.isFinite(diff) ? Math.max(diff + 1, 0) : 0);
    }, 0);
    const porServico = new Map<string, number>();
    linhas.forEach((linha) => {
      porServico.set(linha.servico, (porServico.get(linha.servico) ?? 0) + 1);
    });
    return {
      totalLinhas: linhas.length,
      totalDias,
      servicos: Array.from(porServico.entries()).map(([servico, quantidade]) => ({
        servico,
        quantidade,
      })),
    };
  }, [linhas]);

  return {
    linhas,
    isReady,
    isLoading,
    error,
    resumo,
    refresh,
    replaceLinhas,
    addLinha,
    updateLinha,
    removeLinhas,
    limpar,
  };
}
