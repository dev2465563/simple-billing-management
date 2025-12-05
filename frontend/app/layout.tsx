import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

const openSans = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Metronome Billing Integration Dashboard',
  description: 'Complete billing lifecycle management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={openSans.className}>
        <AuthProvider>
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Metronome Billing</h1>
                  <p className="text-sm text-gray-500 mt-1">Billing lifecycle management</p>
                </div>
              </div>
            </div>
          </header>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
