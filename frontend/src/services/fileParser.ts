/**
 * Browser-native file parsing service using the xlsx library.
 * No backend required — everything runs in the browser.
 */
import * as XLSX from 'xlsx';
import { RawTicket } from '../types/ticket';

let ticketCounter = 0;

function generateId(seed: string): string {
  const ts = Date.now() + ticketCounter++;
  let hash = 0;
  const str = seed + ts;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'T-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

function detectIdColumn(columns: string[]): string | null {
  const keywords = ['id', 'ticket', 'number', 'no', 'ref', 'case', 'incident'];
  for (const col of columns) {
    if (keywords.some((kw) => col.toLowerCase().includes(kw))) return col;
  }
  return null;
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{3,}/g, '  ')
    .trim();
}

function rowsToTickets(
  rows: Record<string, unknown>[],
  columns: string[],
  sourceType: 'email' | 'ticket'
): RawTicket[] {
  const idCol = detectIdColumn(columns);
  return rows
    .filter((row) => Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== ''))
    .map((row, idx) => {
      const ticketId = idCol && row[idCol]
        ? String(row[idCol]).trim()
        : `TICKET-${idx + 1}`;

      const parts: string[] = [];
      for (const col of columns) {
        if (col === idCol) continue;
        const val = row[col];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          parts.push(`${col}: ${val}`);
        }
      }

      return {
        ticket_id: ticketId,
        raw_text: cleanText(parts.join('\n')),
        source_type: sourceType,
        metadata: { row_index: idx, id_column: idCol },
      } satisfies RawTicket;
    });
}

/** Parse an XLSX or XLS file in the browser */
export function parseXLSXFile(file: File): Promise<RawTicket[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (!rows.length) { resolve([]); return; }
        const columns = Object.keys(rows[0]);
        resolve(rowsToTickets(rows, columns, 'ticket'));
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/** Parse a CSV file in the browser */
export function parseCSVFile(file: File): Promise<RawTicket[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target!.result as string;
        const workbook = XLSX.read(text, { type: 'string' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (!rows.length) { resolve([]); return; }
        const columns = Object.keys(rows[0]);
        resolve(rowsToTickets(rows, columns, 'ticket'));
      } catch (err) {
        reject(new Error('Failed to parse CSV file: ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Parse any supported file (xlsx, xls, csv) */
export async function parseFile(file: File): Promise<RawTicket[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSVFile(file);
  if (ext === 'xlsx' || ext === 'xls') return parseXLSXFile(file);
  throw new Error(`Unsupported file type: .${ext}. Please upload .xlsx, .xls, or .csv`);
}

/** Parse pasted tabular text (CSV or TSV) */
export function parsePastedTable(text: string): RawTicket[] {
  try {
    const delimiter = text.includes('\t') ? '\t' : ',';
    const workbook = XLSX.read(text, { type: 'string', FS: delimiter });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (!rows.length) return [];
    const columns = Object.keys(rows[0]);
    return rowsToTickets(rows, columns, 'ticket');
  } catch {
    // Fallback: treat each line as a separate ticket
    return text.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => ({
        ticket_id: `TICKET-${idx + 1}`,
        raw_text: cleanText(line),
        source_type: 'ticket' as const,
        metadata: {},
      }));
  }
}

/** Parse a pasted email */
export function parsePastedEmail(text: string): RawTicket {
  return {
    ticket_id: generateId('email'),
    raw_text: cleanText(text),
    source_type: 'email',
    metadata: { source: 'manual_paste' },
  };
}
