"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type ServicoRegistro = {
  id: string;
  obraId: string;
  nome: string;
  corHex: string;
  criadoEm: string;
  agrupamentoId: string | null;
  filhos?: ServicoRegistro[];
};

type ServicoRow = Database["public"]["Tables"]["servicos"]["Row"] & {
  agrupador_id?: string | null;
};

function mapServicos(rows: ServicoRow[]): ServicoRegistro[] {
  const registros = rows.map<ServicoRegistro>((row) => ({
    id: row.id,
    obraId: row.obra_id,
    nome: row.nome ?? "Serviço sem nome",
    corHex: row.cor_hex ?? "#2563EB",
    criadoEm: row.criado_em ?? new Date().toISOString(),
    agrupamentoId: row.agrupador_id ?? null,
  }));

  const porId = new Map<string, ServicoRegistro>();
  registros.forEach((servico) => {
    porId.set(servico.id, { ...servico });
  });

  const resultado: ServicoRegistro[] = [];

  porId.forEach((servico) => {
    if (servico.agrupamentoId && porId.has(servico.agrupamentoId)) {
      const pai = porId.get(servico.agrupamentoId)!;
      if (!pai.filhos) {
        pai.filhos = [];
      }
      pai.filhos.push(servico);
      return;
    }
    resultado.push(servico);
  });

  resultado.forEach((servico) => {
    if (servico.filhos?.length) {
      servico.filhos = servico.filhos
        .map((filho) => (porId.get(filho.id) ?? filho))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }
  });

  return resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function useServicos(obraId: string | null) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [servicos, setServicos] = useState<ServicoRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (targetObra?: string | null) => {
      const obraAlvo = targetObra ?? obraId;
      if (!obraAlvo) {
        setServicos([]);
        setIsReady(true);
        setError(null);
        return;
      }

      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from("servicos")
        .select("id, obra_id, nome, cor_hex, criado_em, agrupador_id")
        .eq("obra_id", obraAlvo)
        .order("nome", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setServicos([]);
      } else {
        setError(null);
        setServicos(mapServicos(data ?? []));
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

  const createServico = useCallback(
    async ({ obraId: targetObraId, nome, corHex }: { obraId: string; nome: string; corHex: string }) => {
      const { error: insertError } = await supabase.from("servicos").insert({
        obra_id: targetObraId,
        nome,
        cor_hex: corHex,
      });
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      await refresh(targetObraId);
    },
    [supabase, refresh],
  );

  const updateServico = useCallback(
    async ({ id, nome, corHex }: { id: string; nome: string; corHex: string }) => {
      const { error: updateError } = await supabase
        .from("servicos")
        .update({ nome, cor_hex: corHex })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      await refresh();
    },
    [supabase, refresh],
  );

  const deleteServicos = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      const { error: clearError } = await supabase
        .from("servicos")
        .update({ agrupador_id: null })
        .in("agrupador_id", ids);

      if (clearError) {
        setError(clearError.message);
        throw clearError;
      }

      const { error: deleteError } = await supabase.from("servicos").delete().in("id", ids);
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }

      await refresh();
    },
    [supabase, refresh],
  );

  const createAgrupamento = useCallback(
    async ({ obraId: targetObraId, nome, corHex }: { obraId: string; nome: string; corHex: string }) => {
      const agrupamentoId =
        typeof window !== "undefined" && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : Math.random().toString(36).slice(2, 11);

      const { error } = await supabase
        .from("servicos")
        .insert({ id: agrupamentoId, obra_id: targetObraId, nome, cor_hex: corHex, agrupador_id: null });

      if (error) {
        setError(error.message);
        throw error;
      }

      await refresh(targetObraId);
      return agrupamentoId;
    },
    [supabase, refresh],
  );

  const addChildToGroup = useCallback(
    async ({
      servicoId,
      agrupamentoId,
      obraId: targetObraId,
    }: {
      servicoId: string;
      agrupamentoId: string;
      obraId: string;
    }) => {
      const { error } = await supabase
        .from("servicos")
        .update({ agrupador_id: agrupamentoId })
        .eq("id", servicoId);

      if (error) {
        setError(error.message);
        throw error;
      }

      await refresh(targetObraId);
    },
    [supabase, refresh],
  );

  const removeChildFromGroup = useCallback(
    async ({ servicoId, obraId: targetObraId }: { servicoId: string; obraId: string }) => {
      const { error } = await supabase
        .from("servicos")
        .update({ agrupador_id: null })
        .eq("id", servicoId);

      if (error) {
        setError(error.message);
        throw error;
      }

      await refresh(targetObraId);
    },
    [supabase, refresh],
  );

  const ungroupServico = useCallback(
    async ({ servicoId, obraId: targetObraId }: { servicoId: string; obraId: string }) => {
      await removeChildFromGroup({ servicoId, obraId: targetObraId });
    },
    [removeChildFromGroup],
  );

  const nomesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((servico) => set.add(servico.nome));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  }, [servicos]);

  return {
    servicos,
    isReady,
    isLoading,
    error,
    nomesDisponiveis,
    refresh,
    createServico,
    updateServico,
    deleteServicos,
    createAgrupamento,
    addChildToGroup,
    removeChildFromGroup,
    ungroupServico,
  };
}