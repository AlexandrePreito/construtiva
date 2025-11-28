"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Save, Trash2, X } from "lucide-react";
import { useObras } from "@/hooks/use-obras";
import { Button } from "@/components/ui/button";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import {
  BRAZIL_STATE_CODES,
  brazilStates,
  type BrazilState,
} from "@/lib/brazil-locations";

const stateEnum = z.enum(BRAZIL_STATE_CODES);

const optionalCity = z
  .string()
  .max(80, "Cidade muito longa")
  .refine(
    (value) => value.trim().length === 0 || value.trim().length >= 2,
    "Informe ao menos 2 caracteres",
  );

const optionalAddress = z
  .string()
  .max(160, "Endereço muito longo")
  .refine(
    (value) => value.trim().length === 0 || value.trim().length >= 5,
    "Informe ao menos 5 caracteres",
  );

const formSchema = z.object({
  nome: z
    .string()
    .min(3, "Informe ao menos 3 caracteres")
    .max(120, "Nome muito longo"),
  estado: z.union([stateEnum, z.literal("")]),
  cidade: optionalCity,
  endereco: optionalAddress,
});

type FormValues = z.infer<typeof formSchema>;

export default function EditarObraPage({
  params,
}: {
  params: { obraId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getObra, updateObra, deleteObra } = useObras();
  const obra = getObra(params.obraId);

  const foiCriadaAgora = searchParams.get("created") === "1";

  const mensagemTopo = useMemo(() => {
    if (!obra) return null;
    if (foiCriadaAgora) {
      return {
        icon: CheckCircle2,
        mensagem: "Obra criada com sucesso! Você já pode importar o cronograma.",
        cor: "text-[var(--success)]",
      };
    }
    return null;
  }, [obra, foiCriadaAgora]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: obra
      ? {
          nome: obra.nome,
          estado: obra.estado ?? "",
          cidade: obra.cidade ?? "",
          endereco: obra.endereco ?? "",
        }
      : undefined,
  });

  const { register, handleSubmit, watch, setValue, setError, formState } = form;

  const estadoSelecionado = watch("estado");
  const cidadeSelecionada = watch("cidade");

  const estadoAtual: BrazilState | undefined = useMemo(
    () => brazilStates.find((estado) => estado.uf === estadoSelecionado),
    [estadoSelecionado],
  );

  useEffect(() => {
    if (!estadoAtual && cidadeSelecionada) {
      setValue("cidade", "");
      return;
    }

    if (
      estadoAtual &&
      cidadeSelecionada &&
      !estadoAtual.cidades.includes(cidadeSelecionada)
    ) {
      setValue("cidade", "");
    }
  }, [estadoAtual, cidadeSelecionada, setValue]);

  if (!obra) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-foreground">
            Obra não encontrada
          </h1>
          <p className="mt-2 max-w-2xl text-base text-foreground-muted">
            Verifique se o link está correto ou cadastre uma nova obra no painel.
          </p>
        </header>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="rounded-full px-5"
          onClick={() => router.push("/obras")}
        >
          Voltar para a lista de obras
        </Button>
      </section>
    );
  }

  const onSubmit = handleSubmit(async (data) => {
    const atualizado = await updateObra(obra.id, {
      nome: data.nome.trim(),
      estado: data.estado ? data.estado.toUpperCase() : "",
      cidade: data.cidade.trim(),
      endereco: data.endereco.trim(),
    });

    if (!atualizado) {
      setError("nome", {
        type: "manual",
        message: "Já existe uma obra cadastrada com esse nome.",
      });
      return;
    }

    router.push("/obras");
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {obra.nome}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-sm font-semibold text-foreground hover:text-[var(--danger)]"
            onClick={() => router.push("/obras")}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="rounded-full px-4"
            onClick={() => {
              if (
                window.confirm(
                  `Tem certeza que deseja remover a obra "${obra.nome}"?`,
                )
              ) {
                void (async () => {
                  await deleteObra(obra.id);
                  router.push("/obras");
                })();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {mensagemTopo ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--accent-muted)]/60 px-6 py-4">
          <mensagemTopo.icon className={cn("h-5 w-5", mensagemTopo.cor)} />
          <p className="text-sm font-semibold text-foreground">
            {mensagemTopo.mensagem}
          </p>
        </div>
      ) : null}

      <form
        className="space-y-8 rounded-2xl border border-[var(--border)] bg-card p-8 shadow-sm"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label="Nome da obra"
            description="Como a obra é identificada internamente?"
            error={formState.errors.nome?.message}
          >
            <input
              id="nome"
              {...register("nome")}
              className="form-input"
              placeholder="Ex.: Residencial Aurora"
            />
          </Field>

          <Field
            label="Estado"
            optional
            description="Selecione a UF. Você pode deixar vazio caso ainda não saiba."
            error={formState.errors.estado?.message}
          >
            <select
              id="estado"
              {...register("estado")}
              className="form-input"
            >
              <option value="">Selecione o estado</option>
              {brazilStates.map((estado) => (
                <option key={estado.uf} value={estado.uf}>
                  {estado.nome} ({estado.uf})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Cidade"
            optional
            description="Escolha uma cidade vinculada ao estado selecionado."
            error={formState.errors.cidade?.message}
          >
            <select
              id="cidade"
              {...register("cidade")}
              className="form-input"
              disabled={!estadoAtual}
            >
              <option value="">
                {estadoAtual
                  ? "Selecione a cidade"
                  : "Selecione um estado primeiro"}
              </option>
              {estadoAtual?.cidades.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Endereço completo"
            optional
            description="Rua, número, complemento e bairro (opcional)."
            error={formState.errors.endereco?.message}
            className="md:col-span-2"
          >
            <input
              id="endereco"
              {...register("endereco")}
              className="form-input"
              placeholder="Rua, número, bairro"
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-sm font-semibold text-foreground hover:text-[var(--danger)]"
            onClick={() => router.push("/obras")}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            className="rounded-full px-5"
            loading={formState.isSubmitting}
            disabled={!formState.isDirty}
          >
            <Save className="h-4 w-4" />
            Salvar alterações
          </Button>
        </div>
      </form>

      <aside className="space-y-4 rounded-2xl border border-[var(--border)] bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Próximas ações</h2>
        <ul className="space-y-3 text-sm text-foreground-muted">
          <li className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
            Importar cronograma e conferir datas antes de publicar para a equipe.
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
            Definir serviços e cores para destacar o Gantt impresso.
          </li>
        </ul>
      </aside>
    </section>
  );
}

interface FieldProps extends PropsWithChildren {
  label: string;
  description?: string;
  error?: string;
  optional?: boolean;
  className?: string;
}

function Field({
  label,
  description,
  error,
  optional = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="form-label">
          {label}
          {optional ? (
            <span className="ml-2 text-xs font-normal text-foreground-muted">
              (opcional)
            </span>
          ) : null}
        </label>
        {error ? (
          <span className="text-xs font-semibold text-[var(--danger)]">
            {error}
          </span>
        ) : null}
      </div>
      {children}
      {description ? (
        <p className="form-helper">{description}</p>
      ) : error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}

