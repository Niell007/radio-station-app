import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';
import { KaraokeEditForm } from './KaraokeEditForm';

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
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Edit Karaoke File</Modal.Header>
      <KaraokeEditForm
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
      />
      <Modal.Footer>
        <Button type="submit" form="karaoke-edit-form">Save Changes</Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
