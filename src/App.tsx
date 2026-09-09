import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Clipboard,
  Code2,
  Download,
  Moon,
  Palette,
  RotateCcw,
  Sun,
} from 'lucide-react'
import {
  generatePalette,
  getContrastColor,
  hexToHsl,
  hexToHsv,
  hslToHex,
  hsvToHex,
  normalizeHex,
  type HSL,
  type HSV,
  type PaletteColor,
  type PaletteKind,
  type PaletteMode,
} from './color'

const DEFAULT_BRAND = '#FF6000'
const DEFAULT_NEUTRAL = '#0F131A'

interface SharedColorInputProps {
  id: string
  label: string
  hint: string
}

type ColorInputProps =
  | (SharedColorInputProps & {
      model: 'HSB'
      channels: HSV
      onChannelsChange: (channels: HSV) => void
    })
  | (SharedColorInputProps & {
      model: 'HSL'
      channels: HSL
      onChannelsChange: (channels: HSL) => void
    })

interface ChannelDefinition {
  key: 'h' | 's' | 'v' | 'l'
  label: string
  max: number
  unit: string
}

const roundChannels = <T extends HSL | HSV>(channels: T): T =>
  Object.fromEntries(
    Object.entries(channels).map(([key, value]) => [key, Math.round(value)]),
  ) as unknown as T

function ColorInput(props: ColorInputProps) {
  const { id, label, hint, model, channels } = props
  const value = model === 'HSB' ? hsvToHex(channels) : hslToHex(channels)
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)
  const channelDefinitions: ChannelDefinition[] =
    model === 'HSB'
      ? [
          { key: 'h', label: 'H', max: 360, unit: '°' },
          { key: 's', label: 'S', max: 100, unit: '%' },
          { key: 'v', label: 'B', max: 100, unit: '%' },
        ]
      : [
          { key: 'h', label: 'H', max: 360, unit: '°' },
          { key: 's', label: 'S', max: 100, unit: '%' },
          { key: 'l', label: 'L', max: 100, unit: '%' },
        ]

  useEffect(() => setDraft(value), [value])

  const setFromHex = (hex: string) => {
    if (props.model === 'HSB') {
      props.onChannelsChange(hexToHsv(hex))
    } else {
      props.onChannelsChange(hexToHsl(hex))
    }
  }

  const commitHex = () => {
    const normalized = normalizeHex(draft)
    if (!normalized) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setDraft(normalized)
    setFromHex(normalized)
  }

  const updateChannel = (key: ChannelDefinition['key'], rawValue: number) => {
    if (!Number.isFinite(rawValue)) return
    const max = key === 'h' ? 360 : 100
    const nextValue = Math.min(max, Math.max(0, rawValue))
    if (props.model === 'HSB') {
      props.onChannelsChange({ ...props.channels, [key]: nextValue })
    } else {
      props.onChannelsChange({ ...props.channels, [key]: nextValue })
    }
  }

  return (
    <div className={`color-input ${invalid ? 'is-invalid' : ''}`}>
      <div className="field-heading">
        <div>
          <label htmlFor={id}>{label}</label>
          <span className="model-badge">{model}</span>
        </div>
        <span>{hint}</span>
      </div>
      <div className="color-control">
        <label className="picker-trigger" style={{ background: value }}>
          <input
            aria-label={`${label}颜色选择器`}
            type="color"
            value={value}
            onChange={(event) => setFromHex(event.target.value.toUpperCase())}
          />
        </label>
        <span className="hash">#</span>
        <input
          id={id}
          value={draft.replace('#', '')}
          maxLength={6}
          spellCheck={false}
          aria-invalid={invalid}
          onChange={(event) => {
            const next = event.target.value.replace(/[^\da-f]/gi, '')
            setDraft(`#${next.toUpperCase()}`)
            setInvalid(false)
            if (next.length === 6) setFromHex(`#${next.toUpperCase()}`)
          }}
          onBlur={commitHex}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </div>
      <div className="channel-editor">
        {channelDefinitions.map(({ key, label: channelLabel, max, unit }) => {
          const channelValue = Math.round(
            channels[key as keyof typeof channels],
          )
          return (
            <div className="channel-row" key={key}>
              <label htmlFor={`${id}-${key}`}>{channelLabel}</label>
              <input
                id={`${id}-${key}`}
                type="range"
                min="0"
                max={max}
                step="1"
                value={channelValue}
                aria-label={`${label} ${channelLabel} 通道`}
                style={{
                  background: `linear-gradient(to right, ${value} ${
                    (channelValue / max) * 100
                  }%, #E8E9ED ${(channelValue / max) * 100}%)`,
                }}
                onChange={(event) =>
                  updateChannel(key, Number(event.target.value))
                }
              />
              <div className="channel-number">
                <input
                  type="number"
                  min="0"
                  max={max}
                  step="1"
                  value={channelValue}
                  aria-label={`${label} ${channelLabel} 数值`}
                  onFocus={(event) => event.currentTarget.select()}
                  onClick={(event) => event.currentTarget.select()}
                  onChange={(event) =>
                    updateChannel(key, Number(event.target.value))
                  }
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
                      return
                    }
                    event.preventDefault()
                    const direction = event.key === 'ArrowUp' ? 1 : -1
                    updateChannel(
                      key,
                      channelValue + direction * (event.shiftKey ? 10 : 1),
                    )
                  }}
                />
                <span>{unit}</span>
              </div>
            </div>
          )
        })}
      </div>
      {invalid && <p className="field-error">请输入有效的 3 位或 6 位 HEX 色值</p>}
    </div>
  )
}

function formatChannels(color: PaletteColor, kind: PaletteKind) {
  if (kind === 'brand') {
    const { h, s, v } = roundChannels(color.hsv ?? hexToHsv(color.hex))
    return `H ${h}°\nS ${s}%\nB ${v}%`
  }
  const { h, s, l } = roundChannels(color.hsl ?? hexToHsl(color.hex))
  return `H ${h}°\nS ${s}%\nL ${l}%`
}

interface SwatchProps {
  color: PaletteColor
  kind: PaletteKind
  isAnchor: boolean
  onCopy: (color: PaletteColor) => void
  copied: boolean
}

function Swatch({ color, kind, isAnchor, onCopy, copied }: SwatchProps) {
  const contrast = getContrastColor(color.hex)

  return (
    <button
      className={`swatch${isAnchor ? ' is-anchor' : ''}`}
      onClick={() => onCopy(color)}
      aria-label={`复制 ${color.name} ${color.hex}`}
    >
      <span
        className="swatch-color"
        style={{ backgroundColor: color.hex, color: contrast }}
      >
        <span className="copy-indicator">
          {copied ? <Check size={17} /> : <Clipboard size={17} />}
        </span>
      </span>
      <span className="swatch-meta">
        <span className="swatch-name-row">
          <strong>{color.name}</strong>
          <span>{color.hex}</span>
        </span>
        <span className="channel-value">{formatChannels(color, kind)}</span>
      </span>
    </button>
  )
}

function buildAllPalettes(brand: string, neutral: string, neutralHsl?: HSL) {
  return {
    brand: {
      light: generatePalette('brand', 'light', brand, neutral),
      dark: generatePalette('brand', 'dark', brand, neutral),
    },
    neutral: {
      light: generatePalette('neutral', 'light', brand, neutral, neutralHsl),
      dark: generatePalette('neutral', 'dark', brand, neutral, neutralHsl),
    },
  }
}

function palettesToCss(brand: string, neutral: string, neutralHsl?: HSL) {
  const palettes = buildAllPalettes(brand, neutral, neutralHsl)
  const groups = Object.entries(palettes).flatMap(([kind, modes]) =>
    Object.entries(modes).map(([mode, colors]) => ({
      title: `${kind}-${mode}`,
      colors,
    })),
  )
  return `:root {\n${groups
    .map(
      ({ title, colors }) =>
        `  /* ${title} */\n${colors
          .map((color) => `  --${title}-${color.index}: ${color.hex};`)
          .join('\n')}`,
    )
    .join('\n\n')}\n}`
}

interface PaletteSectionProps {
  kind: PaletteKind
  mode: PaletteMode
  palette: PaletteColor[]
  copiedKey: string | null
  onCopy: (kind: PaletteKind, color: PaletteColor) => void
}

function PaletteSection({
  kind,
  mode,
  palette,
  copiedKey,
  onCopy,
}: PaletteSectionProps) {
  const isBrand = kind === 'brand'

  return (
    <section className="palette-block">
      <div className="palette-block-heading">
        <div>
          <span className={`palette-dot ${kind}`} />
          <h3>{isBrand ? '品牌色 / 辅助色' : '中性色'}</h3>
          <span className="palette-model">{isBrand ? 'HSB' : 'HSL'}</span>
        </div>
        <span>{mode === 'light' ? '浅色色板' : '暗色色板'} · 13 阶</span>
      </div>
      <div className="palette-scroll">
        <div className="palette-track">
          <div className="gradient-ribbon">
            {palette.map((color) => (
              <span key={color.name} style={{ background: color.hex }} />
            ))}
          </div>
          <div className="swatch-grid">
            {palette.map((color) => (
              <Swatch
                key={color.name}
                color={color}
                kind={kind}
                isAnchor={color.index === (isBrand ? 9 : 13)}
                copied={copiedKey === `${kind}-${color.name}`}
                onCopy={(item) => onCopy(kind, item)}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="palette-tip">
        <span />
        点击任意色块，复制 HEX 和 {isBrand ? 'HSB' : 'HSL'} 色值
      </p>
    </section>
  )
}

function App() {
  const [mode, setMode] = useState<PaletteMode>('light')
  const [brandChannels, setBrandChannels] = useState<HSV>(() =>
    hexToHsv(DEFAULT_BRAND),
  )
  const [neutralChannels, setNeutralChannels] = useState<HSL>(() =>
    hexToHsl(DEFAULT_NEUTRAL),
  )
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const toastTimer = useRef<number | null>(null)
  const brandHex = hsvToHex(brandChannels)
  const neutralHex = hslToHex(neutralChannels)

  const brandPalette = useMemo(
    () => generatePalette('brand', mode, brandHex, neutralHex),
    [brandHex, mode, neutralHex],
  )
  const neutralPalette = useMemo(
    () =>
      generatePalette(
        'neutral',
        mode,
        brandHex,
        neutralHex,
        neutralChannels,
      ),
    [brandHex, mode, neutralChannels, neutralHex],
  )

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [],
  )

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(successMessage)
      return true
    } catch (error) {
      console.error('Clipboard write failed', error)
      showToast('复制失败，请检查浏览器剪贴板权限', 'error')
      return false
    }
  }

  const copyColor = async (kind: PaletteKind, color: PaletteColor) => {
    const text = `${color.hex}  ${formatChannels(color, kind)}`
    if (await copyText(text, `已复制 ${color.name} · ${color.hex}`)) {
      setCopiedKey(`${kind}-${color.name}`)
      window.setTimeout(() => setCopiedKey(null), 1200)
    }
  }

  const downloadJson = () => {
    const content = JSON.stringify(
      buildAllPalettes(brandHex, neutralHex, neutralChannels),
      null,
      2,
    )
    const url = URL.createObjectURL(
      new Blob([content], { type: 'application/json;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'chromatic-tokens.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showToast('JSON 色板已下载')
  }

  const resetColors = () => {
    setBrandChannels(hexToHsv(DEFAULT_BRAND))
    setNeutralChannels(hexToHsl(DEFAULT_NEUTRAL))
    showToast('已恢复默认色值')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-mark" href="#" aria-label="Chromatic 首页">
          <span className="brand-icon">
            <Palette size={20} />
          </span>
          <span>
            Chromatic
            <small>COLOR SYSTEM</small>
          </span>
        </a>
        <div className="topbar-meta">
          <span>13 STEP PALETTE</span>
          <span className="topbar-divider" />
          <span>v1.1</span>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span />
              INTELLIGENT COLOR SCALE
            </p>
            <h1>
              一个颜色，
              <br />
              <em>构建完整色彩系统。</em>
            </h1>
            <p className="hero-description">
              精确控制 HSB 与 HSL 通道，实时生成连续、可靠的 13
              阶品牌色和中性色板。
            </p>
          </div>
          <div className="hero-palette" aria-hidden="true">
            {brandPalette.slice(2, 11).map((color, index) => (
              <span
                key={color.name}
                style={{
                  background: color.hex,
                  transform: `translate(${index * 20}px, ${index * 5}px)`,
                }}
              />
            ))}
          </div>
        </section>

        <section className="workspace">
          <div className="control-panel">
            <div className="control-top">
              <div>
                <p className="control-kicker">01 · 选择生成模式</p>
                <div className="mode-switch" aria-label="色板模式">
                  <button
                    className={mode === 'light' ? 'active' : ''}
                    aria-pressed={mode === 'light'}
                    onClick={() => setMode('light')}
                  >
                    <Sun size={16} />
                    浅色色板
                  </button>
                  <button
                    className={mode === 'dark' ? 'active' : ''}
                    aria-pressed={mode === 'dark'}
                    onClick={() => setMode('dark')}
                  >
                    <Moon size={16} />
                    暗色色板
                  </button>
                </div>
              </div>
            </div>

            <div className="input-heading">
              <div>
                <p className="control-kicker">02 · 调试基准色</p>
                <h2>颜色通道</h2>
              </div>
              <button className="reset-button" onClick={resetColors}>
                <RotateCcw size={16} />
                恢复默认
              </button>
            </div>
            <div className="input-row">
              <ColorInput
                id="brand-color"
                label="品牌 / 辅助色基准"
                hint="映射至 color-9"
                model="HSB"
                channels={brandChannels}
                onChannelsChange={setBrandChannels}
              />
              <ColorInput
                id="neutral-color"
                label="中性色基准"
                hint="映射至 color-13，同时用于暗色混合"
                model="HSL"
                channels={neutralChannels}
                onChannelsChange={setNeutralChannels}
              />
            </div>
          </div>

          <div className="palette-section">
            <div className="section-heading palette-heading">
              <div>
                <p className="eyebrow">GENERATED PALETTES</p>
                <h2>完整色板</h2>
              </div>
              <div className="palette-actions">
                <button
                  onClick={() =>
                    void copyText(
                      palettesToCss(brandHex, neutralHex, neutralChannels),
                      '全部 CSS 变量已复制',
                    )
                  }
                >
                  <Code2 size={17} />
                  复制 CSS
                </button>
                <button onClick={downloadJson}>
                  <Download size={17} />
                  导出 JSON
                </button>
              </div>
            </div>
            <PaletteSection
              kind="brand"
              mode={mode}
              palette={brandPalette}
              copiedKey={copiedKey}
              onCopy={(paletteKind, color) =>
                void copyColor(paletteKind, color)
              }
            />
            <PaletteSection
              kind="neutral"
              mode={mode}
              palette={neutralPalette}
              copiedKey={copiedKey}
              onCopy={(paletteKind, color) =>
                void copyColor(paletteKind, color)
              }
            />
          </div>
        </section>

      </main>

      <footer>
        <span>CHROMATIC COLOR SYSTEM</span>
        <span>Built for consistent digital products.</span>
      </footer>

      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          {toast.tone === 'success' ? <Check size={18} /> : <span>!</span>}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
