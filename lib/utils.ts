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

export const GRADIENTS = [
  "from-orange-400 via-amber-400 to-yellow-300",
  "from-orange-500 via-rose-500 to-pink-500",
  "from-violet-500 via-purple-500 to-fuchsia-400",
  "from-sky-500 via-cyan-400 to-teal-300",
  "from-emerald-500 via-teal-400 to-lime-300",
  "from-rose-500 via-red-400 to-orange-300",
  "from-indigo-500 via-blue-400 to-sky-300",
  "from-amber-500 via-orange-400 to-rose-400",
  "from-fuchsia-500 via-pink-400 to-rose-300",
  "from-teal-500 via-emerald-400 to-green-300",
];

export function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
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
