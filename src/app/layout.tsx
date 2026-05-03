import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bet.lk — Sri Lanka\'s #1 Prediction Market',
  description: 'Predict the future, win big. Bet on politics, sports, crypto & more using your daily point allowance.',
  icons: {
    icon: [
      { url: '/images/logo-icon.png', type: 'image/png' },
    ],
    apple: '/images/logo-icon.png',
    shortcut: '/images/logo-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
