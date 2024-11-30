import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout.astro';
import { prisma } from '../../../lib/prisma';
import { KaraokeUploader } from '../../../components/admin/KaraokeUploader';
import { KaraokeList } from '../../../components/admin/KaraokeList';

export async function getServerSideProps() {
  // Fetch karaoke files with pagination
  const page = 1; // TODO: Get from query params
  const limit = 10;
  const skip = (page - 1) * limit;

  const [karaokeFiles, total] = await Promise.all([
    prisma.karaokeFile.findMany({
      take: limit,
      skip,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        genre: true,
        fileUrl: true,
        lyricsUrl: true,
        uploadedAt: true
      }
    }),
    prisma.karaokeFile.count()
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    props: {
      karaokeFiles,
      currentPage: page,
      totalPages
    }
  };
}

interface KaraokePageProps {
  karaokeFiles: any[];
  currentPage: number;
  totalPages: number;
}

export default function KaraokePage({ karaokeFiles, currentPage, totalPages }: KaraokePageProps) {
  return (
    <AdminLayout title="Karaoke Management">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Karaoke Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload and manage karaoke files for your radio station.
        </p>
      </div>

      {/* Upload Section */}
      <div className="p-4 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Upload Karaoke Files
        </h2>
        <KaraokeUploader />
      </div>

      {/* List Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Karaoke Files
          </h2>
        </div>
        <KaraokeList
          files={karaokeFiles}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </AdminLayout>
  );
} 