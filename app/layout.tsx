import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/contexts/cart-context'
import { WishlistProvider } from '@/lib/contexts/wishlist-context'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { ConditionalLayout } from '@/components/conditional-layout'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://tnautomation.in'),
  title: {
    default: 'TN Automation',
    template: '%s | TN Automation',
  },
  description: 'Professional CCTV cameras, security systems, and installation services. Shop dome cameras, bullet cameras, and more from trusted brands.',
  icons: {
    icon: '/images/tnlogo.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'TN Automation',
    description: 'Professional CCTV cameras, security systems, and installation services.',
    url: 'https://tnautomation.in',
    siteName: 'TN Automation',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TN Automation',
    description: 'Professional CCTV cameras, security systems, and installation services.',
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
