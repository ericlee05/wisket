import { BasketTraitType, getTraitType, type BasketTraitCategory } from '../db'

export function formatTraitValue(category: BasketTraitCategory | undefined, value: string): string {
  switch (getTraitType(category)) {
    case BasketTraitType.PRICE: {
      const num = Number(value)
      const formatted = Number.isNaN(num) ? value : num.toLocaleString()
      return `${formatted}원`
    }
    default:
      return value
  }
}

export function truncateUrlForDisplay(value: string, maxLength = 36): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}…`
}

export function formatTraitBadgeText(category: BasketTraitCategory | undefined, value: string): string {
  const formatted = formatTraitValue(category, value)
  switch (getTraitType(category)) {
    case BasketTraitType.PRICE:
    case BasketTraitType.INT:
      return `${category?.name}: ${formatted}`
    default:
      return formatted
  }
}
