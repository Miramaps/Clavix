import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nb-NO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('nb-NO').format(num);
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 75) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}
