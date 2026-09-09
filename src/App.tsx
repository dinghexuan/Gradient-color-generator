import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  Clipboard,
  Code2,
  Download,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
} from 'lucide-react'
import {
  generatePalette,
  getContrastColor,
  normalizeHex,
  type PaletteColor,
  type PaletteKind,
  type PaletteMode,
} from './color'

const DEFAULT_BRAND = '#FF6000'
const DEFAULT_NEUTRAL = '#0F131A'

interface ColorInputProps {
  id: string
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}

function ColorInput({ id, label, hint, value, onChange }: ColorInputProps) {
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const normalized = normalizeHex(draft)
    if (!normalized) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setDraft(normalized)
    onChange(normalized)
  }

  return (
    <div className={`color-input ${invalid ? 'is-invalid' : ''}`}>
      <div className="field-heading">
        <label htmlFor={id}>{label}</label>
        <span>{hint}</span>
      </div>
      <div className="color-control">
        <label className="picker-trigger" style={{ background: value }}>
          <input
            aria-label={`${label}颜色选择器`}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
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
            if (next.length === 6) onChange(`#${next.toUpperCase()}`)
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
        <span className="color-orb" style={{ background: value }} />
      </div>
      {invalid && <p className="field-error">请输入有效的 3 位或 6 位 HEX 色值</p>}
    </div>
  )
}

interface SwatchProps {
  color: PaletteColor
  isAnchor: boolean
  onCopy: (color: PaletteColor) => void
  copied: boolean
}

function Swatch({ color, isAnchor, onCopy, copied }: SwatchProps) {
  const contrast = getContrastColor(color.hex)

  return (
    <button
      className="swatch"
      onClick={() => onCopy(color)}
      aria-label={`复制 ${color.name} ${color.hex}`}
    >
      <span
        className="swatch-color"
        style={{ backgroundColor: color.hex, color: contrast }}
      >
        {isAnchor && <span className="anchor-badge">BASE</span>}
        <span className="copy-indicator">
          {copied ? <Check size={16} /> : <Clipboard size={16} />}
        </span>
      </span>
      <span className="swatch-meta">
        <strong>{color.name}</strong>
        <span>{color.hex}</span>
      </span>
    </button>
  )
}

function Preview({
  palette,
  kind,
}: {
  palette: PaletteColor[]
  kind: PaletteKind
}) {
  const color = (index: number) => palette[index - 1].hex

  return (
    <section className="preview-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LIVE PREVIEW</p>
          <h2>应用预览</h2>
        </div>
        <span className="section-caption">实时映射色阶</span>
      </div>
      <div className="preview-grid">
        <div
          className="preview-card preview-ui"
          style={{
            background: color(1),
            borderColor: color(3),
            color: color(12),
          }}
        >
          <div className="mock-nav">
            <span className="mock-logo" style={{ background: color(9) }}>
              C
            </span>
            <span>Chromatic</span>
            <span className="mock-status" style={{ background: color(3) }}>
              已同步
            </span>
          </div>
          <div className="mock-body">
            <span
              className="mock-label"
              style={{ color: kind === 'brand' ? color(9) : color(10) }}
            >
              DESIGN TOKENS
            </span>
            <h3>让色彩自然形成系统</h3>
            <p style={{ color: color(8) }}>
              从一个基准色出发，得到稳定、连续且可直接应用的完整色板。
            </p>
            <div className="mock-actions">
              <button
                style={{
                  background: color(9),
                  color: getContrastColor(color(9)),
                }}
              >
                开始使用
              </button>
              <button
                style={{
                  background: color(2),
                  color: color(10),
                  borderColor: color(4),
                }}
              >
                查看规范
              </button>
            </div>
          </div>
        </div>
        <div className="preview-card preview-scale">
          <div className="scale-header">
            <div>
              <span>色阶分布</span>
              <strong>01 — 13</strong>
            </div>
            <Sparkles size={20} />
          </div>
          <div className="scale-bars">
            {palette.map((item, position) => (
              <span
                key={item.name}
                style={{
                  background: item.hex,
                  height: `${34 + position * 4}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildAllPalettes(brand: string, neutral: string) {
  return {
    brand: {
      light: generatePalette('brand', 'light', brand, neutral),
      dark: generatePalette('brand', 'dark', brand, neutral),
    },
    neutral: {
      light: generatePalette('neutral', 'light', brand, neutral),
      dark: generatePalette('neutral', 'dark', brand, neutral),
    },
  }
}

function palettesToCss(brand: string, neutral: string) {
  const palettes = buildAllPalettes(brand, neutral)
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

function App() {
  const [kind, setKind] = useState<PaletteKind>('brand')
  const [mode, setMode] = useState<PaletteMode>('light')
  const [brandHex, setBrandHex] = useState(DEFAULT_BRAND)
  const [neutralHex, setNeutralHex] = useState(DEFAULT_NEUTRAL)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const toastTimer = useRef<number | null>(null)

  const palette = useMemo(
    () => generatePalette(kind, mode, brandHex, neutralHex),
    [brandHex, kind, mode, neutralHex],
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

  const copyColor = async (color: PaletteColor) => {
    if (await copyText(color.hex, `已复制 ${color.name} · ${color.hex}`)) {
      setCopiedKey(color.name)
      window.setTimeout(() => setCopiedKey(null), 1200)
    }
  }

  const downloadJson = () => {
    const content = JSON.stringify(buildAllPalettes(brandHex, neutralHex), null, 2)
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
    setBrandHex(DEFAULT_BRAND)
    setNeutralHex(DEFAULT_NEUTRAL)
    showToast('已恢复默认色值')
  }

  const isAnchor = (index: number) =>
    index === (kind === 'brand' ? 9 : 13)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-mark" href="#" aria-label="Chromatic 首页">
          <span className="brand-icon">
            <Palette size={19} />
          </span>
          <span>
            Chromatic
            <small>COLOR SYSTEM</small>
          </span>
        </a>
        <div className="topbar-meta">
          <span className="version">13 STEP PALETTE</span>
          <span className="topbar-divider" />
          <span>v1.0</span>
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
              基于 HSV、HSL 与透明叠加算法，生成连续、可靠的 13
              阶品牌色与中性色板。
            </p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <span style={{ background: brandHex }} />
            <span style={{ background: palette[7].hex }} />
            <span style={{ background: palette[5].hex }} />
            <span style={{ background: palette[3].hex }} />
            <span style={{ background: palette[1].hex }} />
          </div>
        </section>

        <section className="workspace">
          <div className="control-panel">
            <div className="control-top">
              <div className="tab-list" role="tablist" aria-label="色板类型">
                <button
                  role="tab"
                  aria-selected={kind === 'brand'}
                  className={kind === 'brand' ? 'active' : ''}
                  onClick={() => setKind('brand')}
                >
                  品牌色 / 辅助色
                </button>
                <button
                  role="tab"
                  aria-selected={kind === 'neutral'}
                  className={kind === 'neutral' ? 'active' : ''}
                  onClick={() => setKind('neutral')}
                >
                  中性色
                </button>
              </div>
              <div className="mode-switch" aria-label="色板模式">
                <button
                  className={mode === 'light' ? 'active' : ''}
                  aria-pressed={mode === 'light'}
                  onClick={() => setMode('light')}
                >
                  <Sun size={15} />
                  浅色
                </button>
                <button
                  className={mode === 'dark' ? 'active' : ''}
                  aria-pressed={mode === 'dark'}
                  onClick={() => setMode('dark')}
                >
                  <Moon size={15} />
                  暗色
                </button>
              </div>
            </div>

            <div className="input-row">
              {kind === 'brand' && (
                <ColorInput
                  id="brand-color"
                  label="品牌 / 辅助色基准"
                  hint="映射至 color-9"
                  value={brandHex}
                  onChange={setBrandHex}
                />
              )}
              <ColorInput
                id="neutral-color"
                label={kind === 'brand' ? '中性色混合基底' : '中性色基准'}
                hint={
                  kind === 'brand'
                    ? '用于构建暗色色板'
                    : '映射至 color-13'
                }
                value={neutralHex}
                onChange={setNeutralHex}
              />
              <button className="reset-button" onClick={resetColors}>
                <RotateCcw size={16} />
                恢复默认
              </button>
            </div>
          </div>

          <div className="palette-section">
            <div className="section-heading palette-heading">
              <div>
                <p className="eyebrow">GENERATED PALETTE</p>
                <h2>
                  {kind === 'brand' ? '品牌色 / 辅助色' : '中性色'} ·{' '}
                  {mode === 'light' ? '浅色色板' : '暗色色板'}
                </h2>
              </div>
              <div className="palette-actions">
                <button
                  onClick={() =>
                    void copyText(
                      palettesToCss(brandHex, neutralHex),
                      '全部 CSS 变量已复制',
                    )
                  }
                >
                  <Code2 size={16} />
                  复制 CSS
                </button>
                <button onClick={downloadJson}>
                  <Download size={16} />
                  导出 JSON
                </button>
              </div>
            </div>

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
                  isAnchor={isAnchor(color.index)}
                  copied={copiedKey === color.name}
                  onCopy={(item) => void copyColor(item)}
                />
              ))}
            </div>
            <p className="palette-tip">
              <span />
              点击任意色块复制 HEX 色值
            </p>
          </div>
        </section>

        <Preview palette={palette} kind={kind} />

        <section className="formula-section">
          <div className="formula-card">
            <div className="formula-index">01</div>
            <div>
              <span>COLOR MODEL</span>
              <strong>{kind === 'brand' ? 'HSV' : mode === 'dark' ? 'HSL' : 'HSV'}</strong>
              <p>逐级计算，所有通道自动限制在有效范围内。</p>
            </div>
          </div>
          <ChevronRight className="formula-arrow" />
          <div className="formula-card">
            <div className="formula-index">02</div>
            <div>
              <span>ANCHOR</span>
              <strong>Color-{kind === 'brand' ? '9' : '13'}</strong>
              <p>保留输入色作为稳定锚点，向两侧推导色阶。</p>
            </div>
          </div>
          <ChevronRight className="formula-arrow" />
          <div className="formula-card">
            <div className="formula-index">03</div>
            <div>
              <span>DARK MODE</span>
              <strong>{kind === 'brand' ? 'Alpha Blend' : 'HSL Shift'}</strong>
              <p>
                {kind === 'brand'
                  ? '以中性色基底叠加浅色色板，保证暗色环境自然融合。'
                  : '按色相区间调整明度与饱和度，保持层级清晰。'}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>CHROMATIC COLOR SYSTEM</span>
        <span>Built for consistent digital products.</span>
      </footer>

      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          {toast.tone === 'success' ? <Check size={17} /> : <span>!</span>}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
