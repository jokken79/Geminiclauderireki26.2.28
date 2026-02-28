import type { Metadata } from "next"
import localFont from "next/font/local"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Staffing OS | 人材派遣管理システム",
  description: "人材派遣会社向け総合管理システム",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
