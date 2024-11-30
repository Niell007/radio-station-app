import React, { useState } from 'react';
import { Table, Button, Pagination, Checkbox, Badge } from 'flowbite-react';
import { TrashIcon, PencilIcon, PlayIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { KaraokeEditModal } from './KaraokeEditModal';

export interface KaraokeFile {
  id: number;
  title: string;
  artist: string;
  language: string;
  genre?: string;
  fileUrl: string;
  lyricsUrl: string | null;
  uploadedAt: Date;
  duration: number;
  fileSize: number;
  mimeType: string;
  difficulty?: number;
  isExplicit: boolean;
}

interface KaraokeListProps {
  files: KaraokeFile[];
  currentPage: number;
  totalPages: number;
}

export function KaraokeList({ files, currentPage, totalPages }: KaraokeListProps) {
  const [editingFile, setEditingFile] = useState<KaraokeFile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/admin/karaoke/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedFiles.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return;

    try {
      await Promise.all(
        selectedFiles.map(id =>
          fetch(`/api/admin/karaoke/${id}`, { method: 'DELETE' })
        )
      );
      window.location.reload();
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Failed to delete some files');
    }
  };

  const handleEdit = (file: KaraokeFile) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    setShowEditModal(false);
    setEditingFile(null);
    window.location.reload();
  };

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.location.href = url.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const toggleFileSelection = (id: number) => {
    setSelectedFiles(prev =>
      prev.includes(id)
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
  };

  const toggleAllFiles = () => {
    setSelectedFiles(prev =>
      prev.length === files.length ? [] : files.map(f => f.id)
    );
  };

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-700">
            {selectedFiles.length} files selected
          </span>
          <Button color="failure" size="sm" onClick={handleBatchDelete}>
            Delete Selected
          </Button>
        </div>
      )}

      <Table>
        <Table.Head>
          <Table.HeadCell className="w-4 p-4">
            <Checkbox
              checked={selectedFiles.length === files.length}
              onChange={toggleAllFiles}
            />
          </Table.HeadCell>
          <Table.HeadCell>Title</Table.HeadCell>
          <Table.HeadCell>Artist</Table.HeadCell>
          <Table.HeadCell>Details</Table.HeadCell>
          <Table.HeadCell>File Info</Table.HeadCell>
          <Table.HeadCell>Uploaded</Table.HeadCell>
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {files.map((file) => (
            <Table.Row key={file.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <Table.Cell className="w-4 p-4">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                />
              </Table.Cell>
              <Table.Cell className="font-medium text-gray-900 dark:text-white">
                <div className="flex items-center space-x-2">
                  {file.title}
                  {file.isExplicit && (
                    <Badge color="warning" size="sm">Explicit</Badge>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>{file.artist}</Table.Cell>
              <Table.Cell>
                <div className="space-y-1">
                  <div className="text-sm">{file.language}</div>
                  {file.genre && <div className="text-sm text-gray-500">{file.genre}</div>}
                  {file.difficulty && (
                    <Badge color="info">
                      Difficulty: {file.difficulty}
                    </Badge>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="space-y-1 text-sm">
                  <div>{formatDuration(file.duration)}</div>
                  <div className="text-gray-500">{formatFileSize(file.fileSize)}</div>
                  <div className="text-gray-500">{file.mimeType.split('/')[1].toUpperCase()}</div>
                </div>
              </Table.Cell>
              <Table.Cell>
                {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center space-x-2">
                  <Button size="sm" color="gray" onClick={() => setPreviewUrl(file.fileUrl)}>
                    <PlayIcon className="w-4 h-4" />
                  </Button>
                  {file.lyricsUrl && (
                    <Button size="sm" color="gray" onClick={() => window.open(file.lyricsUrl!)}>
                      <DocumentTextIcon className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" color="warning" onClick={() => handleEdit(file)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" color="failure" onClick={() => handleDelete(file.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showIcons
          />
        </div>
      )}

      <KaraokeEditModal
        file={editingFile}
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFile(null);
        }}
        onSave={handleEditSave}
      />

      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-lg">
            <div className="mb-4">
              <audio
                src={previewUrl}
                controls
                className="w-full"
                autoPlay
              />
            </div>
            <div className="flex justify-end">
              <Button color="gray" onClick={() => setPreviewUrl(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 