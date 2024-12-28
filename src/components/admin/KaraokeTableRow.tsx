import React from 'react';
import { Table, Button, Checkbox, Badge } from 'flowbite-react';
import { TrashIcon, PencilIcon, PlayIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

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

interface KaraokeTableRowProps {
  file: KaraokeFile;
  selectedFiles: number[];
  toggleFileSelection: (id: number) => void;
  handleDelete: (id: number) => void;
  handleEdit: (file: KaraokeFile) => void;
  setPreviewUrl: (url: string | null) => void;
}

export function KaraokeTableRow({
  file,
  selectedFiles,
  toggleFileSelection,
  handleDelete,
  handleEdit,
  setPreviewUrl
}: KaraokeTableRowProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Table.Row>
      <Table.Cell className="w-4 p-4">
        <Checkbox
          checked={selectedFiles.includes(file.id)}
          onChange={() => toggleFileSelection(file.id)}
        />
      </Table.Cell>
      <Table.Cell>{file.title}</Table.Cell>
      <Table.Cell>{file.artist}</Table.Cell>
      <Table.Cell>
        <div className="flex flex-col">
          <span>{file.language}</span>
          {file.genre && <span>{file.genre}</span>}
          {file.difficulty && (
            <Badge color="info" size="sm">
              Difficulty: {file.difficulty}
            </Badge>
          )}
          {file.isExplicit && (
            <Badge color="failure" size="sm">
              Explicit
            </Badge>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col">
          <span>{formatDuration(file.duration)}</span>
          <span>{formatFileSize(file.fileSize)}</span>
        </div>
      </Table.Cell>
      <Table.Cell>{format(file.uploadedAt, 'yyyy-MM-dd HH:mm')}</Table.Cell>
      <Table.Cell>
        <div className="flex space-x-2">
          <Button size="xs" onClick={() => setPreviewUrl(file.fileUrl)}>
            <PlayIcon className="w-4 h-4" />
          </Button>
          {file.lyricsUrl && (
            <Button size="xs" onClick={() => window.open(file.lyricsUrl, '_blank')}>
              <DocumentTextIcon className="w-4 h-4" />
            </Button>
          )}
          <Button size="xs" onClick={() => handleEdit(file)}>
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button size="xs" color="failure" onClick={() => handleDelete(file.id)}>
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
