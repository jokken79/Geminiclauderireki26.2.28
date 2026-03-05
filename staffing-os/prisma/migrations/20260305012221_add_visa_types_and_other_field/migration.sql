-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VisaStatus" ADD VALUE 'ENGINEER_HUMANITIES';
ALTER TYPE "VisaStatus" ADD VALUE 'CULTURAL_ACTIVITIES';
ALTER TYPE "VisaStatus" ADD VALUE 'HIGHLY_SKILLED_1';
ALTER TYPE "VisaStatus" ADD VALUE 'HIGHLY_SKILLED_2';
ALTER TYPE "VisaStatus" ADD VALUE 'INTRA_COMPANY_TRANSFER';
ALTER TYPE "VisaStatus" ADD VALUE 'NURSING_CARE';

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "visaStatusOther" VARCHAR(100);
