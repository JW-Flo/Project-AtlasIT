import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

const tabs = [
  { href: '/', label: 'Overview' },
  { href: '/saas-cost', label: 'SaaS Cost' },
  { href: '/security', label: 'Security' },
  { href: '/contractors', label: 'Contractors' },
  { href: '/okta', label: 'Okta Workflows' }
]

export const metadata = {
  title: 'Project Ignite Dashboard'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <nav className="max-w-6xl mx-auto flex space-x-6 p-4">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="text-gray-700 hover:text-indigo-600 font-medium">
                {t.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  )
}
