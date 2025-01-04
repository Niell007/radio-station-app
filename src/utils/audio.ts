export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener('error', (error) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to calculate audio duration'));
    });

    audio.src = url;
  });
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function processAudioBatch(
  files: File[],
  onProgress: (progress: number) => void,
  onError: (error: Error) => void
): Promise<Array<{ file: File; duration: number }>> {
  const results: Array<{ file: File; duration: number }> = [];
  let processed = 0;

  for (const file of files) {
    try {
      const duration = await getAudioDuration(file);
      results.push({ file, duration });
      processed++;
      onProgress((processed / files.length) * 100);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to process audio file'));
    }
  }

  return results;
} 
