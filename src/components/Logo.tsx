'use client'

import Image from 'next/image'
import { useState } from 'react'

interface LogoIconProps {
  size?: number
  className?: string
}

interface LogoFullProps {
  width?: number
  className?: string
}

/** Icon-only mark (B + lightning bolt). Falls back to a neon "B" if image missing. */
export function LogoIcon({ size = 36, className = '' }: LogoIconProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, hsl(var(--neon-blue)/0.25), hsl(var(--neon-purple)/0.2))",
          border: "1px solid hsl(var(--neon-blue)/0.3)",
          boxShadow: "0 0 16px -4px hsl(var(--neon-blue)/0.4)",
          fontSize: size * 0.5,
          fontWeight: 800,
          color: "hsl(var(--neon-blue))",
          fontFamily: "var(--font-display, sans-serif)",
        }}
      >
        B
      </div>
    )
  }

  return (
    <Image
      src="/images/logo-icon.png"
      alt="Bet.lk"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
      onError={() => setFailed(true)}
      priority
    />
  )
}

/** Full logo with text + graphics. Falls back to icon + wordmark if image missing. */
export function LogoFull({ width = 160, className = '' }: LogoFullProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, hsl(var(--neon-blue)/0.25), hsl(var(--neon-purple)/0.2))",
            border: "1px solid hsl(var(--neon-blue)/0.3)",
            boxShadow: "0 0 32px -8px hsl(var(--neon-blue)/0.5)",
            fontSize: 40,
            fontWeight: 800,
            color: "hsl(var(--neon-blue))",
            fontFamily: "var(--font-display, sans-serif)",
          }}
        >
          ⚡
        </div>
        <span
          className="font-display text-3xl font-bold tracking-tight text-foreground"
        >
          Bet<span style={{ color: "hsl(var(--neon-blue))" }}>.lk</span>
        </span>
      </div>
    )
  }

  return (
    <Image
      src="/images/logo.png"
      alt="Bet.lk"
      width={width}
      height={width}
      className={`select-none ${className}`}
      onError={() => setFailed(true)}
      style={{ filter: "drop-shadow(0 0 32px hsl(var(--neon-blue)/0.4))" }}
      priority
    />
  )
}
