import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`

        return NextResponse.json(
            {
                status: "healthy",
                database: "connected",
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Health check failed:", error)
        return NextResponse.json(
            {
                status: "unhealthy",
                database: "disconnected",
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Database connection failed",
            },
            { status: 503 }
        )
    }
}
