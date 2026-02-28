import { CandidateForm } from "@/components/candidates/candidate-form"

export default function NewCandidatePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">候補者 新規登録</h1>
        <p className="text-sm text-muted-foreground">
          候補者情報を入力してください。* は必須項目です。
        </p>
      </div>
      <CandidateForm mode="create" />
    </div>
  )
}
