import React, { useState } from 'react';
import { Table, Button, Pagination } from 'flowbite-react';
import { TrashIcon, PencilIcon, PlayIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { KaraokeEditModal } from './KaraokeEditModal';

interface KaraokeFile {
  id: number;
  title: string;
  artist: string;
  language: string;
  genre: string | null;
  fileUrl: string;
  lyricsUrl: string | null;
  uploadedAt: Date;
}

interface KaraokeListProps {
  files: KaraokeFile[];
  currentPage: number;
  totalPages: number;
}

export function KaraokeList({ files, currentPage, totalPages }: KaraokeListProps) {
  const [editingFile, setEditingFile] = useState<KaraokeFile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  return (
    <>
      <Table>
        <Table.Head>
          <Table.HeadCell>Title</Table.HeadCell>
          <Table.HeadCell>Artist</Table.HeadCell>
          <Table.HeadCell>Language</Table.HeadCell>
          <Table.HeadCell>Genre</Table.HeadCell>
          <Table.HeadCell>Uploaded</Table.HeadCell>
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {files.map((file) => (
            <Table.Row key={file.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <Table.Cell className="font-medium text-gray-900 dark:text-white">
                {file.title}
              </Table.Cell>
              <Table.Cell>{file.artist}</Table.Cell>
              <Table.Cell>{file.language}</Table.Cell>
              <Table.Cell>{file.genre}</Table.Cell>
              <Table.Cell>
                {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center space-x-2">
                  <Button size="sm" color="gray" onClick={() => window.open(file.fileUrl)}>
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
    </>
  );
} 