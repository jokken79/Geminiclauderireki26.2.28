import { notFound } from "next/navigation"
import { getCandidate } from "@/actions/candidates"
import { CandidateForm } from "@/components/candidates/candidate-form"

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const candidate = await getCandidate(id)

  if (!candidate) {
    notFound()
  }

  // Transform DB dates to string format for the form
  const defaultValues = {
    lastNameKanji: candidate.lastNameKanji,
    firstNameKanji: candidate.firstNameKanji,
    lastNameFurigana: candidate.lastNameFurigana,
    firstNameFurigana: candidate.firstNameFurigana,
    lastNameRomaji: candidate.lastNameRomaji || "",
    firstNameRomaji: candidate.firstNameRomaji || "",
    birthDate: candidate.birthDate.toISOString().split("T")[0],
    gender: candidate.gender || ("" as const),
    nationality: candidate.nationality,
    postalCode: candidate.postalCode || "",
    prefecture: candidate.prefecture || "",
    city: candidate.city || "",
    addressLine1: candidate.addressLine1 || "",
    addressLine2: candidate.addressLine2 || "",
    addressFurigana: candidate.addressFurigana || "",
    phone: candidate.phone || "",
    email: candidate.email || "",
    passportNumber: candidate.passportNumber || "",
    passportExpiry: candidate.passportExpiry?.toISOString().split("T")[0] || "",
    residenceCardNumber: candidate.residenceCardNumber || "",
    residenceCardExpiry: candidate.residenceCardExpiry?.toISOString().split("T")[0] || "",
    visaStatus: candidate.visaStatus || ("" as const),
    visaExpiry: candidate.visaExpiry?.toISOString().split("T")[0] || "",
    photoDataUrl: candidate.photoDataUrl || "",
    workHistory: candidate.workHistory.map((wh) => ({
      startYear: wh.startYear,
      startMonth: wh.startMonth,
      endYear: wh.endYear ?? undefined,
      endMonth: wh.endMonth ?? undefined,
      companyName: wh.companyName,
      position: wh.position || "",
      jobContent: wh.jobContent || "",
      eventType: wh.eventType,
    })),
    expWelding: candidate.expWelding,
    expForklift: candidate.expForklift,
    expLineWork: candidate.expLineWork,
    expAssembly: candidate.expAssembly,
    expPacking: candidate.expPacking,
    expInspection: candidate.expInspection,
    expPainting: candidate.expPainting,
    expMachining: candidate.expMachining,
    expCleaning: candidate.expCleaning,
    expCooking: candidate.expCooking,
    expOther: candidate.expOther || "",
    qualifications: candidate.qualifications.map((q) => ({
      year: q.year,
      month: q.month,
      name: q.name,
      details: q.details || "",
    })),
    hasDriverLicense: candidate.hasDriverLicense,
    driverLicenseType: candidate.driverLicenseType || "",
    hasForkliftLicense: candidate.hasForkliftLicense,
    hasCraneLicense: candidate.hasCraneLicense,
    hasWeldingCert: candidate.hasWeldingCert,
    familyMembers: candidate.familyMembers.map((fm) => ({
      name: fm.name,
      relationship: fm.relationship,
      age: fm.age ?? undefined,
      liveTogether: fm.liveTogether,
    })),
    jlptLevel: candidate.jlptLevel,
    japaneseConversation: candidate.japaneseConversation || "",
    otherLanguages: candidate.otherLanguages || "",
    bloodType: candidate.bloodType || "",
    height: candidate.height ?? undefined,
    weight: candidate.weight ?? undefined,
    shoeSize: candidate.shoeSize ?? undefined,
    dominantHand: candidate.dominantHand || "",
    visionLeft: candidate.visionLeft ?? undefined,
    visionRight: candidate.visionRight ?? undefined,
    bentoPreference: candidate.bentoPreference || "",
    allergies: candidate.allergies || "",
    emergencyContactName: candidate.emergencyContactName || "",
    emergencyContactPhone: candidate.emergencyContactPhone || "",
    emergencyContactRelation: candidate.emergencyContactRelation || "",
    covidVaccineStatus: candidate.covidVaccineStatus || "",
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          候補者 編集: {candidate.lastNameKanji} {candidate.firstNameKanji}
        </h1>
        <p className="text-sm text-muted-foreground">
          候補者情報を更新してください。
        </p>
      </div>
      <CandidateForm
        mode="edit"
        candidateId={id}
        defaultValues={defaultValues}
      />
    </div>
  )
}
