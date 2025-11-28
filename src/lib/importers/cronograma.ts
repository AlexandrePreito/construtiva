import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { CronogramaLinha } from "@/hooks/use-cronograma";

const headerMap: Record<keyof CronogramaLinha, string[]> = {
  id: ["id", "codigo"],
  item: ["item", "macro", "disciplina", "macroitem"],
  servico: ["serviço", "servico", "service"],
  etapa: ["etapa", "pavimento", "atividade", "fase"],
  dataInicio: ["início", "inicio", "data início", "data inicio", "start"],
  dataFim: ["término", "termino", "data término", "data termino", "end"],
};

type ParsedRow = Partial<Record<keyof CronogramaLinha, string | number>> & {
  [key: string]: string | number | undefined;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function detectHeaderIndex(headers: string[]) {
  const normalized = headers.map((header) => normalize(header));
  const map = new Map<keyof CronogramaLinha, number>();

  (Object.keys(headerMap) as (keyof CronogramaLinha)[]).forEach((key) => {
    const matches = headerMap[key];
    const index = normalized.findIndex((header) => matches.includes(header));
    if (index !== -1) {
      map.set(key, index);
    }
  });

  return map;
}

function parseDate(value: unknown): string {
  if (value == null || value === "") return "";

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    const { y, m, d } = parsed;
    return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    const [dia, mes, ano] = trimmed.split(/[\/\-]/).map((part) => part.trim());
    if (dia && mes && ano && ano.length === 4) {
      const iso = `${ano.padStart(4, "0")}-${mes.padStart(2, "0")}-${dia.padStart(
        2,
        "0",
      )}`;
      if (!Number.isNaN(Date.parse(iso))) {
        return iso;
      }
    }

    if (!Number.isNaN(Date.parse(trimmed))) {
      return new Date(trimmed).toISOString().slice(0, 10);
    }
  }

  return "";
}

function valueToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return String(value);
}

function fillDefaults(partial: ParsedRow): CronogramaLinha {
  const item = valueToString(
    partial.item ?? partial.pavimento ?? partial.etapa ?? "",
  );
  const servico = valueToString(partial.servico ?? "");
  const etapa = valueToString(partial.etapa ?? partial.pavimento ?? "");

  return {
    id: valueToString(partial.id ?? "") || crypto.randomUUID(),
    item: item || "Item não informado",
    servico: servico || "Serviço não informado",
    etapa: etapa || "",
    dataInicio: parseDate(partial.dataInicio ?? ""),
    dataFim: parseDate(partial.dataFim ?? ""),
  };
}

export async function parseCronogramaFile(file: File): Promise<CronogramaLinha[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsv(file);
  }

  return parseXlsx(file);
}

async function parseCsv(file: File): Promise<CronogramaLinha[]> {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const [headers, ...rows] = result.data;
  if (!headers || headers.length === 0) {
    throw new Error("Não foi possível identificar cabeçalhos na planilha.");
  }
  const headerIndex = detectHeaderIndex(headers as string[]);
  if (headerIndex.size < 3) {
    throw new Error(
      "Cabeçalhos insuficientes. Garanta colunas para Etapa, Serviço, Pavimento, Data Início e Data Fim.",
    );
  }

  return rows.map((row) => {
    const partial: ParsedRow = {};
    headerIndex.forEach((index, key) => {
      partial[key] = row[index];
    });
    return fillDefaults(partial);
  });
}

async function parseXlsx(file: File): Promise<CronogramaLinha[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Não foi possível encontrar abas na planilha.");
  }
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    blankrows: false,
  });

  const [headers, ...rows] = json;
  if (!headers || headers.length === 0) {
    throw new Error("Não foi possível identificar cabeçalhos na planilha.");
  }
  const headerIndex = detectHeaderIndex(headers.map((header) => String(header)));
  if (headerIndex.size < 3) {
    throw new Error(
      "Cabeçalhos insuficientes. Garanta colunas para Etapa, Serviço, Pavimento, Data Início e Data Fim.",
    );
  }

  return rows.map((row) => {
    const partial: ParsedRow = {};
    headerIndex.forEach((index, key) => {
      partial[key] = row[index];
    });
    return fillDefaults(partial);
  });
}

