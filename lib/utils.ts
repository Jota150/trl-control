import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentTurno(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 14) return 'T1'
  if (hour >= 14 && hour < 22) return 'T2'
  return 'T3'
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--:--'
  return new Date(isoString).toTimeString().slice(0, 8)
}

export function formatDate(isoString: string | null): string {
  if (!isoString) return '--/--/----'
  const d = new Date(isoString)
  return d.toLocaleDateString('pt-BR')
}

export function calcDurationSecs(inicio: string, fim: string): number {
  return Math.floor((new Date(fim).getTime() - new Date(inicio).getTime()) / 1000)
}

export function elapsedSecs(inicio: string): number {
  return Math.floor((Date.now() - new Date(inicio).getTime()) / 1000)
}
