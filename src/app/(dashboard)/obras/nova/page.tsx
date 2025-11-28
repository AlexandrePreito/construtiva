"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObras } from "@/hooks/use-obras";
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

export default function NovaObraPage() {
  const router = useRouter();
  const { createObra } = useObras();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      estado: "",
      cidade: "",
      endereco: "",
    },
  });

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

  const onSubmit = handleSubmit(async (data) => {
    const novaObra = await createObra({
      nome: data.nome.trim(),
      estado: data.estado ? data.estado.toUpperCase() : "",
      cidade: data.cidade.trim(),
      endereco: data.endereco.trim(),
    });

    if (!novaObra) {
      setError("nome", {
        type: "manual",
        message: "Já existe uma obra cadastrada com esse nome.",
      });
      return;
    }

    router.push(`/obras/${novaObra.id}?created=1`);
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Nova obra
          </h1>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full text-sm font-semibold"
          onClick={() => router.back()}
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <form
        className="space-y-8 rounded-2xl border border-[var(--border)] bg-card p-8 shadow-sm"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label="Nome da obra"
            description="Obrigatório — informe como o projeto é identificado."
            error={errors.nome?.message}
          >
            <input
              id="nome"
              {...register("nome")}
              className="form-input"
              placeholder="Ex.: Residencial Aurora"
              autoFocus
            />
          </Field>

          <Field
            label="Estado"
            optional
            description="Selecione a UF. Você poderá alterar depois."
            error={errors.estado?.message}
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
            description="Escolha uma cidade após selecionar o estado."
            error={errors.cidade?.message}
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
            error={errors.endereco?.message}
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
            loading={isSubmitting}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4" />
            Salvar obra
          </Button>
        </div>
      </form>
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

