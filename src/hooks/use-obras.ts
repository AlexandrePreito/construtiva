"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { obraSchema, type Obra } from "@/lib/schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ObraRow = Database["public"]["Tables"]["obras"]["Row"];

type ObraInput = Omit<Obra, "id" | "criadoEm" | "atualizadoEm"> & {
  id?: string;
};

function mapRowToObra(row: ObraRow): Obra {
  const parsed = obraSchema.safeParse({
    id: row.id,
    nome: row.nome ?? "",
    cidade: row.cidade ?? "",
    estado: row.estado ?? "",
    endereco: row.endereco ?? "",
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  });

  if (!parsed.success) {
    return {
      id: row.id,
      nome: row.nome ?? "",
      cidade: row.cidade ?? "",
      estado: row.estado ?? "",
      endereco: row.endereco ?? "",
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
    };
  }

  return parsed.data;
}

function ordenar(obras: Obra[]) {
  return [...obras].sort((a, b) =>
    (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR", { sensitivity: "base" }),
  );
}

export function useObras() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [obras, setObras] = useState<Obra[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from("obras")
      .select("id, nome, cidade, estado, endereco, criado_em, atualizado_em")
      .order("nome", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setObras([]);
    } else {
      setError(null);
      setObras((data ?? []).map(mapRowToObra));
    }
    setIsLoading(false);
    setIsReady(true);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const createObra = useCallback(
    async (obra: ObraInput) => {
      const normalized = obra.nome.trim().toLowerCase();
      if (
        obras.some((item) => item.nome.trim().toLowerCase() === normalized)
      ) {
        return null;
      }

      const id = obra.id ?? crypto.randomUUID();
      const payload = {
        id,
        nome: obra.nome.trim(),
        cidade: obra.cidade?.trim() ?? "",
        estado: obra.estado?.trim().toUpperCase() ?? "",
        endereco: obra.endereco?.trim() ?? "",
      };

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError(userError.message);
        return null;
      }
      const userId = userData?.user?.id;
      if (!userId) {
        setError("Não foi possível identificar o usuário autenticado.");
        return null;
      }

      const { data, error: insertError } = await supabase
        .from("obras")
        .insert({
          id: payload.id,
          nome: payload.nome,
          cidade: payload.cidade,
          estado: payload.estado,
          endereco: payload.endereco,
          created_by: userId,
        } satisfies Database["public"]["Tables"]["obras"]["Insert"])
        .select("id, nome, cidade, estado, endereco, criado_em, atualizado_em")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Não foi possível salvar a obra.");
        return null;
      }

      const novaObra = mapRowToObra(data);
      setObras((current) => ordenar([...current, novaObra]));
      setError(null);
      return novaObra;
    },
    [obras, supabase],
  );

  const updateObra = useCallback(
    async (id: string, dados: Partial<ObraInput>) => {
      const normalized = dados.nome?.trim().toLowerCase();
      if (
        normalized &&
        obras.some(
          (obra) => obra.id !== id && obra.nome.trim().toLowerCase() === normalized,
        )
      ) {
        return false;
      }

      const updates: Database["public"]["Tables"]["obras"]["Update"] = {
        nome: dados.nome?.trim(),
        cidade: dados.cidade?.trim(),
        estado: dados.estado?.trim().toUpperCase(),
        endereco: dados.endereco?.trim(),
        atualizado_em: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("obras")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setObras((current) =>
        ordenar(
          current.map((obra) =>
            obra.id === id
              ? {
                  ...obra,
                  nome: updates.nome ?? obra.nome,
                  cidade: updates.cidade ?? obra.cidade,
                  estado: updates.estado ?? obra.estado,
                  endereco: updates.endereco ?? obra.endereco,
                  atualizadoEm: updates.atualizado_em ?? obra.atualizadoEm,
                }
              : obra,
          ),
        ),
      );

      setError(null);
      return true;
    },
    [obras, supabase],
  );

  const deleteObra = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("obras").delete().eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setObras((current) => current.filter((obra) => obra.id !== id));
      setError(null);
    },
    [supabase],
  );

  const getObra = useCallback(
    (id: string) => obras.find((obra) => obra.id === id),
    [obras],
  );

  const sortedObras = useMemo(() => ordenar(obras), [obras]);

  return {
    obras: sortedObras,
    isReady,
    isLoading,
    error,
    refresh,
    createObra,
    updateObra,
    deleteObra,
    getObra,
  };
}

