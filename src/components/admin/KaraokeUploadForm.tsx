import React from 'react';
import { Button, Label, TextInput, Select, Checkbox, Alert, FileInput } from 'flowbite-react';

interface KaraokeUploadFormProps {
  formData: {
    title: string;
    artist: string;
    language: string;
    genre: string;
    difficulty: string;
    isExplicit: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    artist: string;
    language: string;
    genre: string;
    difficulty: string;
    isExplicit: boolean;
  }>>;
  handleSubmit: (e: React.FormEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

export function KaraokeUploadForm({
  formData,
  setFormData,
  handleSubmit,
  handleFileChange,
  uploading,
  progress,
  error,
  success
}: KaraokeUploadFormProps) {
  return (
    <form id="karaoke-upload-form" onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <Label htmlFor="file">File</Label>
        <FileInput
          id="file"
          onChange={handleFileChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <TextInput
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="artist">Artist</Label>
        <TextInput
          id="artist"
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="language">Language</Label>
        <TextInput
          id="language"
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="genre">Genre</Label>
        <TextInput
          id="genre"
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          id="difficulty"
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
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
          id="isExplicit"
          checked={formData.isExplicit}
          onChange={(e) => setFormData({ ...formData, isExplicit: e.target.checked })}
        />
        <Label htmlFor="isExplicit">Explicit</Label>
      </div>
      {error && <Alert color="failure">{error}</Alert>}
      {success && <Alert color="success">{success}</Alert>}
      {uploading && <div>Uploading... {progress}%</div>}
      <Button type="submit" disabled={uploading}>Upload</Button>
    </form>
  );
}
