import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

/**
 * Saves a base64 string to the local public/uploads directory.
 * @param base64String The base64 data url (e.g., "data:image/jpeg;base64,/9j/4AAQSk...")
 * @param category A subfolder category (e.g., "candidates", "documents")
 * @returns The relative public URL path (e.g., "/uploads/candidates/uuid.jpg")
 */
export async function saveBase64File(base64String: string | null | undefined, category: string): Promise<string | null> {
    if (!base64String || !base64String.startsWith("data:")) {
        // If it's already a URL (e.g. starts with /uploads) or empty, return as is
        return base64String || null;
    }

    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            console.warn("Invalid base64 string format");
            return null;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Validate file size (max 10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (buffer.length > MAX_FILE_SIZE) {
            return null;
        }

        // Map MIME type to extension (allowlist)
        const ALLOWED_TYPES: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "application/pdf": "pdf",
        };
        const extension = ALLOWED_TYPES[mimeType];
        if (!extension) {
            return null;
        }

        // Generate random filename
        const filename = `${crypto.randomUUID()}.${extension}`;
        const uploadDir = join(process.cwd(), "public", "uploads", category);
        const filePath = join(uploadDir, filename);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Write file
        await writeFile(filePath, buffer);

        // Return public URL
        return `/uploads/${category}/${filename}`;
    } catch (error) {
        console.error("Error saving base64 file:", error);
        return null;
    }
}
