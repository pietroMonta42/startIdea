"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, MessageCircle, Sparkles, X } from "lucide-react";
import { Avatar, Button } from "@/components/ui";

export interface MutualMatchModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  partnerName: string;
  partnerAvatar?: string | null;
  partnerColor?: string;
  partnerId: string;
  roleTitle: string;
}

export function MutualMatchModal({
  open,
  onClose,
  projectName,
  partnerName,
  partnerColor,
  partnerId,
  roleTitle,
}: MutualMatchModalProps) {
  const router = useRouter();

  if (!open) return null;

  const startChat = () => {
    onClose();
    router.push(`/inbox?chat=${partnerId}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-brand-500/30 bg-surface p-6 text-center shadow-2xl sm:p-8"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-line hover:text-ink"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icona fiamma e particelle */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-500/30 via-amber-500/20 to-transparent blur-xl"
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 text-white shadow-lg shadow-brand-500/30">
              <Flame className="h-9 w-9 fill-white text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
            It&apos;s a Match!
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Siete pronti a costruire.
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            La candidatura per il ruolo di <strong className="text-ink">{roleTitle}</strong> su{" "}
            <strong className="text-ink">{projectName}</strong> è stata accettata con successo!
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 rounded-2xl border border-line bg-bg p-4">
            <Avatar name={partnerName} size="lg" color={partnerColor} />
            <div className="text-left">
              <p className="font-display font-bold text-ink">{partnerName}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">Nuovo compagno di team</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button size="lg" className="w-full gap-2 shadow-lg shadow-brand-500/25" onClick={startChat}>
              <MessageCircle className="h-4 w-4" />
              Inizia conversazione
            </Button>
            <Button variant="ghost" size="md" className="w-full text-muted" onClick={onClose}>
              Continua a esplorare
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
