"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn, gradientStyle, initials } from "@/lib/utils";

/* ---------- Button ---------- */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 px-3.5 text-xs",
        size === "md" && "h-10 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" && "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-bg",
        variant === "dark" && "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
        variant === "ghost" && "text-muted hover:bg-line/60 hover:text-ink",
        className
      )}
      {...(props as object)}
    >
      {children}
    </motion.button>
  );
}

/* ---------- Badge ---------- */
export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-[11px] rounded-xl",
    md: "h-11 w-11 text-sm rounded-2xl",
    lg: "h-14 w-14 text-lg rounded-2xl",
    xl: "h-20 w-20 text-2xl rounded-3xl",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center font-display font-bold text-white shadow-sm",
        sizes[size],
        className
      )}
      style={gradientStyle(name)}
    >
      {initials(name)}
    </div>
  );
}

/* ---------- Modal (bottom-sheet mobile / dialog desktop) ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full p-1.5 text-muted transition-colors hover:bg-line hover:text-ink"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Inputs ---------- */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-2xl border border-line bg-bg px-4 text-sm text-ink outline-none transition-shadow placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none transition-shadow placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15",
        props.className
      )}
    />
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-11 w-11" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
