import React, { useState, useRef } from 'react';
import { FileInput, Label, TextInput, Select, Button, Alert, Progress } from 'flowbite-react';
import { CloudArrowUpIcon } from '@heroicons/react/24/solid';
import { processAudioBatch } from '../../utils/audio';

interface UploadState {
  status: 'idle' | 'processing' | 'uploading' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export function KaraokeUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedLyrics, setSelectedLyrics] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFiles?.length) return;

    try {
      setUploadState({ status: 'processing', progress: 0 });

      // Process audio files to get durations
      const processedFiles = await processAudioBatch(
        Array.from(selectedFiles),
        (progress) => setUploadState(state => ({ ...state, progress })),
        () => setUploadState(state => ({ ...state, status: 'uploading', progress: 0 }))
      );

      // Upload files one by one
      let uploaded = 0;
      for (const { file, duration } of processedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
        formData.append('artist', 'Unknown'); // Default value
        formData.append('language', 'en'); // Default value
        formData.append('genre', 'other'); // Default value
        formData.append('duration', duration.toString());

        if (selectedLyrics) {
          formData.append('lyrics', selectedLyrics);
        }

        const response = await fetch('/api/admin/karaoke/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        uploaded++;
        setUploadState(state => ({
          ...state,
          progress: (uploaded / processedFiles.length) * 100
        }));
      }

      setUploadState({
        status: 'success',
        message: `Successfully uploaded ${processedFiles.length} files`
      });
      
      // Reset form
      formRef.current?.reset();
      setSelectedFiles(null);
      setSelectedLyrics(null);
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {uploadState.status === 'success' && (
        <Alert color="success">
          {uploadState.message}
        </Alert>
      )}
      
      {uploadState.status === 'error' && (
        <Alert color="failure">
          {uploadState.message}
        </Alert>
      )}

      {(uploadState.status === 'processing' || uploadState.status === 'uploading') && (
        <div className="space-y-2">
          <Progress
            progress={uploadState.progress}
            size="lg"
            labelProgress
            labelText={uploadState.status === 'processing' ? 'Processing files...' : 'Uploading files...'}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="files" value="Karaoke Files" />
          </div>
          <FileInput
            id="files"
            multiple
            accept="audio/*"
            required
            onChange={(e) => setSelectedFiles(e.target.files)}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            MP3, WAV, or OGG (max. 50MB each)
          </p>
        </div>

        <div>
          <div className="mb-2 block">
            <Label htmlFor="lyrics" value="Lyrics File (Optional)" />
          </div>
          <FileInput
            id="lyrics"
            accept=".txt,.lrc"
            onChange={(e) => setSelectedLyrics(e.target.files?.[0] || null)}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            TXT or LRC format
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={uploadState.status !== 'idle'}
        className="w-full sm:w-auto"
      >
        {uploadState.status === 'idle' ? (
          <>
            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
            Upload Files
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="w-5 h-5 mr-2 animate-bounce" />
            {uploadState.status === 'processing' ? 'Processing...' : 'Uploading...'}
          </>
        )}
      </Button>
    </form>
  );
} 