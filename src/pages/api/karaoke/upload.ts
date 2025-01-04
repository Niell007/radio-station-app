import type { APIRoute } from 'astro';
import { KaraokeManager } from '../../../lib/karaoke';
import { getAudioDuration } from '../../../utils/audio';
import { createCipheriv, randomBytes } from 'crypto';

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
    'audio/mpeg',  // MP3
    'audio/wav',   // WAV
    'audio/ogg',   // OGG
    'audio/x-m4a', // M4A
    'audio/aac'    // AAC
];

const algorithm = 'aes-256-ctr';
const secretKey = process.env.SECRET_KEY || 'your-secret-key';

function encrypt(text: string) {
    const iv = randomBytes(16);
    const cipher = createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const artist = formData.get('artist') as string;
        const language = formData.get('language') as string;
        const genre = formData.get('genre') as string;
        const difficulty = parseInt(formData.get('difficulty') as string);
        const is_explicit = formData.get('is_explicit') === 'true';

        // Validate required fields
        if (!file || !title || !artist || !language) {
            return new Response(JSON.stringify({
                error: 'Missing required fields'
            }), { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return new Response(JSON.stringify({
                error: `Invalid file type: ${file.type}. Allowed types: MP3, WAV, OGG, M4A, AAC`
            }), { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return new Response(JSON.stringify({
                error: `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            }), { status: 400 });
        }

        // Upload file to R2
        const key = `karaoke/${Date.now()}-${file.name}`;
        await locals.env.BUCKET.put(key, file, {
            httpMetadata: {
                contentType: file.type
            }
        });

        // Get file URL
        const url = `https://${locals.env.BUCKET_URL}/${key}`;

        // Encrypt file URL
        const encryptedUrl = encrypt(url);

        // Get audio duration
        const duration = await getAudioDuration(file);

        // Create karaoke entry
        const manager = new KaraokeManager(locals.env.DB);
        const id = await manager.create({
            title,
            artist,
            language,
            genre: genre || undefined,
            file_url: encryptedUrl,
            duration,
            file_size: file.size,
            mime_type: file.type,
            difficulty: difficulty || undefined,
            is_explicit
        });

        return new Response(JSON.stringify({
            id,
            url: encryptedUrl
        }), { status: 200 });
    } catch (error) {
        console.error('Error uploading karaoke file:', error);
        return new Response(JSON.stringify({
            error: 'Failed to upload karaoke file'
        }), { status: 500 });
    }
};
