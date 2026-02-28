import Link from "next/link"
import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCompanies } from "@/actions/companies"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const { companies, total } = await getCompanies({
    search: params.search,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">企業一覧</h1>
          <p className="text-sm text-muted-foreground">
            派遣先・工場の管理（{total}社）
          </p>
        </div>
        <Link href="/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            企業データはまだありません。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="transition-colors hover:border-primary cursor-pointer h-full">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{company.name}</h3>
                      {company.nameKana && (
                        <p className="text-xs text-muted-foreground">{company.nameKana}</p>
                      )}
                    </div>
                    {!company.isActive && (
                      <Badge variant="secondary">無効</Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {company.industry && <p>業種: {company.industry}</p>}
                    {company.prefecture && <p>所在地: {company.prefecture}</p>}
                    {company.contactName && <p>担当: {company.contactName}</p>}
                  </div>

                  <div className="flex gap-4 text-xs">
                    <span className="text-blue-600 dark:text-blue-400">
                      派遣: {company._count.hakenshain}名
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      請負: {company._count.ukeoi}名
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
