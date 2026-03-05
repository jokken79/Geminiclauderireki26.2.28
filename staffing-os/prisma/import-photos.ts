/**
 * Import Photos - Second pass
 * Updates candidates with their base64 photo data URLs.
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const JSON_PATH = path.join(__dirname, 'legacy-import', 'candidates.json')

interface LegacyCandidate {
  lastNameKanji: string
  firstNameKanji?: string | null
  lastNameRomaji?: string | null
  firstNameRomaji?: string | null
  birthDate?: string | null
  photoDataUrl?: string | null
  _legacyId: number
}

async function main() {
  console.log('Loading candidates JSON...')
  const raw = fs.readFileSync(JSON_PATH, 'utf-8')
  const candidates: LegacyCandidate[] = JSON.parse(raw)

  // Get all DB candidates with their names for matching
  const dbCandidates = await prisma.candidate.findMany({
    select: { id: true, lastNameKanji: true, firstNameKanji: true, lastNameRomaji: true, firstNameRomaji: true, birthDate: true, photoDataUrl: true },
  })
  console.log(`DB candidates: ${dbCandidates.length}`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const c of candidates) {
    if (!c.photoDataUrl) {
      skipped++
      continue
    }

    // Match by name + birthDate
    const match = dbCandidates.find(db => {
      const nameMatch = (
        (db.lastNameKanji === c.lastNameKanji && db.firstNameKanji === (c.firstNameKanji || '')) ||
        (db.lastNameRomaji === c.lastNameRomaji && db.firstNameRomaji === c.firstNameRomaji && c.lastNameRomaji)
      )
      const dateMatch = c.birthDate && db.birthDate &&
        new Date(c.birthDate).toISOString().slice(0, 10) === db.birthDate.toISOString().slice(0, 10)
      return nameMatch && dateMatch
    })

    if (!match) {
      notFound++
      continue
    }

    if (match.photoDataUrl) {
      skipped++
      continue
    }

    try {
      await prisma.candidate.update({
        where: { id: match.id },
        data: { photoDataUrl: c.photoDataUrl },
      })
      updated++
    } catch {
      // skip
    }

    if ((updated + skipped + notFound) % 200 === 0) {
      console.log(`  Progress: updated=${updated}, skipped=${skipped}, notFound=${notFound}`)
    }
  }

  console.log(`\nPhoto import complete!`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped (no photo/already has): ${skipped}`)
  console.log(`  Not found in DB: ${notFound}`)

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Error:', err)
  prisma.$disconnect()
  process.exit(1)
})
