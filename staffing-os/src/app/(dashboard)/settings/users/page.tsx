import { getUsers } from "@/actions/users"
import { UserManagement } from "@/components/settings/user-management"

export default async function UsersSettingsPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <p className="text-sm text-muted-foreground">
          ユーザーの追加・ロール変更・アカウント管理
        </p>
      </div>

      <UserManagement users={users} />
    </div>
  )
}
