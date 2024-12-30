import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function* readSqlFile(filePath) {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentStatement = '';
  for await (const line of rl) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('--')) continue;

    currentStatement += line + '\n';
    if (trimmedLine.endsWith(';')) {
      yield currentStatement;
      currentStatement = '';
    }
  }

  if (currentStatement.trim()) {
    yield currentStatement;
  }
}

async function generateSearchVectors(db) {
  console.log('Generating search vectors for karaoke files...');

  // Get all karaoke files without search vectors
  const karaoke = await db
    .prepare('SELECT id, title, artist, genre FROM karaoke_files WHERE search_vector IS NULL')
    .all();

  const BATCH_SIZE = 50;
  for (let i = 0; i < karaoke.results.length; i += BATCH_SIZE) {
    const batch = karaoke.results.slice(i, i + BATCH_SIZE);
    console.log(`Processing vectors batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(karaoke.results.length / BATCH_SIZE)}`);

    for (const file of batch) {
      // Generate search text combining title, artist, and genre
      const searchText = `${file.title} ${file.artist} ${file.genre || ''}`.trim();

      // Generate embedding using Cloudflare AI
      const { data: [{ embedding }] } = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: [searchText]
      });

      // Update database with search vector
      await db
        .prepare('UPDATE karaoke_files SET search_vector = ? WHERE id = ?')
        .bind(JSON.stringify(embedding), file.id)
        .run();
    }
  }
}

async function importKaraokeData() {
  try {
    console.log('Starting karaoke data import...');
    const sqlFilePath = join(__dirname, '../karaokesql.sql');

    // Process SQL statements in batches
    const BATCH_SIZE = 100;
    let currentBatch = [];
    let batchCount = 0;
    let totalStatements = 0;

    for await (const statement of readSqlFile(sqlFilePath)) {
      currentBatch.push(statement);
      totalStatements++;

      if (currentBatch.length >= BATCH_SIZE) {
        batchCount++;
        console.log(`Processing batch ${batchCount} (${totalStatements} statements processed)`);
        
        const batchSql = currentBatch.join('\n');
        const tempFile = join(__dirname, `temp_batch_${batchCount}.sql`);
        writeFileSync(tempFile, batchSql, 'utf-8');

        try {
          execSync(`npx wrangler d1 execute radio-station-db --local --file=${tempFile}`, {
            stdio: 'inherit'
          });
        } finally {
          // Clean up temp file
          execSync(`rm ${tempFile}`);
        }

        currentBatch = [];
      }
    }

    // Process remaining statements
    if (currentBatch.length > 0) {
      batchCount++;
      console.log(`Processing final batch ${batchCount} (${totalStatements} total statements)`);
      
      const batchSql = currentBatch.join('\n');
      const tempFile = join(__dirname, `temp_batch_${batchCount}.sql`);
      writeFileSync(tempFile, batchSql, 'utf-8');

      try {
        execSync(`npx wrangler d1 execute radio-station-db --local --file=${tempFile}`, {
          stdio: 'inherit'
        });
      } finally {
        // Clean up temp file
        execSync(`rm ${tempFile}`);
      }
    }

    console.log('Basic import complete. Starting search vector generation...');

    // Initialize D1 database connection
    const db = await initD1();
    await generateSearchVectors(db);

    console.log('Karaoke data import and search vector generation complete!');
  } catch (error) {
    console.error('Error importing karaoke data:', error);
    process.exit(1);
  }
}

async function initD1() {
  // Get database binding from wrangler.toml
  const wranglerConfig = JSON.parse(
    execSync('npx wrangler d1 list --json', { encoding: 'utf-8' })
  );

  const dbBinding = wranglerConfig.find(b => b.binding === 'DB');
  if (!dbBinding) {
    throw new Error('DB binding not found in wrangler.toml');
  }

  return dbBinding;
}

importKaraokeData(); 
