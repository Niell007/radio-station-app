import { useState, useCallback } from 'react';
import { FileInput, Label, Button, Select, TextInput, Checkbox, Alert } from 'flowbite-react';
import { processAudioBatch } from '../../utils/audio';

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
    'audio/mpeg',  // MP3
    'audio/wav',   // WAV
    'audio/ogg',   // OGG
    'audio/x-m4a', // M4A
    'audio/aac'    // AAC
];

interface KaraokeUploaderProps {
    onUploadComplete?: () => void;
}

export default function KaraokeUploader({ onUploadComplete }: KaraokeUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [language, setLanguage] = useState('');
    const [genre, setGenre] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [isExplicit, setIsExplicit] = useState(false);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return `Invalid file type: ${file.type}. Allowed types: MP3, WAV, OGG, M4A, AAC`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
        }
        return null;
    };

    const extractMetadata = (file: File) => {
        const name = file.name.replace(/\.[^/.]+$/, '');
        const parts = name.split('-').map(p => p.trim());
        if (parts.length >= 2) {
            setArtist(parts[0]);
            setTitle(parts[1]);
        } else {
            setTitle(name);
        }
    };

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList) return;

        const selectedFiles = Array.from(fileList);
        
        // Validate each file
        for (const file of selectedFiles) {
            const error = validateFile(file);
            if (error) {
                setError(error);
                event.target.value = ''; // Reset file input
                return;
            }
        }

        setFiles(selectedFiles);
        setProgress(0);
        setError(null);
        setSuccess(null);

        // Extract metadata from the first file
        if (selectedFiles[0]) {
            extractMetadata(selectedFiles[0]);
        }
    }, []);

    const handleFileUpload = async (file: File, duration: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);
        formData.append('artist', artist);
        formData.append('language', language);
        formData.append('genre', genre);
        formData.append('difficulty', difficulty);
        formData.append('is_explicit', String(isExplicit));
        formData.append('duration', String(duration));

        const response = await fetch('/api/admin/karaoke/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
        }
    };

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!files.length) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            // Process audio files to get duration
            const processedFiles = await processAudioBatch(
                files,
                setProgress,
                () => {}
            );

            // Upload each file
            for (const { file, duration } of processedFiles) {
                await handleFileUpload(file, duration);
            }

            setSuccess('Files uploaded successfully');
            setFiles([]);
            setTitle('');
            setArtist('');
            onUploadComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload files');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [files, title, artist, language, genre, difficulty, isExplicit, onUploadComplete]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="file">Choose Files</Label>
                <FileInput 
                    id="file"
                    accept="audio/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <TextInput
                        id="title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        disabled={uploading}
                    />
                </div>

                <div>
                    <Label htmlFor="artist">Artist</Label>
                    <TextInput
                        id="artist"
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                        required
                        disabled={uploading}
                    />
                </div>

                <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                        id="language"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        required
                        disabled={uploading}
                    >
                        <option value="">Select Language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                        id="genre"
                        value={genre}
                        onChange={e => setGenre(e.target.value)}
                        disabled={uploading}
                    >
                        <option value="">Select Genre</option>
                        <option value="pop">Pop</option>
                        <option value="rock">Rock</option>
                        <option value="hiphop">Hip Hop</option>
                        <option value="rnb">R&B</option>
                        <option value="jazz">Jazz</option>
                        <option value="classical">Classical</option>
                        <option value="electronic">Electronic</option>
                        <option value="folk">Folk</option>
                        <option value="country">Country</option>
                        <option value="latin">Latin</option>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                        id="difficulty"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        disabled={uploading}
                    >
                        <option value="">Select Difficulty</option>
                        <option value="1">1 - Beginner</option>
                        <option value="2">2 - Easy</option>
                        <option value="3">3 - Medium</option>
                        <option value="4">4 - Hard</option>
                        <option value="5">5 - Expert</option>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="explicit"
                        checked={isExplicit}
                        onChange={e => setIsExplicit(e.target.checked)}
                        disabled={uploading}
                    />
                    <Label htmlFor="explicit">Contains Explicit Content</Label>
                </div>
            </div>

            {error && (
                <Alert color="failure">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert color="success">
                    {success}
                </Alert>
            )}

            {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <Button 
                type="submit"
                disabled={uploading || !files.length}
                isProcessing={uploading}
            >
                {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
        </form>
    );
}
