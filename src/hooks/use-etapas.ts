"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type EtapaRegistro = {
  id: string;
  obraId: string;
  nome: string;
  ordem: number;
  criadoEm: string;
};

type CreatePayload = {
  obraId: string;
  nome: string;
  ordem: number;
};

type UpdatePayload = {
  id: string;
  obraId: string;
  nome: string;
  ordem: number;
  ordemAnterior: number;
};

export function useEtapas(obraId: string | null) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [etapas, setEtapas] = useState<EtapaRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const mapRows = useCallback(
    (rows: Array<{
      id: string;
      obra_id: string;
      nome: string;
      ordem: number;
      criado_em: string;
    }>): EtapaRegistro[] =>
      rows.map((row) => ({
        id: row.id,
        obraId: row.obra_id,
        nome: row.nome,
        ordem: row.ordem,
        criadoEm: row.criado_em,
      })),
    [],
  );

  const refresh = useCallback(
    async (alvoObraId?: string | null) => {
      const efetivaObraId = alvoObraId ?? obraId;
      if (!efetivaObraId) {
        setEtapas([]);
        setIsLoading(false);
        setIsReady(true);
        setLastError(null);
        return;
      }

      setIsReady(false);
      setIsLoading(true);
      const { data, error } = await supabase
        .from("etapas")
        .select("id, obra_id, nome, ordem, criado_em")
        .eq("obra_id", efetivaObraId)
        .order("ordem", { ascending: true })
        .order("nome", { ascending: true });

      if (error) {
        setLastError(error.message);
        setEtapas([]);
      } else {
        setLastError(null);
        setEtapas(mapRows(data ?? []));
      }
      setIsLoading(false);
      setIsReady(true);
    },
    [obraId, supabase, mapRows],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const nomesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    etapas.forEach((etapa) => set.add(etapa.nome));
    return Array.from(set);
  }, [etapas]);

  const handleError = (error: PostgrestError | Error | null) => {
    if (!error) return;
    const message = "message" in error ? error.message : "Operação não concluída.";
    setLastError(message);
    throw error;
  };

  const createEtapa = useCallback(
    async ({ obraId: targetObraId, nome, ordem }: CreatePayload) => {
      if (!targetObraId) {
        throw new Error("Selecione a obra.");
      }
      const { error: shiftError } = await supabase.rpc("shift_etapas_on_insert", {
        p_obra: targetObraId,
        p_ordem: ordem,
      });
      if (shiftError) {
        handleError(shiftError);
      }

      const { error: insertError } = await supabase
        .from("etapas")
        .insert({
          obra_id: targetObraId,
          nome,
          ordem,
        })
        .select()
        .single();

      if (insertError) {
        handleError(insertError);
      }

      await refresh(targetObraId);
    },
    [supabase, refresh],
  );

  const updateEtapa = useCallback(
    async ({ id, obraId: targetObraId, nome, ordem, ordemAnterior }: UpdatePayload) => {
      const nomeLimpo = nome.trim();

      if (ordem === ordemAnterior) {
        const { error: updateError } = await supabase
          .from("etapas")
          .update({ nome: nomeLimpo, ordem })
          .eq("id", id);

        if (updateError) {
          handleError(updateError);
        }

        await refresh(targetObraId);
        return;
      }

      const etapasDaObra = etapas
        .filter((etapa) => etapa.obraId === targetObraId)
        .sort((a, b) => a.ordem - b.ordem);

      const indiceAtual = etapasDaObra.findIndex((etapa) => etapa.id === id);
      if (indiceAtual === -1) {
        throw new Error("Etapa não encontrada para reordenar.");
      }

      const etapaMovida = { ...etapasDaObra[indiceAtual], nome: nomeLimpo };
      etapasDaObra.splice(indiceAtual, 1);

      const destino = Math.max(0, Math.min(etapasDaObra.length, ordem - 1));
      etapasDaObra.splice(destino, 0, etapaMovida);

      const listaFinal = etapasDaObra.map((etapa, index) => ({
        id: etapa.id,
        nome: etapa.id === id ? nomeLimpo : etapa.nome,
        ordem: index + 1,
      }));

      // Fase 1: aplicar valores temporários para evitar conflitos de chave única.
      for (let index = 0; index < listaFinal.length; index += 1) {
        const etapa = listaFinal[index];
        const { error } = await supabase
          .from("etapas")
          .update({ ordem: index + 1000 })
          .eq("id", etapa.id);

        if (error) {
          handleError(error);
        }
      }

      // Fase 2: aplicar a ordem definitiva e nome atualizado.
      for (const etapa of listaFinal) {
        const payload: Record<string, unknown> = {
          ordem: etapa.ordem,
        };
        if (etapa.id === id) {
          payload.nome = etapa.nome;
        }

        const { error } = await supabase.from("etapas").update(payload).eq("id", etapa.id);
        if (error) {
          handleError(error);
        }
      }

      await refresh(targetObraId);
    },
    [supabase, refresh, etapas],
  );

  const deleteEtapas = useCallback(
    async (registros: EtapaRegistro[]) => {
      if (registros.length === 0) return;

      const ids = registros.map((item) => item.id);
      const { error: deleteError } = await supabase.from("etapas").delete().in("id", ids);
      if (deleteError) {
        handleError(deleteError);
      }

      const ordenados = [...registros].sort((a, b) => a.ordem - b.ordem);
      for (const etapa of ordenados) {
        const { error: shiftError } = await supabase.rpc("shift_etapas_on_delete", {
          p_obra: etapa.obraId,
          p_ordem: etapa.ordem,
        });
        if (shiftError) {
          handleError(shiftError);
        }
      }

      const alvo = registros[0]?.obraId ?? obraId ?? null;
      await refresh(alvo);
    },
    [supabase, refresh, obraId],
  );

  return {
    etapas,
    isLoading,
    isReady,
    error: lastError,
    nomesDisponiveis,
    refresh,
    createEtapa,
    updateEtapa,
    deleteEtapas,
  };
}
