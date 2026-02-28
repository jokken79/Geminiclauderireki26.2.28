import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompanyForm } from "@/components/companies/company-form"

export default function CompanyNewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧へ戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">企業新規登録</h1>
          <p className="text-sm text-muted-foreground">新しい企業を登録します</p>
        </div>
      </div>

      <CompanyForm mode="create" />
    </div>
  )
}
