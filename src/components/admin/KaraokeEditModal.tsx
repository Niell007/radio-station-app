import React, { useState } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';

interface KaraokeFile {
  id: number;
  title: string;
  artist: string;
  language: string;
  genre: string | null;
}

interface KaraokeEditModalProps {
  file: KaraokeFile | null;
  show: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function KaraokeEditModal({ file, show, onClose, onSave }: KaraokeEditModalProps) {
  const [formData, setFormData] = useState<Partial<KaraokeFile>>(file || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/karaoke/${file.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update file');
      }

      onSave();
    } catch (error) {
      console.error('Error updating file:', error);
      alert('Failed to update file');
    } finally {
      setIsSubmitting(false);
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
                value={formData.title || ''}
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
                value={formData.artist || ''}
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
                value={formData.language || ''}
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
                value={formData.genre || ''}
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
                <option value="folk">Folk</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
} 