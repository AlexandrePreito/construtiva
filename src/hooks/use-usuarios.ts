"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { hashPassword } from "@/lib/security";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type UsuarioAppRegistro = {
  id: string;
  nome: string;
  criadoEm: string;
  criadoPor: string | null;
};

type UsuarioAppRow = Pick<
  Database["public"]["Tables"]["usuarios_app"]["Row"],
  "id" | "nome" | "senha_hash" | "criado_em" | "criado_por"
>;
type UsuarioAppInsert = Database["public"]["Tables"]["usuarios_app"]["Insert"];

function mapUsuarios(rows: UsuarioAppRow[]): UsuarioAppRegistro[] {
  return rows
    .map((row) => ({
      id: row.id,
      nome: row.nome,
      criadoEm: row.criado_em ?? new Date().toISOString(),
      criadoPor: row.criado_por,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export function useUsuariosApp() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [usuarios, setUsuarios] = useState<UsuarioAppRegistro[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from("usuarios_app")
      .select("id, nome, senha_hash, criado_em, criado_por")
      .order("nome", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setUsuarios([]);
    } else {
      setError(null);
      setUsuarios(mapUsuarios(data ?? []));
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

  const createUsuario = useCallback(
    async ({ nome, senha, authUserId }: { nome: string; senha: string; authUserId?: string | null }) => {
      const { data: authData } = await supabase.auth.getUser();
      const sessionUserId = authData?.user?.id ?? null;

      const senhaHash = await hashPassword(senha);

      const payload: UsuarioAppInsert = {
        nome,
        senha_hash: senhaHash,
        auth_user_id: authUserId ?? sessionUserId,
        criado_por: sessionUserId,
        atualizado_por: sessionUserId,
      };

      const { error: insertError } = await supabase.from("usuarios_app").insert(payload);
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }

      await refresh();
    },
    [supabase, refresh],
  );

  const deleteUsuario = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("usuarios_app").delete().eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }

      await refresh();
    },
    [supabase, refresh],
  );

  return {
    usuarios,
    isReady,
    isLoading,
    error,
    refresh,
    createUsuario,
    deleteUsuario,
  };
}
