
export interface FileWithPreview extends File {
  preview: string;
}

export type ExtractedData = Array<Record<string, string | number>>;
