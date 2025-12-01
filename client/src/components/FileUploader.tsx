import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 bg-card'
            }
          `}
        >
          <input {...getInputProps()} data-testid="input-file-upload" />
          
          <div className="flex flex-col items-center justify-center gap-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isDragActive ? (
                <Upload className="h-10 w-10 animate-bounce" />
              ) : (
                <FileSpreadsheet className="h-10 w-10" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {isDragActive ? "Solte a planilha aqui" : "Carregar Planilha do Excel"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Arraste e solte seu arquivo aqui, ou clique para procurar. 
                Suporta .xlsx, .xls, e .xlsm
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
              <span>Formato Padrão:</span>
              <span className="font-mono bg-background px-1 rounded border">Linha 1: Título</span>
              <span className="font-mono bg-background px-1 rounded border">Linha 2: Cabeçalho</span>
              <span className="font-mono bg-background px-1 rounded border">Linha 3+: Dados</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
