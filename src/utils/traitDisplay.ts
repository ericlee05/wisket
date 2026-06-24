import { BasketTraitType, getTraitType, type BasketTraitCategory } from '../db'

export function formatLocationValue(value: string): string {
  const [lat, lng] = value.split(',').map(Number)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return value
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export function parseLocationValue(value: string): { lat: number; lng: number } | null {
  const [lat, lng] = value.split(',').map(Number)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return { lat, lng }
}

export function formatTraitValue(category: BasketTraitCategory | undefined, value: string): string {
  switch (getTraitType(category)) {
    case BasketTraitType.PRICE: {
      const num = Number(value)
      const formatted = Number.isNaN(num) ? value : num.toLocaleString()
      return `${formatted}원`
    }
    case BasketTraitType.LOCATION:
      return value ? formatLocationValue(value) : value
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
