
import React, { useState, useCallback } from 'react';
import { extractDataFromFiles } from './services/geminiService';
import { jsonToCsv, downloadCsv } from './utils/helpers';
import { ExtractedData } from './types';

// --- Icon Components ---
const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
    </svg>
);
const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
);

// --- File Upload Component ---
interface FileUploadProps {
    onFilesChange: (files: File[]) => void;
    files: File[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, files }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFilesChange([...files, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFilesChange([...files, ...Array.from(e.target.files)]);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    const removeFile = (fileName: string) => {
        const newFiles = files.filter(file => file.name !== fileName);
        onFilesChange(newFiles);
    };

    return (
        <div className="w-full flex flex-col items-center">
            <label
                htmlFor="dropzone-file"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragActive ? 'border-brand-primary bg-brand-light dark:bg-brand-dark' : 'border-base-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-base-200 dark:bg-gray-700'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloudIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PDF, CSV, TXT, PNG, JPG, etc.</p>
                </div>
                <input ref={inputRef} type="file" id="dropzone-file" multiple onChange={handleChange} className="hidden" />
            </label>
            {files.length > 0 && (
                <div className="w-full mt-4">
                    <h3 className="font-semibold text-base-content dark:text-base-dark-content">Archivos seleccionados:</h3>
                    <ul className="mt-2 space-y-2">
                        {files.map(file => (
                            <li key={file.name} className="flex items-center justify-between bg-base-200 dark:bg-gray-700 p-2 rounded-md">
                                <div className="flex items-center space-x-2">
                                    <FileIcon className="h-5 w-5 text-brand-primary" />
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                </div>
                                <button onClick={() => removeFile(file.name)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <XIcon className="h-4 w-4 text-red-500" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function App() {
    const [files, setFiles] = useState<File[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outputData, setOutputData] = useState<ExtractedData | null>(null);

    const handleFilesChange = useCallback((newFiles: File[]) => {
        setFiles(newFiles);
    }, []);

    const handleProcess = async () => {
        if (!files.length || !prompt) {
            setError("Por favor, sube al menos un archivo y escribe una instrucción.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setOutputData(null);
        try {
            const data = await extractDataFromFiles(files, prompt);
            if(data && data.length > 0) {
              setOutputData(data);
            } else {
              setError("La IA no pudo extraer datos. Intenta con un prompt más específico o revisa los archivos.");
            }
        } catch (e: any) {
            setError(e.message || "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!outputData) return;
        const csv = jsonToCsv(outputData);
        if (csv) {
            downloadCsv(csv, 'datos_extraidos.csv');
        } else {
            setError("No se pudieron generar los datos para la descarga.");
        }
    }

    const isButtonDisabled = isLoading || files.length === 0 || prompt.trim() === '';

    return (
        <div className="min-h-screen bg-base-100 dark:bg-base-dark text-base-content dark:text-base-dark-content flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-2xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-brand-primary dark:text-brand-light">Auto-Extractor IA</h1>
                    <p className="mt-2 text-base sm:text-lg text-gray-600 dark:text-gray-400">Transforma tus archivos en datos estructurados con lenguaje natural.</p>
                </header>
                
                <main className="space-y-6">
                    <div className="p-6 bg-white dark:bg-base-dark-content/10 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">1. Sube tus archivos</h2>
                        <FileUpload files={files} onFilesChange={handleFilesChange} />
                    </div>

                    <div className="p-6 bg-white dark:bg-base-dark-content/10 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">2. Describe tu necesidad</h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ej: 'Extrae el nombre del proveedor, fecha y total de estas facturas en un Excel.'"
                            className="w-full h-32 p-3 border border-base-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-gray-200 transition"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={handleProcess}
                            disabled={isButtonDisabled}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600 transition-all duration-300"
                        >
                            {isLoading ? (
                                <>
                                    <LoaderIcon className="animate-spin h-5 w-5 mr-3" />
                                    Procesando...
                                </>
                            ) : "Procesar y Generar Excel"}
                        </button>
                        
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        
                        {outputData && (
                             <div className="w-full p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-center animate-fade-in">
                                 <p className="text-green-800 dark:text-green-200 mb-3">¡Proceso completado! Tus datos están listos.</p>
                                 <button
                                     onClick={handleDownload}
                                     className="inline-flex items-center px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                 >
                                     <DownloadIcon className="h-5 w-5 mr-2" />
                                     Descargar .CSV
                                 </button>
                             </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
