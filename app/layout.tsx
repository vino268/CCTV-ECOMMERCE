import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/contexts/cart-context'
import { WishlistProvider } from '@/lib/contexts/wishlist-context'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { ConditionalLayout } from '@/components/conditional-layout'
import './globals.css'

export const dynamic = 'force-dynamic'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TN Automation - Professional CCTV',
  description: 'Professional CCTV cameras, security systems, and installation services. Shop dome cameras, bullet cameras, and more from trusted brands.',
  generator: 'v0.app',
  icons: {
    icon: '/images/tnlogo.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
