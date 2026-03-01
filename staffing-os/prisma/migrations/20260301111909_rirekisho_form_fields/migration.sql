-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "address3" VARCHAR(100),
ADD COLUMN     "carOwner" VARCHAR(3),
ADD COLUMN     "commuteMethod" VARCHAR(20),
ADD COLUMN     "commuteTimeMin" VARCHAR(10),
ADD COLUMN     "education" VARCHAR(100),
ADD COLUMN     "glasses" VARCHAR(3),
ADD COLUMN     "hiraganaReadLevel" VARCHAR(15),
ADD COLUMN     "hiraganaWriteLevel" VARCHAR(15),
ADD COLUMN     "insurance" VARCHAR(3),
ADD COLUMN     "kanjiReadLevel" VARCHAR(15),
ADD COLUMN     "kanjiWriteLevel" VARCHAR(15),
ADD COLUMN     "katakanaReadLevel" VARCHAR(15),
ADD COLUMN     "katakanaWriteLevel" VARCHAR(15),
ADD COLUMN     "licenseExpiry" DATE,
ADD COLUMN     "listenLevel" VARCHAR(30),
ADD COLUMN     "lunchPref" VARCHAR(10),
ADD COLUMN     "major" VARCHAR(100),
ADD COLUMN     "mobile" VARCHAR(20),
ADD COLUMN     "receptionDate" DATE,
ADD COLUMN     "safetyShoes" VARCHAR(3),
ADD COLUMN     "speakLevel" VARCHAR(30),
ADD COLUMN     "timeInJapan" VARCHAR(10),
ADD COLUMN     "uniformSize" VARCHAR(5),
ADD COLUMN     "waist" VARCHAR(10);

-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN     "dependent" VARCHAR(3),
ADD COLUMN     "residence" VARCHAR(10);

-- AlterTable
ALTER TABLE "WorkHistory" ADD COLUMN     "hakenmoto" VARCHAR(100),
ADD COLUMN     "hakensaki" VARCHAR(100),
ADD COLUMN     "workLocation" VARCHAR(100);
