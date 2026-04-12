import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Sparkles,
  SlidersHorizontal,
  Lock,
  Unlock,
  Eraser,
  Pipette,
} from 'lucide-react'

interface ImageToolsProps {
  initialSrc?: string
  onApply?: (dataUrl: string) => void
  compact?: boolean
}

interface Dimensions {
  width: number
  height: number
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function applyConvolution(
  src: ImageData,
  kernel: number[],
  kSize: number,
): ImageData {
  const { width, height, data } = src
  const out = new ImageData(width, height)
  const half = (kSize - 1) / 2

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = clamp(x + kx - half, 0, width - 1)
          const py = clamp(y + ky - half, 0, height - 1)
          const i = (py * width + px) * 4
          const w = kernel[ky * kSize + kx]
          r += data[i] * w
          g += data[i + 1] * w
          b += data[i + 2] * w
        }
      }
      const idx = (y * width + x) * 4
      out.data[idx] = clamp(r, 0, 255)
      out.data[idx + 1] = clamp(g, 0, 255)
      out.data[idx + 2] = clamp(b, 0, 255)
      out.data[idx + 3] = data[idx + 3]
    }
  }
  return out
}

function sharpenKernel(amount: number): number[] {
  const a = amount
  return [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0]
}

function adjustBrightness(data: ImageData, amount: number): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(data.data),
    data.width,
    data.height,
  )
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = clamp(out.data[i] + amount, 0, 255)
    out.data[i + 1] = clamp(out.data[i + 1] + amount, 0, 255)
    out.data[i + 2] = clamp(out.data[i + 2] + amount, 0, 255)
  }
  return out
}

function adjustContrast(data: ImageData, amount: number): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(data.data),
    data.width,
    data.height,
  )
  const factor = (259 * (amount + 255)) / (255 * (259 - amount))
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = clamp(factor * (out.data[i] - 128) + 128, 0, 255)
    out.data[i + 1] = clamp(factor * (out.data[i + 1] - 128) + 128, 0, 255)
    out.data[i + 2] = clamp(factor * (out.data[i + 2] - 128) + 128, 0, 255)
  }
  return out
}

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function removeBackground(
  data: ImageData,
  seedX: number,
  seedY: number,
  tolerance: number,
  feather: number,
): ImageData {
  const { width, height } = data
  const out = new ImageData(new Uint8ClampedArray(data.data), width, height)
  const visited = new Uint8Array(width * height)
  const seedIdx = (seedY * width + seedX) * 4
  const sr = data.data[seedIdx]
  const sg = data.data[seedIdx + 1]
  const sb = data.data[seedIdx + 2]

  const queue: [number, number][] = [[seedX, seedY]]
  visited[seedY * width + seedX] = 1

  while (queue.length > 0) {
    const [x, y] = queue.pop()!
    const idx = (y * width + x) * 4
    const r = data.data[idx]
    const g = data.data[idx + 1]
    const b = data.data[idx + 2]
    const dist = colorDistance(r, g, b, sr, sg, sb)

    if (dist <= tolerance) {
      // Fully transparent
      out.data[idx + 3] = 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = ny * width + nx
          if (!visited[ni]) {
            visited[ni] = 1
            queue.push([nx, ny])
          }
        }
      }
    } else if (dist <= tolerance + feather) {
      const alpha = Math.round(255 * ((dist - tolerance) / feather))
      out.data[idx + 3] = Math.min(out.data[idx + 3], alpha)
    }
  }

  return out
}

export default function ImageTools({
  initialSrc,
  onApply,
  compact = false,
}: ImageToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loaded, setLoaded] = useState(false)
  const [originalDims, setOriginalDims] = useState<Dimensions>({
    width: 0,
    height: 0,
  })
  const [targetWidth, setTargetWidth] = useState(0)
  const [targetHeight, setTargetHeight] = useState(0)
  const [lockAspect, setLockAspect] = useState(true)
  const [sharpness, setSharpness] = useState(0)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [quality, setQuality] = useState(92)
  const [processing, setProcessing] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [bgRemoveMode, setBgRemoveMode] = useState<'off' | 'pick' | 'done'>('off')
  const [bgTolerance, setBgTolerance] = useState(30)
  const [bgFeather, setBgFeather] = useState(10)
  const [bgRemovedData, setBgRemovedData] = useState<ImageData | null>(null)

  const aspect = originalDims.width / (originalDims.height || 1)

  const loadImage = useCallback((src: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      originalRef.current = img
      setOriginalDims({ width: img.naturalWidth, height: img.naturalHeight })
      setTargetWidth(img.naturalWidth)
      setTargetHeight(img.naturalHeight)
      setLoaded(true)
      setSharpness(0)
      setBrightness(0)
      setContrast(0)
    }
    img.onerror = () => setLoaded(false)
    img.src = src
  }, [])

  useEffect(() => {
    if (initialSrc) loadImage(initialSrc)
  }, [initialSrc, loadImage])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      loadImage(url)
    }
    reader.readAsDataURL(file)
  }

  const processImage = useCallback(() => {
    const img = originalRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    setProcessing(true)
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d')!
      canvas.width = targetWidth
      canvas.height = targetHeight

      ctx.clearRect(0, 0, targetWidth, targetHeight)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

      if (brightness !== 0) {
        imageData = adjustBrightness(imageData, brightness)
      }
      if (contrast !== 0) {
        imageData = adjustContrast(imageData, contrast)
      }
      if (sharpness > 0) {
        imageData = applyConvolution(
          imageData,
          sharpenKernel(sharpness / 100),
          3,
        )
      }

      if (bgRemovedData) {
        for (let i = 3; i < imageData.data.length; i += 4) {
          imageData.data[i] = Math.min(imageData.data[i], bgRemovedData.data[i])
        }
      }

      ctx.putImageData(imageData, 0, 0)
      setProcessing(false)
    })
  }, [targetWidth, targetHeight, sharpness, brightness, contrast, bgRemovedData])

  useEffect(() => {
    if (loaded) processImage()
  }, [loaded, processImage])

  const handleWidthChange = (w: number) => {
    const clamped = Math.max(1, w)
    setTargetWidth(clamped)
    if (lockAspect) setTargetHeight(Math.round(clamped / aspect))
  }

  const handleHeightChange = (h: number) => {
    const clamped = Math.max(1, h)
    setTargetHeight(clamped)
    if (lockAspect) setTargetWidth(Math.round(clamped * aspect))
  }

  const scaleBy = (factor: number) => {
    const w = Math.round(targetWidth * factor)
    const h = Math.round(targetHeight * factor)
    setTargetWidth(Math.max(1, w))
    setTargetHeight(Math.max(1, h))
  }

  const resetAll = () => {
    setTargetWidth(originalDims.width)
    setTargetHeight(originalDims.height)
    setSharpness(0)
    setBrightness(0)
    setContrast(0)
    setQuality(92)
    setBgRemovedData(null)
    setBgRemoveMode('off')
  }

  const applyPreset = (w: number, h: number) => {
    setLockAspect(false)
    setTargetWidth(w)
    setTargetHeight(h)
    setPresetOpen(false)
  }

  const enhance = () => {
    setSharpness(40)
    setBrightness(8)
    setContrast(15)
  }

  const hasBgRemoval = bgRemovedData !== null

  const getResultDataUrl = () => {
    const canvas = canvasRef.current
    if (!canvas) return ''
    if (hasBgRemoval) return canvas.toDataURL('image/png')
    return canvas.toDataURL('image/jpeg', quality / 100)
  }

  const downloadImage = () => {
    const url = getResultDataUrl()
    if (!url) return
    const ext = hasBgRemoval ? 'png' : 'jpg'
    const a = document.createElement('a')
    a.href = url
    a.download = `image-${targetWidth}x${targetHeight}.${ext}`
    a.click()
  }

  const handleApply = () => {
    const url = getResultDataUrl()
    if (url && onApply) onApply(url)
  }

  const PRESETS = [
    { label: 'Article Hero (1200×630)', w: 1200, h: 630 },
    { label: 'OG Image (1200×630)', w: 1200, h: 630 },
    { label: 'Twitter Card (1200×675)', w: 1200, h: 675 },
    { label: 'Instagram (1080×1080)', w: 1080, h: 1080 },
    { label: 'Thumbnail (400×300)', w: 400, h: 300 },
    { label: 'HD (1920×1080)', w: 1920, h: 1080 },
  ]

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 ${compact ? '' : 'p-6'}`}
    >
      {!compact && (
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">Image Tools</h2>
        </div>
      )}

      {/* Upload area */}
      {!loaded && (
        <label
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.type.startsWith('image/')) handleFile(f)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-10 h-10 text-gray-300 mb-3" />
          <span className="text-sm text-gray-500 font-medium">
            Drop an image or click to upload
          </span>
          <span className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP supported
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </label>
      )}

      {loaded && (
        <div className="space-y-5">
          {/* Preview */}
          <div className="relative bg-gray-50 rounded-lg p-2 flex items-center justify-center min-h-[200px] overflow-hidden checkerboard-bg">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[400px] rounded shadow-sm ${bgRemoveMode === 'pick' ? 'cursor-crosshair' : ''}`}
              style={{ imageRendering: 'auto' }}
              onClick={(e) => {
                if (bgRemoveMode !== 'pick') return
                const canvas = canvasRef.current
                if (!canvas) return
                const rect = canvas.getBoundingClientRect()
                const scaleX = canvas.width / rect.width
                const scaleY = canvas.height / rect.height
                const x = Math.round((e.clientX - rect.left) * scaleX)
                const y = Math.round((e.clientY - rect.top) * scaleY)
                const ctx = canvas.getContext('2d')!
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const removed = removeBackground(imageData, x, y, bgTolerance, bgFeather)
                setBgRemovedData(removed)
                setBgRemoveMode('done')
              }}
            />
            {processing && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 text-center">
            Original: {originalDims.width} × {originalDims.height} → Output:{' '}
            {targetWidth} × {targetHeight}
          </div>

          {/* Resize controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" /> Resize
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scaleBy(0.5)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Half size"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scaleBy(2)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Double size"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetAll}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Reset all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-0.5 block">W</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  min={1}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => setLockAspect(!lockAspect)}
                className={`mt-4 p-1.5 rounded transition-colors ${lockAspect ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-600'}`}
                title={
                  lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'
                }
              >
                {lockAspect ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-0.5 block">H</label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  min={1}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="relative">
              <button
                onClick={() => setPresetOpen(!presetOpen)}
                className="text-xs text-primary font-medium hover:underline"
              >
                Size presets ▾
              </button>
              {presetOpen && (
                <div className="absolute z-10 top-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p.w, p.h)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhancement controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Enhance
              </h3>
              <button
                onClick={enhance}
                className="text-xs font-medium text-primary hover:underline"
              >
                Auto-enhance
              </button>
            </div>

            <SliderControl
              label="Sharpness"
              value={sharpness}
              min={0}
              max={100}
              onChange={setSharpness}
            />
            <SliderControl
              label="Brightness"
              value={brightness}
              min={-100}
              max={100}
              onChange={setBrightness}
            />
            <SliderControl
              label="Contrast"
              value={contrast}
              min={-100}
              max={100}
              onChange={setContrast}
            />
          </div>

          {/* Background Removal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5" /> Remove Background
              </h3>
              {bgRemovedData && (
                <button
                  onClick={() => { setBgRemovedData(null); setBgRemoveMode('off') }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              )}
            </div>

            {bgRemoveMode === 'off' && (
              <button
                onClick={() => setBgRemoveMode('pick')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
              >
                <Pipette className="w-4 h-4" />
                Click to pick background color
              </button>
            )}

            {bgRemoveMode === 'pick' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-amber-800 font-medium flex items-center gap-1.5">
                  <Pipette className="w-4 h-4" /> Click on the background area to remove
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Click the color you want to make transparent
                </p>
                <button
                  onClick={() => setBgRemoveMode('off')}
                  className="mt-2 text-xs text-amber-700 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {bgRemoveMode === 'done' && (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                  Background removed! Adjust tolerance and feather below, then re-pick if needed.
                </div>
                <SliderControl label="Tolerance" value={bgTolerance} min={5} max={100} onChange={setBgTolerance} />
                <SliderControl label="Feather" value={bgFeather} min={0} max={50} onChange={setBgFeather} />
                <button
                  onClick={() => setBgRemoveMode('pick')}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Pipette className="w-3 h-3" /> Re-pick background color
                </button>
              </div>
            )}
          </div>

          {/* Quality */}
          {!hasBgRemoval && (
            <SliderControl
              label="JPEG Quality"
              value={quality}
              min={10}
              max={100}
              onChange={setQuality}
              suffix="%"
            />
          )}
          {hasBgRemoval && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Output: PNG (transparency preserved)
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setLoaded(false)
                originalRef.current = null
                setBgRemovedData(null)
                setBgRemoveMode('off')
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              New Image
            </button>
            <button
              onClick={downloadImage}
              className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            {onApply && (
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Use Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
  suffix = '',
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-500 w-20 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
      />
      <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
  )
}
