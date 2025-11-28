"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type ItemRegistro = {
  id: string;
  obraId: string;
  nome: string;
  descricao: string;
  criadoEm: string;
};

type ItemRow = Database["public"]["Tables"]["itens"]["Row"];

function mapItens(rows: ItemRow[]): ItemRegistro[] {
  return rows
    .map((row) => ({
      id: row.id,
      obraId: row.obra_id,
      nome: row.nome ?? "Item sem nome",
      descricao: row.descricao ?? "",
      criadoEm: row.criado_em ?? new Date().toISOString(),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export const useItens = (obraId: string | null) => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [itens, setItens] = useState<ItemRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (targetObra?: string | null) => {
      const obraAlvo = targetObra ?? obraId;
      if (!obraAlvo) {
        setItens([]);
        setIsReady(true);
        setError(null);
        return;
      }

      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from("itens")
        .select("id, obra_id, nome, descricao, criado_em")
        .eq("obra_id", obraAlvo)
        .order("nome", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setItens([]);
      } else {
        setError(null);
        setItens(mapItens(data ?? []));
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

  const createItem = useCallback(
    async ({ obraId: targetObraId, nome, descricao }: { obraId: string; nome: string; descricao: string }) => {
      const { error: insertError } = await supabase.from("itens").insert({
        obra_id: targetObraId,
        nome,
        descricao,
      });
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      await refresh(targetObraId);
    },
    [supabase, refresh],
  );

  const updateItem = useCallback(
    async ({ id, nome, descricao }: { id: string; nome: string; descricao: string }) => {
      const { error: updateError } = await supabase
        .from("itens")
        .update({ nome, descricao })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }

      await refresh();
    },
    [supabase, refresh],
  );

  const deleteItens = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error: deleteError } = await supabase.from("itens").delete().in("id", ids);
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }
      await refresh();
    },
    [supabase, refresh],
  );

  const nomesDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    itens.forEach((item) => conjunto.add(item.nome));
    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  }, [itens]);

  return {
    itens,
    isReady,
    isLoading,
    error,
    nomesDisponiveis,
    refresh,
    createItem,
    updateItem,
    deleteItens,
  };
};
