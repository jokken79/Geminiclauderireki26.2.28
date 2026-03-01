-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'KEITOSAN', 'TANTOSHA', 'COORDINATOR', 'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('PERMANENT_RESIDENT', 'SPOUSE_OF_JAPANESE', 'LONG_TERM_RESIDENT', 'DESIGNATED_ACTIVITIES', 'TECHNICAL_INTERN_1', 'TECHNICAL_INTERN_2', 'TECHNICAL_INTERN_3', 'SPECIFIED_SKILLED_1', 'SPECIFIED_SKILLED_2', 'STUDENT', 'DEPENDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "JlptLevel" AS ENUM ('N1', 'N2', 'N3', 'N4', 'N5', 'NONE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESIDENCE_CARD', 'PASSPORT', 'DRIVER_LICENSE', 'FORKLIFT_LICENSE', 'CRANE_LICENSE', 'WELDING_CERT', 'HEALTH_CHECK', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('VISA_EXPIRY', 'CONTRACT_EXPIRY', 'TEISHOKUBI', 'DOCUMENT_EXPIRY', 'UNASSIGNED_CANDIDATE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TANTOSHA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastNameKanji" VARCHAR(50) NOT NULL,
    "firstNameKanji" VARCHAR(50) NOT NULL,
    "lastNameFurigana" VARCHAR(50) NOT NULL,
    "firstNameFurigana" VARCHAR(50) NOT NULL,
    "lastNameRomaji" VARCHAR(50),
    "firstNameRomaji" VARCHAR(50),
    "birthDate" DATE NOT NULL,
    "gender" "Gender",
    "nationality" VARCHAR(50) NOT NULL,
    "bloodType" VARCHAR(5),
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "shoeSize" DOUBLE PRECISION,
    "dominantHand" VARCHAR(10),
    "visionLeft" DOUBLE PRECISION,
    "visionRight" DOUBLE PRECISION,
    "postalCode" VARCHAR(8),
    "prefecture" VARCHAR(10),
    "city" VARCHAR(50),
    "addressLine1" VARCHAR(100),
    "addressLine2" VARCHAR(100),
    "addressFurigana" VARCHAR(200),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "passportNumber" VARCHAR(20),
    "passportExpiry" DATE,
    "residenceCardNumber" VARCHAR(20),
    "residenceCardExpiry" DATE,
    "visaStatus" "VisaStatus",
    "visaExpiry" DATE,
    "photoDataUrl" TEXT,
    "expWelding" BOOLEAN NOT NULL DEFAULT false,
    "expForklift" BOOLEAN NOT NULL DEFAULT false,
    "expLineWork" BOOLEAN NOT NULL DEFAULT false,
    "expAssembly" BOOLEAN NOT NULL DEFAULT false,
    "expPacking" BOOLEAN NOT NULL DEFAULT false,
    "expInspection" BOOLEAN NOT NULL DEFAULT false,
    "expPainting" BOOLEAN NOT NULL DEFAULT false,
    "expMachining" BOOLEAN NOT NULL DEFAULT false,
    "expCleaning" BOOLEAN NOT NULL DEFAULT false,
    "expCooking" BOOLEAN NOT NULL DEFAULT false,
    "expOther" VARCHAR(200),
    "jlptLevel" "JlptLevel" NOT NULL DEFAULT 'NONE',
    "japaneseConversation" VARCHAR(50),
    "otherLanguages" VARCHAR(200),
    "hasDriverLicense" BOOLEAN NOT NULL DEFAULT false,
    "driverLicenseType" VARCHAR(50),
    "hasForkliftLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasCraneLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasWeldingCert" BOOLEAN NOT NULL DEFAULT false,
    "bentoPreference" VARCHAR(100),
    "allergies" VARCHAR(200),
    "interviewDate" DATE,
    "interviewResult" VARCHAR(50),
    "interviewNotes" TEXT,
    "covidVaccineStatus" VARCHAR(50),
    "emergencyContactName" VARCHAR(50),
    "emergencyContactPhone" VARCHAR(20),
    "emergencyContactRelation" VARCHAR(30),

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationHistory" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "schoolName" VARCHAR(100) NOT NULL,
    "faculty" VARCHAR(100),
    "eventType" VARCHAR(20) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EducationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHistory" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "endYear" INTEGER,
    "endMonth" INTEGER,
    "companyName" VARCHAR(100) NOT NULL,
    "position" VARCHAR(100),
    "jobContent" VARCHAR(200),
    "eventType" VARCHAR(20) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "details" VARCHAR(200),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "relationship" VARCHAR(30) NOT NULL,
    "age" INTEGER,
    "liveTogether" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCompany" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameKana" VARCHAR(100),
    "industry" VARCHAR(50),
    "postalCode" VARCHAR(8),
    "prefecture" VARCHAR(10),
    "city" VARCHAR(50),
    "address" VARCHAR(200),
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "contactName" VARCHAR(50),
    "contactEmail" VARCHAR(100),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HakenshainAssignment" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "hakemotoId" SERIAL NOT NULL,
    "hireDate" DATE NOT NULL,
    "contractEndDate" DATE,
    "jikyu" INTEGER NOT NULL,
    "position" VARCHAR(100),
    "productionLine" VARCHAR(100),
    "shift" VARCHAR(50),
    "teishokubiDate" DATE,
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "dispatchSupervisor" VARCHAR(50),
    "clientSupervisor" VARCHAR(50),
    "bankName" VARCHAR(50),
    "bankBranch" VARCHAR(50),
    "bankAccountType" VARCHAR(10),
    "bankAccountNumber" VARCHAR(100),
    "emergencyName" VARCHAR(50),
    "emergencyPhone" VARCHAR(20),
    "emergencyRelation" VARCHAR(30),
    "photoDataUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HakenshainAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UkeoiAssignment" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "hireDate" DATE NOT NULL,
    "contractEndDate" DATE,
    "monthlySalary" INTEGER NOT NULL,
    "position" VARCHAR(100),
    "projectName" VARCHAR(100),
    "internalSupervisor" VARCHAR(50) NOT NULL,
    "bankName" VARCHAR(50),
    "bankBranch" VARCHAR(50),
    "bankAccountType" VARCHAR(10),
    "bankAccountNumber" VARCHAR(100),
    "emergencyName" VARCHAR(50),
    "emergencyPhone" VARCHAR(20),
    "emergencyRelation" VARCHAR(30),
    "photoDataUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UkeoiAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" VARCHAR(200) NOT NULL,
    "fileData" TEXT NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "expiryDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillSheet" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "initials" VARCHAR(10) NOT NULL,
    "ageRange" VARCHAR(20) NOT NULL,
    "prefecture" VARCHAR(10),
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" VARCHAR(50),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "tableName" VARCHAR(50) NOT NULL,
    "recordId" VARCHAR(50) NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Candidate_lastNameKanji_firstNameKanji_idx" ON "Candidate"("lastNameKanji", "firstNameKanji");

-- CreateIndex
CREATE INDEX "Candidate_lastNameFurigana_firstNameFurigana_idx" ON "Candidate"("lastNameFurigana", "firstNameFurigana");

-- CreateIndex
CREATE INDEX "Candidate_lastNameRomaji_firstNameRomaji_idx" ON "Candidate"("lastNameRomaji", "firstNameRomaji");

-- CreateIndex
CREATE INDEX "Candidate_status_idx" ON "Candidate"("status");

-- CreateIndex
CREATE INDEX "Candidate_nationality_idx" ON "Candidate"("nationality");

-- CreateIndex
CREATE INDEX "Candidate_visaExpiry_idx" ON "Candidate"("visaExpiry");

-- CreateIndex
CREATE INDEX "EducationHistory_candidateId_idx" ON "EducationHistory"("candidateId");

-- CreateIndex
CREATE INDEX "WorkHistory_candidateId_idx" ON "WorkHistory"("candidateId");

-- CreateIndex
CREATE INDEX "Qualification_candidateId_idx" ON "Qualification"("candidateId");

-- CreateIndex
CREATE INDEX "FamilyMember_candidateId_idx" ON "FamilyMember"("candidateId");

-- CreateIndex
CREATE INDEX "ClientCompany_name_idx" ON "ClientCompany"("name");

-- CreateIndex
CREATE INDEX "ClientCompany_isActive_idx" ON "ClientCompany"("isActive");

-- CreateIndex
CREATE INDEX "HakenshainAssignment_candidateId_idx" ON "HakenshainAssignment"("candidateId");

-- CreateIndex
CREATE INDEX "HakenshainAssignment_companyId_idx" ON "HakenshainAssignment"("companyId");

-- CreateIndex
CREATE INDEX "HakenshainAssignment_status_idx" ON "HakenshainAssignment"("status");

-- CreateIndex
CREATE INDEX "HakenshainAssignment_teishokubiDate_idx" ON "HakenshainAssignment"("teishokubiDate");

-- CreateIndex
CREATE INDEX "HakenshainAssignment_hireDate_idx" ON "HakenshainAssignment"("hireDate");

-- CreateIndex
CREATE INDEX "UkeoiAssignment_candidateId_idx" ON "UkeoiAssignment"("candidateId");

-- CreateIndex
CREATE INDEX "UkeoiAssignment_companyId_idx" ON "UkeoiAssignment"("companyId");

-- CreateIndex
CREATE INDEX "UkeoiAssignment_status_idx" ON "UkeoiAssignment"("status");

-- CreateIndex
CREATE INDEX "Document_candidateId_idx" ON "Document"("candidateId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_expiryDate_idx" ON "Document"("expiryDate");

-- CreateIndex
CREATE INDEX "SkillSheet_candidateId_idx" ON "SkillSheet"("candidateId");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "Alert_isRead_idx" ON "Alert"("isRead");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_tableName_idx" ON "AuditLog"("tableName");

-- CreateIndex
CREATE INDEX "AuditLog_recordId_idx" ON "AuditLog"("recordId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_userId_idx" ON "AdminAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "EducationHistory" ADD CONSTRAINT "EducationHistory_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HakenshainAssignment" ADD CONSTRAINT "HakenshainAssignment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HakenshainAssignment" ADD CONSTRAINT "HakenshainAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ClientCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UkeoiAssignment" ADD CONSTRAINT "UkeoiAssignment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UkeoiAssignment" ADD CONSTRAINT "UkeoiAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ClientCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillSheet" ADD CONSTRAINT "SkillSheet_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
