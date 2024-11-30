export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(Math.round(audioBuffer.duration));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
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
  onComplete: () => void
): Promise<{ file: File; duration: number }[]> {
  const results = [];
  let processed = 0;

  for (const file of files) {
    try {
      const duration = await getAudioDuration(file);
      results.push({ file, duration });
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
    }
    processed++;
    onProgress((processed / files.length) * 100);
  }

  onComplete();
  return results;
} 