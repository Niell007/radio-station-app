import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

// Helper to clean SQL statements
function cleanSQLStatement(statement) {
  return statement
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .replace(/^\s+|\s+$/g, '')    // Trim ends
    .replace(/'/g, "''")          // Escape single quotes for SQL
    .replace(/"/g, '""')          // Escape double quotes for SQL
    .replace(/`/g, '"')           // Convert backticks to double quotes
    .replace(/\r\n/g, '\n')       // Normalize line endings
    .replace(/\r/g, '\n');        // Normalize line endings
}

// Helper to check if statement is complete
function isCompleteStatement(statement) {
  const trimmed = statement.trim();
  
  // Skip empty statements
  if (!trimmed) return false;
  
  // Skip comments
  if (trimmed.startsWith('--')) return false;
  
  // Check for CREATE TRIGGER statements that use BEGIN/END
  if (trimmed.includes('CREATE TRIGGER')) {
    const hasTriggerEnd = trimmed.includes('END;');
    if (!hasTriggerEnd) return false;
    
    // Make sure we have all parts of the trigger
    const requiredParts = [
      'CREATE TRIGGER',
      'ON',
      'BEGIN',
      'END;'
    ];
    return requiredParts.every(part => trimmed.includes(part));
  }
  
  // Skip standalone END statements
  if (trimmed === 'END;') return false;
  
  return true;
}

async function createTempDir() {
  const tempPath = await mkdtemp(join(tmpdir(), 'karaoke-sql-'));
  return tempPath;
}

async function executeStatement(statement, tempDir) {
  // Create a temporary file for the SQL statement
  const tempFile = join(tempDir, 'statement.sql');
  writeFileSync(tempFile, statement, 'utf-8');

  const command = `wrangler d1 execute DB --file="${tempFile}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('wrangler')) {
      console.warn('Warning:', stderr);
    }
    
    if (stdout) {
      const lines = stdout.split('\n');
      const jsonLine = lines.find(line => {
        const trimmed = line.trim();
        return (trimmed.startsWith('{') || trimmed.startsWith('[')) && 
               (trimmed.endsWith('}') || trimmed.endsWith(']'));
      });
      
      if (jsonLine) {
        try {
          const output = JSON.parse(jsonLine);
          if (Array.isArray(output) && output[0]) {
            if (output[0].error) {
              console.error('Error:', output[0].error);
              return false;
            }
            if (output[0].results) {
              console.log('Results:', output[0].results);
            }
          }
        } catch (error) {
          console.warn('Warning: Could not parse JSON output');
        }
      }
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Table/index/trigger already exists, continuing...');
      return true;
    } else if (error.message.includes('no such table')) {
      console.error('Referenced table does not exist yet');
      return false;
    } else if (error.message.includes('syntax error')) {
      console.error('SQL syntax error in statement:', statement);
      return false;
    } else {
      console.error('Error:', error.message);
      console.error('Statement:', statement);
      return false;
    }
  }
}

async function importKaraokeSQL() {
  let tempDir = null;
  
  try {
    // Create temp directory
    tempDir = await createTempDir();
    
    // Read SQL file
    const sqlPath = join(process.cwd(), 'sql', 'karaoke.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split SQL into statements, handling multi-line statements
    let statements = [];
    let currentStatement = '';
    let inTrigger = false;
    
    sql.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) return;
      
      // Check if we're entering a trigger definition
      if (trimmedLine.includes('CREATE TRIGGER')) {
        inTrigger = true;
      }
      
      currentStatement += ' ' + line;
      
      // If we're in a trigger, wait for END; before considering it complete
      if (inTrigger) {
        if (trimmedLine === 'END;') {
          if (isCompleteStatement(currentStatement)) {
            statements.push(cleanSQLStatement(currentStatement));
          }
          currentStatement = '';
          inTrigger = false;
        }
      } else if (line.trim().endsWith(';')) {
        if (isCompleteStatement(currentStatement)) {
          statements.push(cleanSQLStatement(currentStatement));
        }
        currentStatement = '';
      }
    });

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log('Statement:', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      const success = await executeStatement(statement, tempDir);
      if (success) {
        console.log('✓ Statement executed successfully');
      } else {
        console.error('✗ Statement failed');
        process.exit(1);
      }
    }

    console.log('\n✓ SQL import completed successfully');
  } catch (error) {
    console.error('\n✗ Error importing SQL:', error);
    process.exit(1);
  } finally {
    // Clean up temp directory
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Warning: Could not delete temp directory:', error.message);
      }
    }
  }
}

importKaraokeSQL(); 