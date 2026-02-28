"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { STEP_TITLES, type CandidateFormData } from "@/lib/validators/candidate"
import { createCandidate, updateCandidate } from "@/actions/candidates"
import { Step1BasicInfo } from "./steps/step1-basic-info"
import { Step2Contact } from "./steps/step2-contact"
import { Step3Immigration } from "./steps/step3-immigration"
import { Step4Photo } from "./steps/step4-photo"
import { Step5WorkHistory } from "./steps/step5-work-history"
import { Step6Qualifications } from "./steps/step6-qualifications"
import { Step7Family } from "./steps/step7-family"
import { Step8Other } from "./steps/step8-other"
import { Step9Confirm } from "./steps/step9-confirm"

interface CandidateFormProps {
  candidateId?: string
  defaultValues?: Partial<CandidateFormData>
  mode: "create" | "edit"
}

const STEP_COMPONENTS = [
  Step1BasicInfo,
  Step2Contact,
  Step3Immigration,
  Step4Photo,
  Step5WorkHistory,
  Step6Qualifications,
  Step7Family,
  Step8Other,
  Step9Confirm,
]

export function CandidateForm({ candidateId, defaultValues, mode }: CandidateFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const methods = useForm<CandidateFormData>({
    defaultValues: {
      lastNameKanji: "",
      firstNameKanji: "",
      lastNameFurigana: "",
      firstNameFurigana: "",
      lastNameRomaji: "",
      firstNameRomaji: "",
      birthDate: "",
      gender: "",
      nationality: "",
      postalCode: "",
      prefecture: "",
      city: "",
      addressLine1: "",
      addressLine2: "",
      addressFurigana: "",
      phone: "",
      email: "",
      passportNumber: "",
      passportExpiry: "",
      residenceCardNumber: "",
      residenceCardExpiry: "",
      visaStatus: "",
      visaExpiry: "",
      photoDataUrl: "",
      workHistory: [],
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
      expOther: "",
      qualifications: [],
      hasDriverLicense: false,
      driverLicenseType: "",
      hasForkliftLicense: false,
      hasCraneLicense: false,
      hasWeldingCert: false,
      familyMembers: [],
      jlptLevel: "NONE",
      japaneseConversation: "",
      otherLanguages: "",
      bloodType: "",
      height: undefined,
      weight: undefined,
      shoeSize: undefined,
      dominantHand: "",
      visionLeft: undefined,
      visionRight: undefined,
      bentoPreference: "",
      allergies: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      covidVaccineStatus: "",
      ...defaultValues,
    },
  })

  const StepComponent = STEP_COMPONENTS[currentStep]

  const goNext = () => {
    if (currentStep < STEP_COMPONENTS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const onSubmit = (data: CandidateFormData) => {
    startTransition(async () => {
      const result = mode === "create"
        ? await createCandidate(data)
        : await updateCandidate(candidateId!, data)

      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(mode === "create" ? "候補者を登録しました" : "候補者を更新しました")
        router.push("/candidates")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <nav className="flex items-center justify-center gap-1 overflow-x-auto pb-2">
        {STEP_TITLES.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => setCurrentStep(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              i === currentStep
                ? "bg-primary text-primary-foreground"
                : i < currentStep
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {i < currentStep && <Check className="h-3 w-3" />}
            <span>{i + 1}. {title}</span>
          </button>
        ))}
      </nav>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>
                {STEP_TITLES[currentStep]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StepComponent />
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 0}
            >
              戻る
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {STEP_TITLES.length}
            </span>

            {currentStep < STEP_COMPONENTS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                次へ
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "保存中..."
                  : mode === "create"
                    ? "登録する"
                    : "更新する"}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
