import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select, Spinner } from 'flowbite-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

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

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  artist: Yup.string().required('Artist is required'),
  language: Yup.string().required('Language is required'),
  genre: Yup.string(),
  difficulty: Yup.number().min(1).max(5),
  isExplicit: Yup.boolean()
});

export function KaraokeEditModal({ file, show, onClose, onSave }: KaraokeEditModalProps) {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      artist: '',
      language: '',
      genre: '',
      difficulty: '',
      isExplicit: false
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!file) return;

      setLoading(true);

      try {
        const response = await fetch(`/api/admin/karaoke/${file.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: values.title,
            artist: values.artist,
            language: values.language,
            genre: values.genre || null,
            difficulty: values.difficulty ? parseInt(values.difficulty) : null,
            isExplicit: values.isExplicit
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
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    if (file) {
      formik.setValues({
        title: file.title,
        artist: file.artist,
        language: file.language,
        genre: file.genre || '',
        difficulty: file.difficulty?.toString() || '',
        isExplicit: file.isExplicit
      });
    }
  }, [file]);

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Edit Karaoke File</Modal.Header>
      <form onSubmit={formik.handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="title" value="Title" />
              </div>
              <TextInput
                id="title"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.title && formik.errors.title ? (
                <div className="text-red-500 text-sm">{formik.errors.title}</div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="artist" value="Artist" />
              </div>
              <TextInput
                id="artist"
                name="artist"
                value={formik.values.artist}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.artist && formik.errors.artist ? (
                <div className="text-red-500 text-sm">{formik.errors.artist}</div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="language" value="Language" />
              </div>
              <Select
                id="language"
                name="language"
                value={formik.values.language}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
              {formik.touched.language && formik.errors.language ? (
                <div className="text-red-500 text-sm">{formik.errors.language}</div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="genre" value="Genre" />
              </div>
              <Select
                id="genre"
                name="genre"
                value={formik.values.genre}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
              {formik.touched.genre && formik.errors.genre ? (
                <div className="text-red-500 text-sm">{formik.errors.genre}</div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="difficulty" value="Difficulty" />
              </div>
              <Select
                id="difficulty"
                name="difficulty"
                value={formik.values.difficulty}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select difficulty</option>
                <option value="1">1 - Beginner</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Expert</option>
              </Select>
              {formik.touched.difficulty && formik.errors.difficulty ? (
                <div className="text-red-500 text-sm">{formik.errors.difficulty}</div>
              ) : null}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
