"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Compass, Home, Moon, Plus, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Avatar } from "./ui";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-[28%] shadow-lg shadow-brand-500/30"
      style={{ width: size, height: size, background: "var(--surface)" }}
    >
      <Image
        src="/sparklab-logo.svg"
        alt="SparkLab"
        width={size}
        height={size}
        priority
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-ink",
        className
      )}
      aria-label="Cambia tema"
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </motion.button>
  );
}

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/esplora", label: "Esplora", icon: Compass },
  { href: "/profilo", label: "Profilo", icon: User },
];

function SideNav() {
  const pathname = usePathname();
  const { user } = useStore();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface px-5 py-6 lg:flex">
      <Link href="/" className="flex items-center gap-3 px-1">
        <Logo size={38} />
        <span className="font-display text-xl font-bold tracking-tight text-ink">SparkLab</span>
      </Link>

      <nav className="mt-10 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                active ? "text-ink" : "text-muted hover:text-ink"
              )}
            >
              {active && (
                <motion.span
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-2xl bg-brand-500/10"
                  transition={{ type: "spring", damping: 30, stiffness: 350 }}
                />
              )}
              <item.icon className={cn("relative h-5 w-5", active && "text-brand-500")} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/nuovo"
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
      >
        <Plus className="h-5 w-5" />
        Pubblica un&apos;idea
      </Link>

      <div className="mt-auto flex items-center justify-between">
        {user ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.full_name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.full_name.split(" ")[0]}</p>
              <p className="text-xs text-muted">Online</p>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-snug text-muted">
            Il punto di gravità dell&apos;innovazione italiana
          </p>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo size={32} />
        <span className="font-display text-lg font-bold tracking-tight text-ink">SparkLab</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 items-end px-6 pt-2 pb-2">
        {NAV.slice(0, 2).map((item) => (
          <TabItem key={item.href} item={item} active={pathname === item.href} />
        ))}
        <Link href="/nuovo" className="flex justify-center" aria-label="Pubblica un'idea">
          <motion.span
            whileTap={{ scale: 0.88 }}
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-500/40 ring-4 ring-bg"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </motion.span>
        </Link>
        <TabItem item={NAV[2]} active={pathname === NAV[2].href} />
      </div>
    </nav>
  );
}

function TabItem({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  return (
    <Link href={item.href} className="flex flex-col items-center gap-1 py-1">
      <span className={cn("relative flex h-8 w-16 items-center justify-center rounded-full", active && "text-brand-500")}>
        {active && (
          <motion.span
            layoutId="tab-pill"
            className="absolute inset-0 rounded-full bg-brand-500/12"
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
          />
        )}
        <item.icon className="relative h-5.5 w-5.5" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={cn("text-[10px] font-semibold", active ? "text-ink" : "text-muted")}>{item.label}</span>
    </Link>
  );
}

function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);
  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SwRegister />
      <SideNav />
      <MobileHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-28 lg:max-w-3xl lg:pl-72 lg:pr-8 lg:pt-8 lg:pb-16 xl:max-w-4xl">
        {children}
      </main>
      <BottomNav />
    </ThemeProvider>
  );
}
