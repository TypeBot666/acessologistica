import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTrackingCode(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const dateStr = `${year}${month}${day}`

  // Gerar número aleatório de 4 dígitos
  const random = Math.floor(1000 + Math.random() * 9000)

  return `LOG-${dateStr}-${random}`
}
