"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Shield, UserX, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS } from "@/lib/constants"
import { createUser, updateUserRole, toggleUserActive } from "@/actions/users"
import type { UserRole } from "@prisma/client"

interface UserManagementProps {
  users: {
    id: string
    email: string
    name: string
    role: UserRole
    isActive: boolean
    createdAt: Date
  }[]
}

export function UserManagement({ users }: UserManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Create user form state
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "TANTOSHA" as UserRole,
  })

  const handleCreate = () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error("全ての項目を入力してください")
      return
    }

    startTransition(async () => {
      const result = await createUser(newUser)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("ユーザーを作成しました")
        setShowCreateForm(false)
        setNewUser({ email: "", name: "", password: "", role: "TANTOSHA" })
      }
    })
  }

  const handleRoleChange = (userId: string, role: UserRole) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, role)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("ロールを更新しました")
      }
    })
  }

  const handleToggleActive = (userId: string) => {
    if (!confirm("このユーザーのステータスを変更しますか？")) return
    startTransition(async () => {
      const result = await toggleUserActive(userId)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("ステータスを変更しました")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          ユーザー追加
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>新しいユーザー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>氏名 *</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 田中太郎"
                />
              </div>
              <div>
                <Label>メールアドレス *</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="example@staffing-os.jp"
                />
              </div>
              <div>
                <Label>パスワード *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="8文字以上"
                />
              </div>
              <div>
                <Label>ロール</Label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "作成中..." : "作成"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User List */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ユーザー</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">メール</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ロール</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ステータス</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">登録日</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {user.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={isPending}
                    className="rounded-md border px-2 py-1 text-xs"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? "success" : "secondary"}>
                    {user.isActive ? "有効" : "無効"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user.id)}
                    disabled={isPending}
                  >
                    {user.isActive ? (
                      <UserX className="h-4 w-4 text-destructive" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
