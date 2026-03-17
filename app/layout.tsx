
import ClientLayout from '@/components/ClientLayout'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/contexts/cart-context'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={"antialiased flex flex-col min-h-screen bg-background overflow-x-hidden " + inter.className}>
        <CartProvider>
          <ClientLayout>{children}</ClientLayout>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
