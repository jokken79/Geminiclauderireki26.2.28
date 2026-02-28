import { PrismaClient, UserRole } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@staffing-os.jp" },
    update: {},
    create: {
      email: "admin@staffing-os.jp",
      name: "管理者",
      hashedPassword: adminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // Create tantosha user
  const tantoshaPassword = await hash("tantosha123", 12)
  const tantosha = await prisma.user.upsert({
    where: { email: "tantosha@staffing-os.jp" },
    update: {},
    create: {
      email: "tantosha@staffing-os.jp",
      name: "担当者太郎",
      hashedPassword: tantoshaPassword,
      role: UserRole.TANTOSHA,
    },
  })
  console.log(`Created tantosha user: ${tantosha.email}`)

  // Create sample client companies
  const company1 = await prisma.clientCompany.upsert({
    where: { id: "company-1" },
    update: {},
    create: {
      id: "company-1",
      name: "株式会社トヨタ自動車",
      nameKana: "カブシキガイシャトヨタジドウシャ",
      industry: "自動車製造",
      prefecture: "愛知県",
      city: "豊田市",
      address: "トヨタ町1番地",
      phone: "0565-28-2121",
      contactName: "工場長 山田太郎",
    },
  })

  const company2 = await prisma.clientCompany.upsert({
    where: { id: "company-2" },
    update: {},
    create: {
      id: "company-2",
      name: "株式会社デンソー",
      nameKana: "カブシキガイシャデンソー",
      industry: "電子部品製造",
      prefecture: "愛知県",
      city: "刈谷市",
      address: "昭和町1丁目1番地",
      phone: "0566-25-5511",
      contactName: "製造部長 佐藤花子",
    },
  })

  console.log(`Created companies: ${company1.name}, ${company2.name}`)

  console.log("Seeding completed!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
