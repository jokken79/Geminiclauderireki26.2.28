"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, Eye, EyeOff, Users, ShieldCheck, Zap } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen animate-in fade-in duration-500">
      {/* Left side: Branding / Illustration (60%) */}
      <div className="hidden lg:flex w-[60%] flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground p-12">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-6">
            <span className="text-2xl font-bold">S</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Staffing OS</h1>
          <p className="text-xl text-primary-foreground/80 mb-12">人材派遣管理をシンプルに</p>

          <div className="space-y-6 max-w-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">一元管理</h3>
                <p className="text-sm text-primary-foreground/70">候補者から派遣先まで全てを一つの画面で</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">コンプライアンス管理</h3>
                <p className="text-sm text-primary-foreground/70">在留期限や抵触日を自動でトラッキング</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">高速な検索機能</h3>
                <p className="text-sm text-primary-foreground/70">1000名以上のデータからも一瞬で検索</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-primary-foreground/50">
          &copy; {new Date().getFullYear()} Staffing OS. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form (40%) */}
      <div className="flex w-full lg:w-[40%] flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">ログイン</h2>
            <p className="text-sm text-muted-foreground mt-2">
              アカウントにアクセスして管理を始めましょう
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">パスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive mt-2">{error}</p>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="rounded-lg bg-muted p-4 text-center text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">デモ用クレデンシャル</p>
            <p>Admin: admin@example.com / password123</p>
            <p>User: user@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
