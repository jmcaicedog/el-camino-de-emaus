export interface MinutoColorConfig {
  id: string
  label: string
  bg: string
  border: string
  text: string
  badgeBg: string
  accent: string
  calendarCard: string
}

export const MINUTO_COLORS: Record<string, MinutoColorConfig> = {
  sky: {
    id: "sky",
    label: "Azul Cielo",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-400 dark:border-sky-600",
    text: "text-sky-900 dark:text-sky-200",
    badgeBg: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300",
    accent: "bg-sky-500",
    calendarCard: "border-l-sky-500 hover:bg-sky-100/50 dark:hover:bg-sky-950/60",
  },
  emerald: {
    id: "emerald",
    label: "Verde Esmeralda",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-400 dark:border-emerald-600",
    text: "text-emerald-900 dark:text-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
    accent: "bg-emerald-500",
    calendarCard: "border-l-emerald-500 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/60",
  },
  amber: {
    id: "amber",
    label: "Ámbar Cálido",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-400 dark:border-amber-600",
    text: "text-amber-900 dark:text-amber-200",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    accent: "bg-amber-500",
    calendarCard: "border-l-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-950/60",
  },
  purple: {
    id: "purple",
    label: "Púrpura / Morado",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-400 dark:border-purple-600",
    text: "text-purple-900 dark:text-purple-200",
    badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300",
    accent: "bg-purple-500",
    calendarCard: "border-l-purple-500 hover:bg-purple-100/50 dark:hover:bg-purple-950/60",
  },
  rose: {
    id: "rose",
    label: "Rosa / Carmesí",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-400 dark:border-rose-600",
    text: "text-rose-900 dark:text-rose-200",
    badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300",
    accent: "bg-rose-500",
    calendarCard: "border-l-rose-500 hover:bg-rose-100/50 dark:hover:bg-rose-950/60",
  },
  orange: {
    id: "orange",
    label: "Naranja",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-400 dark:border-orange-600",
    text: "text-orange-900 dark:text-orange-200",
    badgeBg: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300",
    accent: "bg-orange-500",
    calendarCard: "border-l-orange-500 hover:bg-orange-100/50 dark:hover:bg-orange-950/60",
  },
  indigo: {
    id: "indigo",
    label: "Índigo / Azul Profundo",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-400 dark:border-indigo-600",
    text: "text-indigo-900 dark:text-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300",
    accent: "bg-indigo-500",
    calendarCard: "border-l-indigo-500 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/60",
  },
  slate: {
    id: "slate",
    label: "Gris / Neutro",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-400 dark:border-slate-600",
    text: "text-slate-900 dark:text-slate-200",
    badgeBg: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    accent: "bg-slate-500",
    calendarCard: "border-l-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/60",
  },
}

export function getColorConfig(colorId?: string | null): MinutoColorConfig {
  if (!colorId || !MINUTO_COLORS[colorId]) {
    return MINUTO_COLORS.sky
  }
  return MINUTO_COLORS[colorId]
}
