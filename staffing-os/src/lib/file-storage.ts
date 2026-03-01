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

        // Map MIME type to extension
        let extension = "bin";
        if (mimeType === "image/jpeg") extension = "jpg";
        else if (mimeType === "image/png") extension = "png";
        else if (mimeType === "image/webp") extension = "webp";
        else if (mimeType === "application/pdf") extension = "pdf";

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
