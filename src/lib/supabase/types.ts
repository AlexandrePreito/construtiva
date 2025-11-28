export type Database = {
  public: {
    Tables: {
      obras: {
        Row: {
          id: string;
          nome: string | null;
          cidade: string | null;
          estado: string | null;
          endereco: string | null;
          criado_em: string | null;
          atualizado_em: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome?: string | null;
          cidade?: string | null;
          estado?: string | null;
          endereco?: string | null;
          criado_em?: string | null;
          atualizado_em?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          nome?: string | null;
          cidade?: string | null;
          estado?: string | null;
          endereco?: string | null;
          criado_em?: string | null;
          atualizado_em?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      servicos: {
        Row: {
          id: string;
          obra_id: string;
          nome: string | null;
          cor_hex: string | null;
          agrupador_id: string | null;
          criado_em: string | null;
        };
        Insert: {
          id?: string;
          obra_id: string;
          nome?: string | null;
          cor_hex?: string | null;
          agrupador_id?: string | null;
          criado_em?: string | null;
        };
        Update: {
          id?: string;
          obra_id?: string;
          nome?: string | null;
          cor_hex?: string | null;
          agrupador_id?: string | null;
          criado_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "servicos_obra_id_fkey";
            columns: ["obra_id"];
            referencedRelation: "obras";
            referencedColumns: ["id"];
          },
        ];
      };
      itens: {
        Row: {
          id: string;
          obra_id: string;
          nome: string | null;
          descricao: string | null;
          criado_em: string | null;
        };
        Insert: {
          id?: string;
          obra_id: string;
          nome?: string | null;
          descricao?: string | null;
          criado_em?: string | null;
        };
        Update: {
          id?: string;
          obra_id?: string;
          nome?: string | null;
          descricao?: string | null;
          criado_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "itens_obra_id_fkey";
            columns: ["obra_id"];
            referencedRelation: "obras";
            referencedColumns: ["id"];
          },
        ];
      };
      cronograma_linhas: {
        Row: {
          id: string;
          obra_id: string;
          item: string | null;
          servico: string | null;
          etapa: string | null;
          data_inicio: string | null;
          data_fim: string | null;
          criado_em: string | null;
        };
        Insert: {
          id?: string;
          obra_id: string;
          item?: string | null;
          servico?: string | null;
          etapa?: string | null;
          data_inicio?: string | null;
          data_fim?: string | null;
          criado_em?: string | null;
        };
        Update: {
          id?: string;
          obra_id?: string;
          item?: string | null;
          servico?: string | null;
          etapa?: string | null;
          data_inicio?: string | null;
          data_fim?: string | null;
          criado_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cronograma_linhas_obra_id_fkey";
            columns: ["obra_id"];
            referencedRelation: "obras";
            referencedColumns: ["id"];
          },
        ];
      };
      etapas: {
        Row: {
          id: string;
          obra_id: string;
          nome: string;
          ordem: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          obra_id: string;
          nome: string;
          ordem: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          obra_id?: string;
          nome?: string;
          ordem?: number;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "etapas_obra_id_fkey";
            columns: ["obra_id"];
            referencedRelation: "obras";
            referencedColumns: ["id"];
          },
        ];
      };
      usuarios_app: {
        Row: {
          id: string;
          auth_user_id: string | null;
          nome: string;
          senha_hash: string;
          criado_em: string;
          atualizado_em: string;
          criado_por: string | null;
          atualizado_por: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          nome: string;
          senha_hash: string;
          criado_em?: string;
          atualizado_em?: string;
          criado_por?: string | null;
          atualizado_por?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          nome?: string;
          senha_hash?: string;
          criado_em?: string;
          atualizado_em?: string;
          criado_por?: string | null;
          atualizado_por?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      shift_etapas_on_insert: {
        Args: { p_obra: string; p_ordem: number };
        Returns: null;
      };
      shift_etapas_on_update: {
        Args: { p_obra: string; p_nova: number; p_antiga: number; p_id: string };
        Returns: null;
      };
      shift_etapas_on_delete: {
        Args: { p_obra: string; p_ordem: number };
        Returns: null;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};


