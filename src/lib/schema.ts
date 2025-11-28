import { z } from "zod";

export const obraSchema = z.object({
  id: z.string().uuid("ID inválido"),
  nome: z.string().min(2, "Informe o nome da obra"),
  cidade: z
    .string()
    .min(2, "Informe a cidade")
    .or(z.literal(""))
    .default(""),
  estado: z
    .string()
    .length(2, "Use a sigla do estado")
    .or(z.literal(""))
    .default("")
    .transform((value) => value.toUpperCase()),
  endereco: z
    .string()
    .min(5, "Informe o endereço completo")
    .or(z.literal(""))
    .default(""),
  criadoEm: z.string().datetime().nullable(),
  atualizadoEm: z.string().datetime().nullable(),
});

export const servicoSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  nome: z.string().min(2),
  corHex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida"),
  grupoId: z.string().uuid().nullable(),
  ordem: z.number().int().nonnegative(),
  criadoEm: z.string().datetime().nullable(),
  atualizadoEm: z.string().datetime().nullable(),
});

export const etapaSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  titulo: z.string().min(2),
  descricao: z.string().nullable(),
  ordem: z.number().int().nonnegative(),
  criadoEm: z.string().datetime().nullable(),
  atualizadoEm: z.string().datetime().nullable(),
});

export const cronogramaItemSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  servicoId: z.string().uuid(),
  etapaId: z.string().uuid(),
  item: z.string().nullable(),
  dataInicio: z.string().date("Data de início inválida"),
  dataFim: z.string().date("Data de término inválida"),
  origemImportacao: z.enum(["xlsx", "csv", "manual"]),
  criadoPor: z.string().uuid(),
  criadoEm: z.string().datetime().nullable(),
  atualizadoEm: z.string().datetime().nullable(),
});

export const serviceGroupSchema = z.object({
  id: z.string().uuid(),
  obraId: z.string().uuid(),
  nome: z.string().min(2),
  corHex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida")
    .optional(),
  criadoEm: z.string().datetime().nullable(),
  atualizadoEm: z.string().datetime().nullable(),
});

export const userRoleSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(2),
  nome: z.string().min(2),
  permissoes: z
    .array(
      z.enum([
        "cadastrar_obra",
        "editar_obra",
        "importar_cronograma",
        "gerar_relatorio",
        "validar_etapa",
        "gerenciar_servicos",
        "gerenciar_usuarios",
      ]),
    )
    .default([]),
  padrao: z.boolean().default(false),
});

export const accessLogSchema = z.object({
  id: z.string().uuid(),
  usuarioId: z.string().uuid(),
  obraId: z.string().uuid().nullable(),
  acao: z
    .enum([
      "login",
      "logout",
      "criar_obra",
      "editar_obra",
      "importar_planilha",
      "atualizar_etapa",
      "gerar_pdf",
      "gerenciar_usuario",
    ])
    .default("login"),
  detalhes: z.record(z.string(), z.unknown()).optional(),
  criadoEm: z.string().datetime().nullable(),
});

export const stageValidationSchema = z.object({
  id: z.string().uuid(),
  cronogramaItemId: z.string().uuid(),
  validadoPor: z.string().uuid(),
  status: z.enum(["pendente", "concluido", "bloqueado"]),
  dataValidacao: z.string().datetime().nullable(),
  observacoes: z.string().nullable(),
  fotos: z.array(z.string().url()).default([]),
  origem: z.enum(["mobile", "web"]).default("mobile"),
});

export type Obra = z.infer<typeof obraSchema>;
export type Servico = z.infer<typeof servicoSchema>;
export type Etapa = z.infer<typeof etapaSchema>;
export type CronogramaItem = z.infer<typeof cronogramaItemSchema>;
export type ServiceGroup = z.infer<typeof serviceGroupSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type AccessLog = z.infer<typeof accessLogSchema>;
export type StageValidation = z.infer<typeof stageValidationSchema>;

