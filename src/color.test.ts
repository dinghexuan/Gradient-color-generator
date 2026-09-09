import { describe, expect, it } from 'vitest'
import {
  generateBrandDark,
  generateBrandLight,
  generateNeutralDark,
  generateNeutralLight,
  hexToHsl,
  normalizeHex,
} from './color'

describe('normalizeHex', () => {
  it('normalizes three and six digit colors', () => {
    expect(normalizeHex('f60')).toBe('#FF6600')
    expect(normalizeHex('#0f131a')).toBe('#0F131A')
    expect(normalizeHex('nope')).toBeNull()
  })
})

describe('palette generation', () => {
  const hexes = (palette: ReturnType<typeof generateBrandLight>) =>
    palette.map((color) => color.hex)

  it.each([
    [generateNeutralLight('#0F131A')],
    [generateNeutralDark('#0F131A')],
    [generateBrandLight('#FF6000')],
    [generateBrandDark('#FF6000', '#0F131A')],
  ])('always produces thirteen valid colors', (palette) => {
    expect(palette).toHaveLength(13)
    expect(palette.map((color) => color.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ])
    palette.forEach((color) => {
      expect(color.hex).toMatch(/^#[\dA-F]{6}$/)
    })
  })

  it('keeps user colors at their specified anchor positions', () => {
    expect(generateNeutralLight('#0F131A')[12].hex).toBe('#0F131A')
    expect(generateNeutralDark('#0F131A')[12].hex).toBe('#0F131A')
    expect(generateBrandLight('#FF6000')[8].hex).toBe('#FF6000')
  })

  it('uses pure white for neutral color-1', () => {
    expect(generateNeutralLight('#0F131A')[0].hex).toBe('#FFFFFF')
    expect(generateNeutralDark('#0F131A')[0].hex).toBe('#FFFFFF')
  })

  it('applies the neutral light progression in HSL space', () => {
    const palette = generateNeutralLight('#0F131A')
    const base = hexToHsl(palette[12].hex)
    const color12 = hexToHsl(palette[11].hex)
    const color11 = hexToHsl(palette[10].hex)

    expect(color12.l - base.l).toBeCloseTo(8, 0)
    expect(color11.l - color12.l).toBeCloseTo(4, 0)
    expect(hexToHsl(palette[4].hex).l).toBeLessThanOrEqual(86.5)
  })

  it('matches the default neutral light HSL progression', () => {
    expect(hexes(generateNeutralLight('#0F131A'))).toEqual([
      '#FFFFFF',
      '#F1F4F8',
      '#EBEEF4',
      '#E2E6EE',
      '#D3D9E3',
      '#B0B9C9',
      '#8A95A8',
      '#59667D',
      '#445064',
      '#2F3747',
      '#27303F',
      '#1F2633',
      '#0F131A',
    ])
  })

  it.each([generateNeutralLight, generateNeutralDark])(
    'preserves the exact base hue across every neutral color',
    (generate) => {
      const baseHsl = { h: 173, s: 41, l: 17 }
      const palette = generate('#193D36', baseHsl)

      expect(palette.map((color) => color.hsl?.h)).toEqual(
        Array(13).fill(baseHsl.h),
      )
      expect(palette[0].hex).toBe('#FFFFFF')
      expect(palette[0].hsl).toEqual({ h: baseHsl.h, s: 0, l: 100 })
    },
  )

  it('uses the neutral base when composing the dark brand palette', () => {
    const warmNeutral = generateBrandDark('#FF6000', '#331100')
    const coolNeutral = generateBrandDark('#FF6000', '#001133')
    expect(warmNeutral[0].hex).not.toBe(coolNeutral[0].hex)
  })

  it('matches the specified default brand color progression', () => {
    expect(hexes(generateBrandLight('#FF6000'))).toEqual([
      '#FFF8F0',
      '#FFF3E6',
      '#FFECD6',
      '#FFE3C2',
      '#FFD2A3',
      '#FFBA7A',
      '#FF9E52',
      '#FF8129',
      '#FF6000',
      '#D94A00',
      '#B33700',
      '#8C2700',
      '#661900',
    ])
  })

  it('matches the specified dark alpha composition', () => {
    expect(hexes(generateBrandDark('#FF6000', '#0F131A'))).toEqual([
      '#131319',
      '#1C1517',
      '#281816',
      '#371E15',
      '#422114',
      '#572A12',
      '#7B360E',
      '#AB4509',
      '#DB5404',
      '#E77628',
      '#F3974F',
      '#F8B577',
      '#FACEA0',
    ])
  })
})
