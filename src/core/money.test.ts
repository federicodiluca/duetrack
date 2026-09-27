import { describe, expect, it } from 'vitest'
import { amountForDuration, centsToInput, formatMoney, parseMoney } from './money'

describe('amountForDuration', () => {
  it('is proportional to the duration, rounded to the cent', () => {
    expect(amountForDuration(60, 2000)).toBe(2000)
    expect(amountForDuration(90, 2000)).toBe(3000)
    expect(amountForDuration(45, 2500)).toBe(1875)
    expect(amountForDuration(50, 2500)).toBe(2083) // 2083.33…
  })
})

describe('parseMoney', () => {
  it('reads Italian-style amounts', () => {
    expect(parseMoney('25')).toBe(2500)
    expect(parseMoney('25,5')).toBe(2550)
    expect(parseMoney('25,50 €')).toBe(2550)
    expect(parseMoney('€ 1.250,00')).toBe(125000)
  })

  it('accepts a dot as decimal separator when it cannot be a thousands separator', () => {
    expect(parseMoney('25.50')).toBe(2550)
  })

  it('rejects anything that is not an amount', () => {
    for (const bad of ['', 'abc', '-5', '25,555', '1,2,3']) expect(parseMoney(bad)).toBeUndefined()
  })
})

describe('centsToInput', () => {
  it('round-trips with parseMoney', () => {
    for (const cents of [0, 5, 2500, 2550, 125000]) expect(parseMoney(centsToInput(cents))).toBe(cents)
  })
})

describe('formatMoney', () => {
  it('formats euros the Italian way', () => {
    // Intl mette uno spazio non separabile tra importo e simbolo.
    expect(formatMoney(2550).replace(/\s/g, ' ')).toBe('25,50 €')
  })
})
