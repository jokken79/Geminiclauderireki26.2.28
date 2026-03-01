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

  const progressPercentage = Math.round(((currentStep + 1) / STEP_TITLES.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">進捗</span>
        <span className="text-sm font-bold text-primary">{progressPercentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 mb-6">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Vertical Stepper for Desktop, Horizontal for Mobile */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible pb-4 md:pb-0 gap-2 md:gap-4 md:w-64 shrink-0">
          {STEP_TITLES.map((title, i) => {
            const isCompleted = i < currentStep
            const isActive = i === currentStep

            return (
              <button
                key={title}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all text-left whitespace-nowrap min-w-[200px] md:min-w-0 md:w-full border",
                  isActive
                    ? "bg-primary/10 text-primary border-primary ring-1 ring-primary/30"
                    : isCompleted
                      ? "bg-muted relative text-foreground border-border hover:bg-muted/80"
                      : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isActive ? "bg-primary text-primary-foreground animate-pulse" :
                    isCompleted ? "bg-[var(--color-success)] text-white" :
                      "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span>{title}</span>
              </button>
            )
          })}
        </nav>

        {/* Form Area */}
        <div className="flex-1">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-sm border-muted">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-muted-foreground">Step {currentStep + 1}:</span>
                    {STEP_TITLES[currentStep]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StepComponent />
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 sticky bottom-4 p-4 bg-background/95 backdrop-blur rounded-xl border shadow-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="w-full sm:w-auto"
                >
                  前のステップへ
                </Button>

                <div className="text-sm font-medium text-muted-foreground hidden sm:block">
                  {currentStep + 1} / {STEP_TITLES.length}
                </div>

                {currentStep < STEP_COMPONENTS.length - 1 ? (
                  <Button type="button" onClick={goNext} className="w-full sm:w-auto bg-primary">
                    次のステップへ
                  </Button>
                ) : (
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white">
                    {isPending
                      ? "保存中..."
                      : mode === "create"
                        ? "登録を完了する"
                        : "更新を完了する"}
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
