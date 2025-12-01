import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';

export interface ProcessedData {
  title: string;
  headers: string[];
  data: any[][];
  originalData: any[][]; // For undo/reset
}

export const parseExcelFile = (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (jsonData.length < 3) {
          resolve({
            title: jsonData[0]?.[0] || 'Untitled',
            headers: jsonData[1] || [],
            data: jsonData.slice(2) || [],
            originalData: jsonData.slice(2) || []
          });
          return;
        }

        const title = jsonData[0][0];
        const headers = jsonData[1] || [];
        const rawData = jsonData.slice(2);

        // Normalize rows so each has the same number of columns as headers.
        // This prevents rows with trailing empty cells from being shorter
        // and causing column shift when rendering.
        const normalizedRows = rawData.map(row => {
          const out: any[] = new Array(headers.length).fill('');
          for (let i = 0; i < headers.length; i++) {
            const val = row?.[i];
            out[i] = val === undefined || val === null ? '' : val;
          }
          return out;
        });

        const filteredData = normalizedRows.filter(row =>
          row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );

        const processed = processDataRows(filteredData);
        const sorted = sortDataRows(processed);

        resolve({
          title: String(title || 'Untitled'),
          headers: headers.map(String),
          data: sorted,
          originalData: filteredData
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const processDataRows = (rows: any[][]): any[][] => {
  return rows.map(row => 
    row.map(cell => {
      if (typeof cell === 'string') {
        let processed = cell.trim().replace(/\s+/g, ' ');
        processed = removeAccents(processed);
        processed = processed.toUpperCase();
        return processed;
      }
      return cell;
    })
  );
};

export const sortDataRows = (rows: any[][]): any[][] => {
  return [...rows].sort((a, b) => {
    const valA = String(a[0] || '');
    const valB = String(b[0] || '');
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const exportData = async (
  title: string,
  headers: string[],
  data: any[][],
  format: 'xlsx' | 'txt' | 'csv' | 'docx',
  options?: { exportOnlyLastColumn?: boolean; mergedHeaderName?: string }
) => {
  const sanitizeFileName = (s: string) => String(s || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const exportMergedColumn = async () => {
    if (!headers || headers.length === 0) return;
    // Preferir o nome do cabeçalho fornecido (quando a coluna mesclada pode não ser a última)
    const preferredName = options?.mergedHeaderName;
    let targetIndex = preferredName ? headers.findIndex(h => h === preferredName) : -1;
    if (targetIndex < 0) targetIndex = headers.length - 1;
    const mergedHeader = String(headers[targetIndex] ?? '');
    // Build a fresh array only for export (do not mutate inputs)
    const mergedData: string[] = data.map(row => String(row?.[targetIndex] ?? '') );
    const fileBase = `${sanitizeFileName(title)}_${sanitizeFileName(mergedHeader)}`;

    if (format === 'xlsx') {
      const sheetData = [[mergedHeader], ...mergedData.map(v => [v])];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileBase}.xlsx`);

    } else if (format === 'txt' || format === 'csv') {
      const content = [mergedHeader, ...mergedData].join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${fileBase}.${format}`);

    } else if (format === 'docx') {
      const rows = [
        new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: mergedHeader, bold: true })] })] }),
        ...mergedData.map(v => new TableRow({ children: [new TableCell({ children: [new Paragraph(String(v ?? ''))] })] })),
      ];

      const doc = new Document({ sections: [{ children: [new Paragraph({ text: mergedHeader, heading: 'Heading1' }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })] }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileBase}.docx`);
    }
  };

  const exportFullTable = async () => {
    const fileBase = sanitizeFileName(title || 'Untitled');
    // Build a fresh fullData array; keep inputs unchanged
    const fullData = [[title], headers.slice(), ...data.map(r => r.slice())];

    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet(fullData as any);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileBase}.xlsx`);

    } else if (format === 'txt' || format === 'csv') {
      const separator = format === 'csv' ? ',' : '\t';
      const content = fullData.map(row => (row || []).map(cell => String(cell ?? '')).join(separator)).join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${fileBase}.${format}`);

    } else if (format === 'docx') {
      const headerRow = new TableRow({ children: headers.map(h => new TableCell({ children: [new Paragraph({ text: String(h ?? ''), bold: true })] })) });
      const dataRows = data.map(row => new TableRow({ children: (row || []).map(cell => new TableCell({ children: [new Paragraph(String(cell ?? ''))] })) }));
      const table = new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
      const doc = new Document({ sections: [{ children: [new Paragraph({ text: title, heading: 'Heading1' }), table] }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileBase}.docx`);
    }
  };

  // Clear separation: call only one isolated path
  if (options?.exportOnlyLastColumn) {
    await exportMergedColumn();
  } else {
    await exportFullTable();
  }
};
