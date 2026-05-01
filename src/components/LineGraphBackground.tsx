'use client'

import { useEffect, useRef } from 'react'

/* ── helpers (same math as original Three.js version) ── */
function smoothNoise(t: number, seed: number): number {
  const s = seed * 1000
  return (
    Math.sin(t * 0.7 + s) * 0.4 +
    Math.sin(t * 1.3 + s * 1.7) * 0.3 +
    Math.sin(t * 2.1 + s * 0.3) * 0.2 +
    Math.sin(t * 0.3 + s * 2.1) * 0.1
  )
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

const SEGMENTS = 120

function drawCurve(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  color: string,
  seed: number,
  yBaseFrac: number,
  amplitude: number,
  opacity: number,
  glowSize: number,
) {
  ctx.save()
  ctx.shadowBlur = glowSize
  ctx.shadowColor = color
  ctx.strokeStyle = color
  ctx.globalAlpha = opacity
  ctx.lineWidth = glowSize > 15 ? 3 : 1.5
  ctx.beginPath()

  for (let i = 0; i <= SEGMENTS; i++) {
    const frac = i / SEGMENTS
    const x = frac * w

    const baseWave = smoothNoise(frac * 4 + t, 123)
    const divOsc = (Math.sin(t * 0.2 + seed) + 1) * 0.5
    const divOff = smoothNoise(frac * 6 + t * 1.2, seed) * 0.8 * divOsc
    const rolling = Math.sin(t * 0.5 + seed * 0.3 + frac * 5) * 0.3
    const local = smoothNoise(frac * 8 + t * 0.9, seed * 2) * 0.15

    const yNorm = baseWave + divOff + rolling + local
    const y = h * yBaseFrac - yNorm * amplitude

    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }

  ctx.stroke()
  ctx.restore()
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const vx = w * 0.5
  const vy = h * 0.60
  const cols = 16
  const rows = 10

  ctx.save()
  ctx.lineWidth = 0.5

  // Horizontal grid lines
  for (let i = 1; i <= rows; i++) {
    const prog = i / rows
    const y = lerp(vy, h, prog)
    const spread = w * 0.9 * prog
    ctx.globalAlpha = 0.18 * prog
    ctx.strokeStyle = '#3f2080'
    ctx.beginPath()
    ctx.moveTo(vx - spread / 2, y)
    ctx.lineTo(vx + spread / 2, y)
    ctx.stroke()
  }

  // Vertical rays from vanishing point
  for (let i = 0; i <= cols; i++) {
    const prog = i / cols
    const bx = lerp(vx - w * 0.45, vx + w * 0.45, prog)
    ctx.globalAlpha = 0.12
    ctx.strokeStyle = '#2a1060'
    ctx.beginPath()
    ctx.moveTo(vx, vy)
    ctx.lineTo(bx, h)
    ctx.stroke()
  }

  ctx.restore()
}

export function LineGraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function frame() {
      if (!canvas || !ctx) return
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      drawGrid(ctx, w, h)

      // Purple lines (seed 88) — two passes for core + wide glow
      drawCurve(ctx, w, h, t, '#9557db', 88, 0.48, h * 0.18, 0.9, 8)
      drawCurve(ctx, w, h, t, '#9557db', 88, 0.48, h * 0.18, 0.2, 28)

      // Blue lines (seed 42)
      drawCurve(ctx, w, h, t, '#3f9efd', 42, 0.44, h * 0.16, 0.9, 8)
      drawCurve(ctx, w, h, t, '#3f9efd', 42, 0.44, h * 0.16, 0.2, 28)

      t += 0.006
      animId = requestAnimationFrame(frame)
    }

    frame()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="w-full h-full opacity-75" />
    </div>
  )
}
