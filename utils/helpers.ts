
import { ExtractedData } from './types';

//
// File Utilities
//

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // remove the `data:...;base64,` prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


//
// CSV Utilities
//

const escapeCsvCell = (cell: any): string => {
  const cellStr = String(cell ?? '');
  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
    return `"${cellStr.replace(/"/g, '""')}"`;
  }
  return cellStr;
};

export const jsonToCsv = (data: ExtractedData): string | null => {
  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(escapeCsvCell).join(',');

  const rows = data.map(row => {
    return headers.map(header => escapeCsvCell(row[header])).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

export const downloadCsv = (csvData: string, filename: string = 'datos_extraidos.csv') => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
