"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const presetColors = [
  "#2563EB",
  "#0EA5E9",
  "#22C55E",
  "#F97316",
  "#D946EF",
  "#FACC15",
  "#14B8A6",
  "#FB7185",
  "#9CA3AF",
];

interface ColorPickerProps {
  value: string;
  onChange?: (value: string) => void;
  label?: string;
}

function clampHex(value: string) {
  const sanitized = value.trim().replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return `#${sanitized.padEnd(6, "0")}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return { r: 37, g: 99, b: 235 };
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((component) => component.toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsv(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === rr) {
      h = ((gg - bb) / diff) % 6;
    } else if (max === gg) {
      h = (bb - rr) / diff + 2;
    } else {
      h = (rr - gg) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rr = 0,
    gg = 0,
    bb = 0;

  if (h >= 0 && h < 60) {
    rr = c;
    gg = x;
    bb = 0;
  } else if (h >= 60 && h < 120) {
    rr = x;
    gg = c;
    bb = 0;
  } else if (h >= 120 && h < 180) {
    rr = 0;
    gg = c;
    bb = x;
  } else if (h >= 180 && h < 240) {
    rr = 0;
    gg = x;
    bb = c;
  } else if (h >= 240 && h < 300) {
    rr = x;
    gg = 0;
    bb = c;
  } else {
    rr = c;
    gg = 0;
    bb = x;
  }

  const r = Math.round((rr + m) * 255);
  const g = Math.round((gg + m) * 255);
  const b = Math.round((bb + m) * 255);
  return { r, g, b };
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const hexAtual = useMemo(() => {
    const sanitized = value && /^#([0-9a-fA-F]{6})$/.test(value)
      ? value
      : "#2563EB";
    return sanitized.toUpperCase();
  }, [value]);

  const hsvAtual = useMemo(() => {
    const { r, g, b } = hexToRgb(hexAtual);
    return rgbToHsv(r, g, b);
  }, [hexAtual]);

  const handleHexInputChange = (novoValor: string) => {
    const normalizado = clampHex(novoValor);
    onChange?.(normalizado);
  };

  const handleColorInput = (novoValor: string) => {
    if (!/^#([0-9a-fA-F]{6})$/.test(novoValor)) return;
    onChange?.(novoValor.toUpperCase());
  };

  const handleHueChange = (novoH: number) => {
    const { r, g, b } = hsvToRgb(novoH, hsvAtual.s, hsvAtual.v);
    onChange?.(rgbToHex(r, g, b));
  };

  const handleSVChange = (novoS: number, novoV: number) => {
    const { r, g, b } = hsvToRgb(hsvAtual.h, novoS, novoV);
    onChange?.(rgbToHex(r, g, b));
  };

  return (
    <div className="space-y-3">
      {label ? <span className="text-xs font-semibold text-foreground-muted">{label}</span> : null}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hexAtual}
            onChange={(event) => handleColorInput(event.target.value)}
            className="h-12 w-16 cursor-pointer rounded-xl border border-[var(--border)] bg-white p-0"
          />
          <input
            value={hexAtual}
            onChange={(event) => handleHexInputChange(event.target.value)}
            className="form-input h-12 w-28 text-center font-mono text-sm uppercase"
            placeholder="#000000"
            maxLength={7}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-foreground-muted">Matiz</label>
            <input
              type="range"
              min={0}
              max={359}
              value={hsvAtual.h}
              onChange={(event) => handleHueChange(Number(event.target.value))}
              className="h-2 w-44 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 via-purple-500 to-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-foreground-muted">Tonalidade</label>
            <div className="relative h-12 w-44 overflow-hidden rounded-xl border border-[var(--border)]">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(hsvAtual.s * 100)}
                onChange={(event) => handleSVChange(Number(event.target.value) / 100, hsvAtual.v)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(to right, #ffffff, ${rgbToHex(
                    ...Object.values(hsvToRgb(hsvAtual.h, 1, hsvAtual.v)) as [number, number, number],
                  )})`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-foreground-muted">Brilho</label>
            <div className="relative h-12 w-44 overflow-hidden rounded-xl border border-[var(--border)]">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(hsvAtual.v * 100)}
                onChange={(event) => handleSVChange(hsvAtual.s, Number(event.target.value) / 100)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(to right, #000000, ${rgbToHex(
                    ...Object.values(hsvToRgb(hsvAtual.h, hsvAtual.s, 1)) as [number, number, number],
                  )})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "h-8 w-8 rounded-full border-2 border-transparent transition",
              hexAtual === color ? "ring-2 ring-offset-2 ring-[var(--accent)]" : "",
            )}
            style={{ backgroundColor: color }}
            aria-label={`Escolher cor ${color}`}
            onClick={() => onChange?.(color)}
          />
        ))}
      </div>
    </div>
  );
}

