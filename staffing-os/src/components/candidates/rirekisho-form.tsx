"use client"

import React, { useRef, useTransition, useState } from "react"
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { candidateSchema, type CandidateFormData } from "@/lib/validators/candidate"
import { createCandidate } from "@/actions/candidates"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { LEVELS } from "./rirekisho-constants"

const tableFieldClass =
  "w-full bg-transparent p-0 outline-none focus:bg-sky-50/50 rounded-[2px] px-1 text-[9pt]"

function calcAge(birthDate?: string): string {
  if (!birthDate) return ""
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return ""
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age}歳`
}

// Visa status enum values mapped to Japanese labels
const VISA_STATUS_OPTIONS = [
  { value: "PERMANENT_RESIDENT", label: "永住者" },
  { value: "LONG_TERM_RESIDENT", label: "定住者" },
  { value: "SPOUSE_OF_JAPANESE", label: "日本人の配偶者等" },
  { value: "DESIGNATED_ACTIVITIES", label: "特定活動（家族等）" },
  { value: "TECHNICAL_INTERN_1", label: "技能実習1号" },
  { value: "TECHNICAL_INTERN_2", label: "技能実習2号" },
  { value: "TECHNICAL_INTERN_3", label: "技能実習3号" },
  { value: "SPECIFIED_SKILLED_1", label: "特定技能1号" },
  { value: "SPECIFIED_SKILLED_2", label: "特定技能2号" },
  { value: "STUDENT", label: "留学（要資格外活動許可）" },
  { value: "DEPENDENT", label: "家族滞在（要資格外活動許可）" },
  { value: "OTHER", label: "その他" },
] as const

export function RirekishoForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState("")

  const form = useForm<CandidateFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(candidateSchema) as any,
    defaultValues: {
      lastNameKanji: "",
      firstNameKanji: "",
      lastNameFurigana: "",
      firstNameFurigana: "",
      lastNameRomaji: "",
      firstNameRomaji: "",
      birthDate: "",
      nationality: "",
      workHistory: [],
      familyMembers: [],
      qualifications: [],
      jlptLevel: "NONE",
      lunchPref: "昼/夜",
      expWelding: false,
      expForklift: false,
      expLineWork: false,
      expAssembly: false,
      expPacking: false,
      expInspection: false,
      expPainting: false,
      expMachining: false,
      expCleaning: false,
      expCooking: false,
      hasDriverLicense: false,
      hasForkliftLicense: false,
      hasCraneLicense: false,
      hasWeldingCert: false,
    },
  })

  const { register, handleSubmit, watch, control } = form

  const { fields: jobFields, append: addJob, remove: removeJob } = useFieldArray({
    control,
    name: "workHistory",
  })

  const { fields: familyFields, append: addFamily, remove: removeFamily } = useFieldArray({
    control,
    name: "familyMembers",
  })

  const birthDate = watch("birthDate")

  async function lookupPostalCode(postalCode: string) {
    const digits = postalCode.replace(/[^0-9]/g, "")
    if (digits.length !== 7) return
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
      const data = await res.json()
      if (data.results?.[0]) {
        form.setValue("prefecture", data.results[0].address1)
        form.setValue("city", data.results[0].address2 + data.results[0].address3)
      }
    } catch {
      // silent fail
    }
  }

  const onSubmit: SubmitHandler<CandidateFormData> = (data) => {
    startTransition(async () => {
      const result = await createCandidate({ ...data, photoDataUrl } as CandidateFormData)
      if (result && "success" in result && result.success) {
        toast.success("登録が完了しました")
        router.push("/candidates")
      } else {
        const errResult = result as { error?: string } | undefined
        toast.error(errResult?.error || "エラーが発生しました")
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 print:bg-white">
      {/* Header Actions */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-3 border-b border-slate-200 bg-white p-3 shadow-sm print:hidden">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          写真選択
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <button
          type="submit"
          form="rirekisho-form"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "保存中..." : "保存 (登録)"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-sky-600 px-8 py-2 text-sm font-bold text-white hover:bg-sky-700"
        >
          印刷 / PDF
        </button>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const reader = new FileReader()
            reader.onload = () => setPhotoDataUrl(String(reader.result || ""))
            reader.readAsDataURL(f)
          }}
        />
      </div>

      {/* A4 Document */}
      <div className="flex flex-1 justify-center p-4 print:p-0">
        <form
          id="rirekisho-form"
          onSubmit={handleSubmit(onSubmit)}
          className="resume-paper relative box-border flex flex-col bg-white p-4 shadow-2xl print:p-0 print:shadow-none"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          {/* Title */}
          <h1 className="mb-2 text-center text-xl font-black tracking-[0.3em] text-slate-900">
            履 歴 書
          </h1>

          {/* Section 1: Basic Info + Photo */}
          <div className="mb-2 flex gap-2">
            <div className="flex flex-col items-center" style={{ width: "28mm" }}>
              <div
                className="grid cursor-pointer place-items-center overflow-hidden border border-slate-400 bg-slate-50 hover:bg-slate-100"
                style={{ width: "28mm", height: "36mm" }}
                onClick={() => photoRef.current?.click()}
                title="クリックして写真を選択"
              >
                {photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoDataUrl} className="h-full w-full object-cover" alt="写真" />
                ) : (
                  <span className="text-[7pt] text-slate-400">写真</span>
                )}
              </div>
            </div>

            <table className="w-full table-fixed border-collapse border border-slate-400 text-[9pt]">
              <colgroup>
                <col style={{ width: "10%" }} /><col style={{ width: "18%" }} />
                <col style={{ width: "10%" }} /><col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} /><col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} /><col style={{ width: "18%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">受付日</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input type="date" {...register("receptionDate")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">来日</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("timeInJapan")} className={tableFieldClass}>
                      <option value="">選択</option>
                      {LEVELS.timeInJapan.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td colSpan={4} className="border-none" />
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">氏名</th>
                  <td colSpan={3} className="border border-slate-400 px-1 py-1">
                    <input {...register("lastNameKanji")} placeholder="例: 山田 太郎" className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">フリガナ</th>
                  <td colSpan={3} className="border border-slate-400 px-1 py-1">
                    <input {...register("lastNameFurigana")} placeholder="フリガナ（カタカナ）" className={tableFieldClass} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">生年月日</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input type="date" {...register("birthDate")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">年齢</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <span className="text-[9pt]">{calcAge(birthDate)}</span>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">性別</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("gender")} className={tableFieldClass}>
                      <option value="">選択</option>
                      <option value="MALE">男性</option>
                      <option value="FEMALE">女性</option>
                      <option value="OTHER">その他</option>
                      <option value="PREFER_NOT_TO_SAY">回答しない</option>
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">国籍</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input {...register("nationality")} className={tableFieldClass} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">郵便番号</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <div className="flex items-center gap-1">
                      <input
                        {...register("postalCode")}
                        placeholder="000-0000"
                        className={tableFieldClass}
                        onBlur={(e) => lookupPostalCode(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => lookupPostalCode(form.getValues("postalCode") ?? "")}
                        className="print:hidden text-sky-600 text-[8pt]"
                      >
                        〒
                      </button>
                    </div>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">携帯電話</th>
                  <td colSpan={2} className="border border-slate-400 px-1 py-1">
                    <input {...register("mobile")} placeholder="080-0000-0000" className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">電話番号</th>
                  <td colSpan={2} className="border border-slate-400 px-1 py-1">
                    <input {...register("phone")} placeholder="03-0000-0000" className={tableFieldClass} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">住所</th>
                  <td colSpan={7} className="border border-slate-400 px-1 py-1">
                    <div className="flex gap-3">
                      <input {...register("city")} placeholder="市区町村" className={`${tableFieldClass} flex-grow`} />
                      <div className="border-l border-slate-300 pl-3 flex-shrink-0 w-24">
                        <input {...register("addressLine1")} placeholder="番地" className={tableFieldClass} />
                      </div>
                      <div className="border-l border-slate-300 pl-3 flex-grow">
                        <input {...register("addressLine2")} placeholder="建物名・部屋番号" className={tableFieldClass} />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="mb-2">
            <div className="mb-1 text-sm font-bold text-slate-800">緊急連絡先</div>
            <table className="w-full table-fixed border-collapse border border-slate-400 text-[9pt]">
              <tbody>
                <tr>
                  <th className="w-[10%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">氏名</th>
                  <td className="w-[23%] border border-slate-400 px-1 py-1">
                    <input {...register("emergencyContactName")} className={tableFieldClass} />
                  </td>
                  <th className="w-[10%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">続柄</th>
                  <td className="w-[23%] border border-slate-400 px-1 py-1">
                    <input {...register("emergencyContactRelation")} className={tableFieldClass} />
                  </td>
                  <th className="w-[10%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">電話番号</th>
                  <td className="w-[24%] border border-slate-400 px-1 py-1">
                    <input {...register("emergencyContactPhone")} className={tableFieldClass} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Documents */}
          <div className="mb-2">
            <div className="mb-1 text-sm font-bold text-slate-800">書類関係</div>
            <table className="w-full table-fixed border-collapse border border-slate-400 text-[9pt]">
              <colgroup>
                <col style={{ width: "12%" }} /><col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} /><col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} /><col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} /><col style={{ width: "12%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">在留種類</th>
                  <td colSpan={2} className="border border-slate-400 px-1 py-1">
                    <select {...register("visaStatus")} className={tableFieldClass}>
                      <option value="">選択</option>
                      {VISA_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">在留期間</th>
                  <td colSpan={2} className="border border-slate-400 px-1 py-1">
                    <input type="date" {...register("visaExpiry")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">カード番号</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input {...register("residenceCardNumber")} className={tableFieldClass} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">パスポート</th>
                  <td colSpan={2} className="border border-slate-400 px-1 py-1">
                    <input {...register("passportNumber")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">期限</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input type="date" {...register("passportExpiry")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">自動車</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("carOwner")} className={tableFieldClass}>
                      <option value="">-</option>
                      <option value="有">有</option>
                      <option value="無">無</option>
                    </select>
                  </td>
                  <td className="border-none" />
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">免許種類</th>
                  <td colSpan={2} className="border border-slate-400 px-1 py-1">
                    <select {...register("driverLicenseType")} className={tableFieldClass}>
                      <option value="">選択</option>
                      {LEVELS.licenseTypes.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">期限</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input type="date" {...register("licenseExpiry")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">保険</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("insurance")} className={tableFieldClass}>
                      <option value="">-</option>
                      <option value="有">有</option>
                      <option value="無">無</option>
                    </select>
                  </td>
                  <td className="border-none" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Language */}
          <div className="mb-2 mt-3 grid grid-cols-2 gap-2">
            <div className="relative rounded-sm border border-slate-400 bg-white p-2">
              <span className="absolute -top-2 left-2 bg-white px-1 text-[7pt] font-bold text-slate-600">
                日本語能力（聞く/話す）
              </span>
              <div className="mt-1 flex flex-col gap-1">
                {(["listenLevel", "speakLevel"] as const).map((field, idx) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="w-8 text-[7pt] font-bold">{idx === 0 ? "聞く" : "話す"}:</span>
                    <div className="flex gap-2">
                      {LEVELS.listen.map(lv => (
                        <label key={lv} className="flex cursor-pointer items-center gap-0.5 text-[7pt]">
                          <input type="radio" value={lv} {...register(field)} className="h-3 w-3 text-sky-600" />
                          {lv}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-sm border border-slate-400 bg-white p-2">
              <span className="absolute -top-2 left-2 bg-white px-1 text-[7pt] font-bold text-slate-600">読み書き</span>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {(
                  [
                    ["カナ", "katakanaReadLevel", "katakanaWriteLevel"],
                    ["ひら", "hiraganaReadLevel", "hiraganaWriteLevel"],
                    ["漢字", "kanjiReadLevel", "kanjiWriteLevel"],
                  ] as const
                ).map(([label, readF, writeF]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-1">
                      <span className="min-w-[2.5rem] whitespace-nowrap text-[7pt]">{label}読:</span>
                      <select {...register(readF)} className="w-full border-b border-slate-300 bg-transparent text-[7pt] outline-none">
                        <option value="">-</option>
                        {LEVELS.readOptions.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-1 items-center gap-1">
                      <span className="whitespace-nowrap text-[7pt]">書:</span>
                      <select {...register(writeF)} className="w-full border-b border-slate-300 bg-transparent text-[7pt] outline-none">
                        <option value="">-</option>
                        {LEVELS.writeOptions.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Education */}
          <div className="mb-2">
            <table className="w-full table-fixed border-collapse border border-slate-400 text-[9pt]">
              <colgroup>
                <col style={{ width: "12%" }} /><col style={{ width: "38%" }} />
                <col style={{ width: "12%" }} /><col style={{ width: "38%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">最終学歴</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input {...register("education")} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-left text-[8pt] font-bold">専攻</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input {...register("major")} className={tableFieldClass} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 6: Qualifications */}
          <div className="mb-2">
            <div className="mb-1 text-sm font-bold text-slate-800">有資格取得</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-slate-400 bg-slate-50/50 p-2 text-[8pt]">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" {...register("hasForkliftLicense")} className="h-3 w-3 accent-sky-600" />
                <span>フォークリフト資格</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" {...register("hasWeldingCert")} className="h-3 w-3 accent-sky-600" />
                <span>溶接資格</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" {...register("hasCraneLicense")} className="h-3 w-3 accent-sky-600" />
                <span>クレーン</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span>日本語検定:</span>
                <select {...register("jlptLevel")} className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[7pt] outline-none">
                  <option value="NONE">なし</option>
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                  <option value="N4">N4</option>
                  <option value="N5">N5</option>
                </select>
              </div>
              <div className="flex flex-grow items-center gap-1.5">
                <span>その他:</span>
                <input {...register("otherLanguages")} placeholder="その他の資格を入力" className="flex-grow rounded border border-slate-300 bg-white px-2 py-0.5 text-[7pt] outline-none" />
              </div>
            </div>
          </div>

          {/* Section 7: Physical Info */}
          <div className="mb-2">
            <div className="mb-1 text-sm font-bold text-slate-800">身体情報・健康状態</div>
            <table className="w-full table-fixed border-collapse border border-slate-400 text-[9pt]">
              <tbody>
                <tr>
                  <th className="w-[14%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">身長(cm)</th>
                  <td className="w-[11%] border border-slate-400 px-1 py-1">
                    <input type="number" step="0.1" {...register("height", { valueAsNumber: true })} className={tableFieldClass} />
                  </td>
                  <th className="w-[14%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">体重(kg)</th>
                  <td className="w-[11%] border border-slate-400 px-1 py-1">
                    <input type="number" step="0.1" {...register("weight", { valueAsNumber: true })} className={tableFieldClass} />
                  </td>
                  <th className="w-[14%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">服のサイズ</th>
                  <td className="w-[11%] border border-slate-400 px-1 py-1">
                    <select {...register("uniformSize")} className={tableFieldClass}>
                      <option value="">-</option>
                      {LEVELS.uniformSizes.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <th className="w-[14%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">ウエスト(cm)</th>
                  <td className="w-[11%] border border-slate-400 px-1 py-1">
                    <input {...register("waist")} className={tableFieldClass} />
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">靴サイズ(cm)</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <input type="number" step="0.5" {...register("shoeSize", { valueAsNumber: true })} className={tableFieldClass} />
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">安全靴</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("safetyShoes")} className={tableFieldClass}>
                      <option value="">選択</option>
                      <option value="有">有</option>
                      <option value="無">無</option>
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">アレルギー</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("allergies")} className={tableFieldClass}>
                      <option value="">選択</option>
                      <option value="有">有</option>
                      <option value="無">無</option>
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">血液型</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("bloodType")} className={tableFieldClass}>
                      <option value="">-</option>
                      {LEVELS.bloodTypes.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">メガネ使用</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("glasses")} className={tableFieldClass}>
                      <option value="">選択</option>
                      <option value="有">有</option>
                      <option value="無">無</option>
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">視力(左/右)</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <div className="flex gap-1">
                      <input type="number" step="0.1" {...register("visionLeft", { valueAsNumber: true })} placeholder="左" className={tableFieldClass} />
                      <span className="text-slate-400">/</span>
                      <input type="number" step="0.1" {...register("visionRight", { valueAsNumber: true })} placeholder="右" className={tableFieldClass} />
                    </div>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">利き腕</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("dominantHand")} className={tableFieldClass}>
                      <option value="">選択</option>
                      <option value="右">右</option>
                      <option value="左">左</option>
                      <option value="両方">両方</option>
                    </select>
                  </td>
                  <th className="border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">コロナワクチン</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("covidVaccineStatus")} className={tableFieldClass}>
                      <option value="">選択</option>
                      <option value="未接種">未接種</option>
                      <option value="1回以上">1回以上</option>
                      <option value="3回接種済み">3回接種済み</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 8: Work History */}
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">職務経歴</span>
              <button
                type="button"
                onClick={() =>
                  addJob({
                    startYear: new Date().getFullYear(),
                    startMonth: 1,
                    companyName: "",
                    hakenmoto: "",
                    hakensaki: "",
                    workLocation: "",
                    position: "",
                    jobContent: "",
                    eventType: "入社",
                  })
                }
                className="rounded border border-slate-400 px-2 py-0.5 text-[8pt] font-bold text-slate-700 hover:bg-slate-50 print:hidden"
              >
                職歴追加
              </button>
            </div>
            <table className="w-full table-fixed border-collapse text-[8pt]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-[12%] border border-slate-400 px-1 py-1 font-bold">開始</th>
                  <th className="w-[12%] border border-slate-400 px-1 py-1 font-bold">終了</th>
                  <th className="w-[18%] border border-slate-400 px-1 py-1 font-bold">派遣元</th>
                  <th className="w-[18%] border border-slate-400 px-1 py-1 font-bold">派遣先</th>
                  <th className="w-[15%] border border-slate-400 px-1 py-1 font-bold">勤務地</th>
                  <th className="border border-slate-400 px-1 py-1 font-bold">内容</th>
                </tr>
              </thead>
              <tbody>
                {jobFields.map((field, i) => (
                  <tr key={field.id}>
                    <td className="border border-slate-400 px-1 py-1">
                      <input
                        type="month"
                        className={tableFieldClass}
                        onChange={(e) => {
                          const [y, m] = e.target.value.split("-")
                          form.setValue(`workHistory.${i}.startYear`, parseInt(y) || 0)
                          form.setValue(`workHistory.${i}.startMonth`, parseInt(m) || 1)
                        }}
                      />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <input
                        type="month"
                        className={tableFieldClass}
                        onChange={(e) => {
                          const [y, m] = e.target.value.split("-")
                          form.setValue(`workHistory.${i}.endYear`, parseInt(y) || undefined)
                          form.setValue(`workHistory.${i}.endMonth`, parseInt(m) || undefined)
                        }}
                      />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <input {...register(`workHistory.${i}.hakenmoto`)} className={tableFieldClass} />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <input {...register(`workHistory.${i}.hakensaki`)} className={tableFieldClass} />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <input {...register(`workHistory.${i}.workLocation`)} className={tableFieldClass} />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <div className="flex items-center gap-1">
                        <input {...register(`workHistory.${i}.jobContent`)} className={tableFieldClass} />
                        <button
                          type="button"
                          onClick={() => removeJob(i)}
                          className="print:hidden text-red-500 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 9: Family */}
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">家族構成</span>
              <button
                type="button"
                onClick={() =>
                  addFamily({
                    name: "",
                    relationship: "",
                    age: undefined,
                    liveTogether: false,
                    residence: "",
                    dependent: "",
                  })
                }
                className="rounded border border-slate-400 px-2 py-0.5 text-[8pt] font-bold text-slate-700 hover:bg-slate-50 print:hidden"
              >
                家族追加
              </button>
            </div>
            <table className="w-full table-fixed border-collapse text-[8pt]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-[25%] border border-slate-400 px-1 py-1 font-bold">氏名</th>
                  <th className="w-[18%] border border-slate-400 px-1 py-1 font-bold">続柄</th>
                  <th className="w-[12%] border border-slate-400 px-1 py-1 font-bold">年齢</th>
                  <th className="w-[18%] border border-slate-400 px-1 py-1 font-bold">居住</th>
                  <th className="w-[15%] border border-slate-400 px-1 py-1 font-bold">扶養</th>
                </tr>
              </thead>
              <tbody>
                {familyFields.map((field, i) => (
                  <tr key={field.id}>
                    <td className="border border-slate-400 px-1 py-1">
                      <input {...register(`familyMembers.${i}.name`)} className={tableFieldClass} />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <input {...register(`familyMembers.${i}.relationship`)} className={tableFieldClass} />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <input
                        type="number"
                        {...register(`familyMembers.${i}.age`, { valueAsNumber: true })}
                        className={tableFieldClass}
                      />
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <select {...register(`familyMembers.${i}.residence`)} className={tableFieldClass}>
                        <option value="">選択</option>
                        {LEVELS.residenceOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-slate-400 px-1 py-1">
                      <div className="flex items-center gap-2">
                        <select {...register(`familyMembers.${i}.dependent`)} className={tableFieldClass}>
                          <option value="">-</option>
                          <option value="有">有</option>
                          <option value="無">無</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeFamily(i)}
                          className="print:hidden text-red-500 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 10: Commute + Company Footer */}
          <div className="company-footer mt-auto flex flex-col gap-2 border-t border-slate-200 pt-2">
            <table className="w-full table-fixed border-collapse text-[8pt]">
              <tbody>
                <tr>
                  <th className="w-[12%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">通勤方法</th>
                  <td className="w-[13%] border border-slate-400 px-1 py-1">
                    <select {...register("commuteMethod")} className={tableFieldClass}>
                      <option value="">選択</option>
                      {LEVELS.commuteOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <th className="w-[15%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">通勤片道（分）</th>
                  <td className="w-[13%] border border-slate-400 px-1 py-1">
                    <input {...register("commuteTimeMin")} className={tableFieldClass} />
                  </td>
                  <th className="w-[15%] border border-slate-400 bg-slate-50 px-1 py-1 text-[8pt] font-bold">弁当（社内食堂）</th>
                  <td className="border border-slate-400 px-1 py-1">
                    <select {...register("lunchPref")} className={tableFieldClass}>
                      <option value="昼/夜">昼/夜</option>
                      <option value="昼のみ">昼のみ</option>
                      <option value="夜のみ">夜のみ</option>
                      <option value="持参">持参</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="relative flex items-center justify-center pb-2 pt-3">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/UNSLogo.png" alt="UNS Logo" className="h-12 w-auto print:h-8" />
                <div className="flex flex-col text-left">
                  <div className="whitespace-nowrap text-sm font-black tracking-wider text-slate-800">
                    ユニバーサル企画株式会社
                  </div>
                  <div className="whitespace-nowrap text-[7pt] font-medium leading-tight text-slate-500">
                    〒461-0025 愛知県名古屋市東区徳川2丁目18番18号
                  </div>
                  <div className="whitespace-nowrap text-[7pt] font-medium leading-tight text-slate-500">
                    TEL 052-938-8840　FAX 052-938-8841
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Print CSS */}
      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { height: 100% !important; overflow: visible !important; background: white !important; margin: 0 !important; padding: 0 !important; }
          .print\\:hidden { display: none !important; }
          .resume-paper { box-shadow: none !important; padding: 5mm !important; margin: 0 !important; border: none !important; width: 200mm !important; min-height: 287mm !important; display: flex !important; flex-direction: column !important; }
          .company-footer { margin-top: auto !important; }
          table { page-break-inside: avoid !important; width: 100% !important; }
          th { background-color: #f1f5f9 !important; color: black !important; font-weight: 700 !important; }
          input, select { border: none !important; background: none !important; color: black !important; -webkit-appearance: none; }
        }
      `}</style>
    </div>
  )
}
