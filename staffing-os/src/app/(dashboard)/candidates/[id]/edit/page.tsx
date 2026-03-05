import { notFound } from "next/navigation"
import { getCandidate } from "@/actions/candidates"
import { RirekishoForm } from "@/components/candidates/rirekisho-form"

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

  // Transform DB data to form-compatible defaultValues
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
    address3: candidate.address3 || "",
    addressFurigana: candidate.addressFurigana || "",
    phone: candidate.phone || "",
    email: candidate.email || "",
    passportNumber: candidate.passportNumber || "",
    passportExpiry: candidate.passportExpiry?.toISOString().split("T")[0] || "",
    residenceCardNumber: candidate.residenceCardNumber || "",
    residenceCardExpiry: candidate.residenceCardExpiry?.toISOString().split("T")[0] || "",
    visaStatus: candidate.visaStatus || ("" as const),
    visaStatusOther: candidate.visaStatusOther || "",
    visaExpiry: candidate.visaExpiry?.toISOString().split("T")[0] || "",
    // Work history
    workHistory: candidate.workHistory.map((wh) => ({
      startYear: wh.startYear,
      startMonth: wh.startMonth,
      endYear: wh.endYear ?? undefined,
      endMonth: wh.endMonth ?? undefined,
      companyName: wh.companyName,
      position: wh.position || "",
      jobContent: wh.jobContent || "",
      eventType: wh.eventType,
      hakenmoto: wh.hakenmoto || "",
      hakensaki: wh.hakensaki || "",
      workLocation: wh.workLocation || "",
    })),
    // Personal — new
    spouse: candidate.spouse || "",
    // Experience
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
    expLineLeader: candidate.expLineLeader,
    expOther: candidate.expOther || "",
    // Qualifications
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
    hasTamakake: candidate.hasTamakake,
    // Family
    familyMembers: candidate.familyMembers.map((fm) => ({
      name: fm.name,
      relationship: fm.relationship,
      age: fm.age ?? undefined,
      liveTogether: fm.liveTogether,
      residence: fm.residence || "",
      dependent: fm.dependent || "",
    })),
    // Language
    jlptLevel: candidate.jlptLevel,
    japaneseConversation: candidate.japaneseConversation || "",
    otherLanguages: candidate.otherLanguages || "",
    speakLevel: candidate.speakLevel || "",
    listenLevel: candidate.listenLevel || "",
    kanjiReadLevel: candidate.kanjiReadLevel || "",
    kanjiWriteLevel: candidate.kanjiWriteLevel || "",
    hiraganaReadLevel: candidate.hiraganaReadLevel || "",
    hiraganaWriteLevel: candidate.hiraganaWriteLevel || "",
    katakanaReadLevel: candidate.katakanaReadLevel || "",
    katakanaWriteLevel: candidate.katakanaWriteLevel || "",
    // Physical
    bloodType: candidate.bloodType || "",
    height: candidate.height ?? undefined,
    weight: candidate.weight ?? undefined,
    shoeSize: candidate.shoeSize ?? undefined,
    dominantHand: candidate.dominantHand || "",
    visionLeft: candidate.visionLeft ?? undefined,
    visionRight: candidate.visionRight ?? undefined,
    // Preferences
    bentoPreference: candidate.bentoPreference || "",
    allergies: candidate.allergies || "",
    covidVaccineStatus: candidate.covidVaccineStatus || "",
    // Emergency
    emergencyContactName: candidate.emergencyContactName || "",
    emergencyContactPhone: candidate.emergencyContactPhone || "",
    emergencyContactRelation: candidate.emergencyContactRelation || "",
    // Rirekisho-specific fields
    receptionDate: candidate.receptionDate?.toISOString().split("T")[0] || "",
    timeInJapan: candidate.timeInJapan || "",
    mobile: candidate.mobile || "",
    uniformSize: candidate.uniformSize || "",
    waist: candidate.waist || "",
    safetyShoes: candidate.safetyShoes || "",
    glasses: candidate.glasses || "",
    carOwner: candidate.carOwner || "",
    insurance: candidate.insurance || "",
    licenseExpiry: candidate.licenseExpiry?.toISOString().split("T")[0] || "",
    education: candidate.education || "",
    major: candidate.major || "",
    commuteMethod: candidate.commuteMethod || "",
    commuteTimeMin: candidate.commuteTimeMin || "",
    lunchPref: candidate.lunchPref || "昼/夜",
    registeredAddress: candidate.registeredAddress || "",
  }

  return (
    <RirekishoForm
      mode="edit"
      candidateId={id}
      defaultValues={defaultValues}
      defaultPhotoUrl={candidate.photoDataUrl || ""}
    />
  )
}
