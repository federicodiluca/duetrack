import { describe, expect, it } from 'vitest'
import { decimal, toCsv } from './csv'

describe('toCsv', () => {
  it('uses semicolons, CRLF and a BOM', () => {
    expect(toCsv([['Cliente', 'Ore'], ['Niccolò', '1,5']])).toBe('﻿Cliente;Ore\r\nNiccolò;1,5')
  })

  it('quotes cells that contain separators or quotes', () => {
    expect(toCsv([['a;b', 'detto "così"']])).toBe('﻿"a;b";"detto ""così"""')
  })
})

describe('decimal', () => {
  it('writes a comma as decimal separator', () => {
    expect(decimal(37.5)).toBe('37,50')
    expect(decimal(1.5, 1)).toBe('1,5')
  })
})
