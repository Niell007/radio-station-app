import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select, Progress } from 'flowbite-react';

interface KaraokeFile {
  id: number;
  title: string;
  artist: string;
  language: string;
  genre: string | null;
  fileUrl: string;
  lyricsUrl: string | null;
  uploadedAt: Date;
  duration: number;
  fileSize: number;
  mimeType: string;
  difficulty?: number;
  isExplicit: boolean;
}

interface KaraokeEditModalProps {
  file: KaraokeFile | null;
  show: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function KaraokeEditModal({ file, show, onClose, onSave }: KaraokeEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    language: '',
    genre: '',
    difficulty: '',
    isExplicit: false
  });

  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (file) {
      setFormData({
        title: file.title,
        artist: file.artist,
        language: file.language,
        genre: file.genre || '',
        difficulty: file.difficulty?.toString() || '',
        isExplicit: file.isExplicit
      });
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSaving(true);
    setProgress(0);

    try {
      const response = await fetch(`/api/admin/karaoke/${file.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          artist: formData.artist,
          language: formData.language,
          genre: formData.genre || null,
          difficulty: formData.difficulty ? parseInt(formData.difficulty) : null,
          isExplicit: formData.isExplicit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update file');
      }

      onSave();
    } catch (error) {
      console.error('Error updating file:', error);
      alert('Failed to update file');
    } finally {
      setIsSaving(false);
      setProgress(100);
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Edit Karaoke File</Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="title" value="Title" />
              </div>
              <TextInput
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="artist" value="Artist" />
              </div>
              <TextInput
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="language" value="Language" />
              </div>
              <Select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                required
              >
                <option value="">Select language</option>
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
              <div className="mb-2 block">
                <Label htmlFor="genre" value="Genre" />
              </div>
              <Select
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                required
              >
                <option value="">Select genre</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="hiphop">Hip Hop</option>
                <option value="rnb">R&B</option>
                <option value="country">Country</option>
                <option value="jazz">Jazz</option>
                <option value="classical">Classical</option>
                <option value="electronic">Electronic</option>
              </Select>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="difficulty" value="Difficulty" />
              </div>
              <Select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="">Select difficulty</option>
                <option value="1">1 - Beginner</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Expert</option>
              </Select>
            </div>
          </div>
          {isSaving && <Progress value={progress} />}
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button color="gray" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
