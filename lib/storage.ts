
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Whitelist allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
]);

// Whitelist allowed file extensions
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

export interface StorageProvider {
    upload(file: File, folder?: string): Promise<string>;
    delete(key: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
    private uploadDir: string;

    constructor() {
        // In a real S3 scenario, this would not be needed.
        // For local dev, we keep using public/uploads but managed strictly.
        this.uploadDir = path.join(process.cwd(), "public", "uploads");
    }

    async upload(file: File, folder: string = "general"): Promise<string> {
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            throw new Error(`Invalid file type: ${file.type}. Allowed: JPG, PNG, WEBP, PDF.`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize extension - only allow whitelisted extensions
        let ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            ext = ".bin"; // Safe fallback for unknown extensions
        }
        const uniqueName = `${uuidv4()}${ext}`;

        // Structure uploads by folder if desired, currently flattening to /uploads
        // for compatibility, but unique naming prevents collisions.
        const filePath = path.join(this.uploadDir, uniqueName);

        // Ensure destination exists (could add mkdir logic here if strictly private)
        // For now assuming public/uploads exists as per project structure

        await writeFile(filePath, buffer);

        // Return the public URL
        return `/uploads/${uniqueName}`;
    }

    async delete(key: string): Promise<void> {
        // Key is likely the URL path like "/uploads/foo.jpg"
        // We need to resolve it back to the file system path
        const filename = path.basename(key);
        const filePath = path.join(this.uploadDir, filename);

        try {
            await unlink(filePath);
        } catch (error) {
            console.warn(`Failed to delete file ${filePath}:`, error);
            // Swallow error if file missing, otherwise rethrow?
        }
    }
}

// Export a singleton instance
export const storage = new LocalStorageProvider();
