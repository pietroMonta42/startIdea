import type { CSSProperties } from "react";
import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "adesso";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}g fa`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} sett fa`;
  return `${Math.floor(d / 30)} mesi fa`;
}

const GRADIENT_COLORS: [string, string, string][] = [
  ["#c2410c", "#d97706", "#ca8a04"],
  ["#c2410c", "#e11d48", "#db2777"],
  ["#7c3aed", "#9333ea", "#c026d3"],
  ["#0369a1", "#0891b2", "#0d9488"],
  ["#059669", "#0d9488", "#65a30d"],
  ["#e11d48", "#dc2626", "#c2410c"],
  ["#4f46e5", "#2563eb", "#0369a1"],
  ["#d97706", "#c2410c", "#e11d48"],
  ["#c026d3", "#db2777", "#e11d48"],
  ["#0d9488", "#059669", "#16a34a"],
];

export const PROJECT_STYLES: { label: string; from: string; via: string; to: string }[] = [
  { label: "Tramonto", from: "#c2410c", via: "#e11d48", to: "#db2777" },
  { label: "Fusione", from: "#7c3aed", via: "#9333ea", to: "#c026d3" },
  { label: "Abisso", from: "#075985", via: "#1d4ed8", to: "#4338ca" },
  { label: "Foresta", from: "#059669", via: "#0d9488", to: "#0891b2" },
  { label: "Magma", from: "#dc2626", via: "#c2410c", to: "#d97706" },
  { label: "Nebula", from: "#c026d3", via: "#e11d48", to: "#9333ea" },
];

function hashIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % len;
}

function colorsFor(seed: string | { id: string; theme?: number }): [string, string, string] {
  if (typeof seed === "object" && seed) {
    const t = seed.theme;
    if (t != null && t >= 0 && t < PROJECT_STYLES.length) {
      const s = PROJECT_STYLES[t];
      return [s.from, s.via, s.to];
    }
    return GRADIENT_COLORS[hashIndex(seed.id, GRADIENT_COLORS.length)];
  }
  return GRADIENT_COLORS[hashIndex(seed, GRADIENT_COLORS.length)];
}

export function gradientStyle(
  seed: string | { id: string; theme?: number },
  opts?: { dots?: boolean }
): CSSProperties {
  const [from, via, to] = colorsFor(seed);
  const linear = `linear-gradient(to bottom right, ${from}, ${via}, ${to})`;
  if (opts?.dots) {
    return {
      backgroundImage: `radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), ${linear}`,
      backgroundSize: "18px 18px, auto",
      backgroundPosition: "0 0, 0 0",
    };
  }
  return { backgroundImage: linear };
}

export function scrimStyle(): CSSProperties {
  return {
    backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.42), rgba(0,0,0,0.08) 55%, transparent)",
  };
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function daysAgo(n: number, hours = 0): string {
  return new Date(Date.now() - n * 864e5 - hours * 36e5).toISOString();
}
