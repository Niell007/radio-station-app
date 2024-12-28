import { useState, useCallback } from 'react';
import { FileInput, Label, Button, Select, TextInput, Checkbox, Alert } from 'flowbite-react';
import { processAudioBatch } from '../../utils/audio';
import KaraokeUploadForm from './KaraokeUploadForm';

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

    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        language: '',
        genre: '',
        difficulty: '',
        isExplicit: false
    });

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
            setFormData(prev => ({ ...prev, artist: parts[0], title: parts[1] }));
        } else {
            setFormData(prev => ({ ...prev, title: name }));
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
        formData.append('title', formData.title || file.name);
        formData.append('artist', formData.artist);
        formData.append('language', formData.language);
        formData.append('genre', formData.genre);
        formData.append('difficulty', formData.difficulty);
        formData.append('is_explicit', String(formData.isExplicit));
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
            setFormData({
                title: '',
                artist: '',
                language: '',
                genre: '',
                difficulty: '',
                isExplicit: false
            });
            onUploadComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload files');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [files, formData, onUploadComplete]);

    return (
        <KaraokeUploadForm
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            handleFileChange={handleFileChange}
            uploading={uploading}
            progress={progress}
            error={error}
            success={success}
        />
    );
}
