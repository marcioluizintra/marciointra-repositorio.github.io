console.log('[Home] Carregando componente Home');

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/FileUploader';
import { DataTable } from '@/components/DataTable';
import { ConcatenationModal } from '@/components/ConcatenationModal';
import SearchReplaceModal from '@/components/SearchReplaceModal';
import { parseExcelFile, exportData, ProcessedData } from '@/lib/excel-utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  RefreshCw, 
  Combine, 
  FileSpreadsheet,
  FileText,
  Loader2,
  FileArchive,
  Undo2
} from 'lucide-react';
import { Search } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ExtendedProcessedData extends ProcessedData {
  fileName?: string;
}

export default function Home() {
  console.log('[Home] Renderizando componente Home');
  
  const [fileData, setFileData] = useState<ExtendedProcessedData | null>(null);
  const [preConcatState, setPreConcatState] = useState<{ headers: string[], data: any[][] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConcatModalOpen, setIsConcatModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [rowEditState, setRowEditState] = useState<boolean[]>([]);
  const [history, setHistory] = useState<Array<{ headers: string[]; data: any[][] }>>([]);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setPreConcatState(null);
    setIsLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      setFileData({
        ...parsed,
        fileName: file.name,
      });
      // Initialize row edit state for imported rows
      setRowEditState(new Array(parsed.data.length).fill(false));
      toast({
        title: "Sucesso",
        description: `Carregado "${parsed.title}" com sucesso.`,
        className: "bg-secondary text-white border-secondary"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao processar o arquivo. Por favor, verifique o formato.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setPreConcatState(null);
    setRowEditState([]);
  };

  const handleReorderColumns = (oldIndex: number, newIndex: number) => {
    if (!fileData) return;
    
    const newHeaders = arrayMove(fileData.headers, oldIndex, newIndex);
    const newData = fileData.data.map(row => arrayMove(row, oldIndex, newIndex));
    
    setFileData({
      ...fileData,
      headers: newHeaders,
      data: newData
    });
  };

  const handleReorderRows = (oldIndex: number, newIndex: number) => {
    if (!fileData) return;
    
    const newData = arrayMove(fileData.data, oldIndex, newIndex);
    
    setFileData({
      ...fileData,
      data: newData
    });
    // keep row edit state in sync with row order
    setRowEditState(prev => prev && prev.length ? arrayMove(prev, oldIndex, newIndex) : prev);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!fileData) return;
    console.debug('[Home] handleCellChange', { rowIndex, colIndex, value });
    // push current state to history for undo
    setHistory(prev => [...prev, { headers: [...fileData.headers], data: fileData.data.map(r => r.slice()) }]);

    const newData = fileData.data.map((r, ri) => {
      if (ri !== rowIndex) return r.slice();
      const newRow = r.slice();
      // Ensure row has enough columns
      if (colIndex >= newRow.length) {
        newRow.length = colIndex + 1;
      }
      newRow[colIndex] = value;
      return newRow;
    });
    setFileData({ ...fileData, data: newData });
  };

  // --- Search / Replace / Undo utilities ---
  // Find all occurrences of `term`. Options:
  // - caseSensitive: default false
  // - exact: match whole cell content (default false -> substring)
  // - columnIndex: restrict search to a specific column (optional)
  const findAll = (term: string, options?: { caseSensitive?: boolean; exact?: boolean; columnIndex?: number | null }) => {
    console.debug('[Home] findAll called', { term, options, fileDataPresent: !!fileData });
    const results: Array<{ rowIndex: number; colIndex: number; value: string }> = [];
    if (!fileData || !term) return results;
    const { data } = fileData;
    const cs = options?.caseSensitive ?? false;
    const exact = options?.exact ?? false;
    const colFilter = typeof options?.columnIndex === 'number' ? options!.columnIndex : null;

    console.debug('[Home] findAll details', {
      term,
      totalRows: data.length,
      totalCols: fileData.headers.length,
      headers: fileData.headers,
      columnFilter: colFilter,
      columnName: colFilter !== null && fileData.headers[colFilter] ? fileData.headers[colFilter] : 'all',
      sampleValuesFromFilteredCol: colFilter !== null && data.length > 0
        ? data.slice(0, 5).map((r, i) => ({ row: i, value: r[colFilter] }))
        : 'N/A (searching all columns)'
    });

    for (let r = 0; r < data.length; r++) {
      const row = data[r] || [];
      for (let c = 0; c < row.length; c++) {
        if (colFilter !== null && c !== colFilter) continue;
        const cell = row[c];
        if (cell === undefined || cell === null) continue;
        const cellStr = String(cell);
        if (exact) {
          if (cs ? cellStr === term : cellStr.toLowerCase() === term.toLowerCase()) {
            results.push({ rowIndex: r, colIndex: c, value: cellStr });
          }
        } else {
          if (cs ? cellStr.includes(term) : cellStr.toLowerCase().includes(term.toLowerCase())) {
            results.push({ rowIndex: r, colIndex: c, value: cellStr });
          }
        }
      }
    }
    return results;
  };

  // Replace occurrences of `findTerm` with `replaceWith`.
  // Options similar to findAll. Returns number of replacements made.
  const replaceAll = (findTerm: string, replaceWith: string, options?: { caseSensitive?: boolean; exact?: boolean; columnIndex?: number | null }) => {
    if (!fileData || !findTerm) return 0;
    const cs = options?.caseSensitive ?? false;
    const exact = options?.exact ?? false;
    const colFilter = typeof options?.columnIndex === 'number' ? options!.columnIndex : null;

    // push current state for undo
    setHistory(prev => [...prev, { headers: [...fileData.headers], data: fileData.data.map(r => r.slice()) }]);

    let replacements = 0;
    const newData = fileData.data.map((row, rIdx) => {
      const newRow = row.slice();
      for (let c = 0; c < newRow.length; c++) {
        if (colFilter !== null && c !== colFilter) continue;
        const cell = newRow[c];
        if (cell === undefined || cell === null) continue;
        let cellStr = String(cell);
        if (exact) {
          if (cs ? cellStr === findTerm : cellStr.toLowerCase() === findTerm.toLowerCase()) {
            newRow[c] = replaceWith;
            replacements += 1;
          }
        } else {
          if (cs) {
            if (cellStr.includes(findTerm)) {
              newRow[c] = cellStr.split(findTerm).join(replaceWith);
              replacements += (cellStr.split(findTerm).length - 1);
            }
          } else {
            const lower = cellStr.toLowerCase();
            const findLower = findTerm.toLowerCase();
            if (lower.includes(findLower)) {
              // perform case-insensitive replace using regex
              try {
                const re = new RegExp(findTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const replaced = cellStr.replace(re, replaceWith);
                const count = (cellStr.match(re) || []).length;
                if (count > 0) {
                  newRow[c] = replaced;
                  replacements += count;
                }
              } catch (e) {
                // fallback naive approach
                const parts = cellStr.toLowerCase().split(findLower);
                const cnt = parts.length - 1;
                if (cnt > 0) {
                  newRow[c] = parts.join(replaceWith);
                  replacements += cnt;
                }
              }
            }
          }
        }
      }
      return newRow;
    });

    if (replacements > 0) {
      setFileData({ ...fileData, data: newData });
      toast({ title: 'Substituição', description: `Foram feitas ${replacements} substituições.` });
    } else {
      toast({ title: 'Substituição', description: `Nenhuma ocorrência encontrada.`, variant: 'secondary' });
    }

    return replacements;
  };

  const undoChange = () => {
    // Restore last history state
    setHistory(prev => {
      if (!prev || prev.length === 0) {
        toast({ title: 'Desfazer', description: 'Nada para desfazer.' });
        return prev;
      }
      const last = prev[prev.length - 1];
      setFileData(fd => fd ? { ...fd, headers: last.headers, data: last.data.map(r => r.slice()) } : fd);
      const next = prev.slice(0, -1);
      toast({ title: 'Desfazer', description: 'Alteração desfeita.' });
      return next;
    });
  };

  const handleConcatenate = (indices: number[], newHeaderName: string) => {
    if (!fileData) return;

    // Store deep copies to avoid accidental reference sharing
    setPreConcatState({ headers: [...fileData.headers], data: fileData.data.map(r => [...r]) });

    const { headers, data } = fileData;

    // Ensure indices are sorted to preserve expected order
    const sortedIndices = [...indices].sort((a, b) => a - b);

    // Debug logging to help trace mapping issues (can be removed later)
    console.debug('[Concatenate] headers before:', headers);
    console.debug('[Concatenate] indices:', sortedIndices);
    if (data.length > 0) console.debug('[Concatenate] first row before:', data[0]);

    // Build new headers and new data immutably and explicitly to avoid accidental
    // overwrites of existing columns. We will create each new row by copying
    // exactly the existing header count values and then appending the merged value.
    // Garantir nome único para o novo cabeçalho para evitar colisões com cabeçalhos existentes
    let uniqueHeader = String(newHeaderName || 'Mesclado').trim();
    if (!uniqueHeader) uniqueHeader = 'Mesclado';
    let suffix = 1;
    while (headers.includes(uniqueHeader)) {
      uniqueHeader = `${String(newHeaderName).trim()} (${suffix})`;
      suffix += 1;
    }
    const newHeaders = [...headers, uniqueHeader];
    const newData = data.map(row => {
      // Ensure row is an array and has at least as many elements as headers
      const baseRow = Array.isArray(row) ? row.slice(0, headers.length) : new Array(headers.length).fill('');

      const mergedValue = sortedIndices.map(i => {
        // guard index bounds
        if (i < 0 || i >= baseRow.length) return '';
        const v = baseRow[i];
        return v === null || v === undefined ? '' : String(v);
      }).join(' - ');

      // Append merged value at the end — do not attempt to write into any existing index
      return [...baseRow, mergedValue];
    });

    if (newData.length > 0) console.debug('[Concatenate] first row after:', newData[0]);

    setFileData({
      ...fileData,
      headers: newHeaders,
      data: newData
    });

    // Preserve previous row edit state where possible
    setRowEditState(prev => {
      const next = new Array(newData.length).fill(false);
      if (!prev || prev.length === 0) return next;
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
      return next;
    });

    // Log detalhado após atualização para ajudar a diagnosticar desalinhamentos
    console.debug('[Concatenate][Result] headers after:', newHeaders);
    if (newData.length > 0) console.debug('[Concatenate][Result] first row after:', newData[0]);
    const headerIndexMap = newHeaders.reduce((acc, h, i) => ({ ...acc, [h]: i }), {} as Record<string, number>);
    console.debug('[Concatenate][Result] header->index map:', headerIndexMap);

    toast({
      title: "Colunas Mescladas",
      description: `Criada nova coluna "${newHeaderName}"`,
    });
  };

  const handleUndoConcatenate = () => {
    if (!fileData || !preConcatState) return;

    setFileData({
      ...fileData,
      headers: preConcatState.headers,
      data: preConcatState.data,
    });

    setPreConcatState(null);

    toast({
      title: "Desfazer Mesclagem",
      description: "Retornou ao estado anterior.",
    });
  };

  const handleExport = (format: 'xlsx' | 'txt' | 'docx', exportOnlyMerged: boolean = false) => {
    if (!fileData) return;

    // Quando for exportar somente a coluna mesclada, tente identificar
    // o cabeçalho criado comparando com o estado anterior salvo em `preConcatState`.
    if (exportOnlyMerged && preConcatState) {
      const addedHeaders = fileData.headers.filter(h => !preConcatState.headers.includes(h));
      const mergedHeaderName = addedHeaders.length === 1 ? addedHeaders[0] : fileData.headers[fileData.headers.length - 1];

      exportData(fileData.title, fileData.headers, fileData.data, format, { exportOnlyLastColumn: true, mergedHeaderName });
    } else {
      exportData(fileData.title, fileData.headers, fileData.data, format, { exportOnlyLastColumn: exportOnlyMerged });
    }

    toast({
      title: "Exportação Iniciada",
      description: `Baixando arquivo .${format}`,
    });
  };

  const handleToggleRowEdit = (rowIndex: number, enabled: boolean) => {
    setRowEditState(prev => {
      const next = prev ? [...prev] : [];
      // ensure length
      if (next.length <= rowIndex) {
        next.length = rowIndex + 1;
      }
      next[rowIndex] = enabled;
      return next;
    });
  };

  // Expose utilities for console testing
  (window as any).__APP__ = (window as any).__APP__ || {};
  (window as any).__APP__.findAll = (term: string, options?: any) => findAll(term, options);
  (window as any).__APP__.replaceAll = (findTerm: string, replaceWith: string, options?: any) => replaceAll(findTerm, replaceWith, options);
  (window as any).__APP__.undoChange = () => undoChange();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-primary-foreground rounded-lg">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Processador de Excel Pro</h1>
            <p className="text-sm text-muted-foreground">Envie, Limpe, Organize, Exporte</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {fileData && (
            <Button variant="outline" onClick={handleReset} className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive">
              <RefreshCw className="h-4 w-4" />
              Começar de Novo
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!fileData ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg text-muted-foreground">Processando estrutura do arquivo...</p>
                </div>
              ) : (
                <FileUploader onFileUpload={handleFileUpload} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {fileData.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {fileData.data.length} linhas • {fileData.headers.length} colunas
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {preConcatState && (
                    <Button 
                      variant="outline"
                      onClick={handleUndoConcatenate}
                      className="gap-2 text-destructive border-destructive"
                    >
                      <Undo2 className="h-4 w-4" />
                      Desfazer Mesclagem
                    </Button>
                  )}

                  <Button 
                    variant="secondary" 
                    className="bg-secondary text-white hover:bg-secondary/90"
                    onClick={() => setIsConcatModalOpen(true)}
                    data-testid="button-merge-columns"
                  >
                    <Combine className="h-4 w-4 mr-2" />
                    Mesclar Colunas
                  </Button>

                  <Button variant="outline" onClick={() => setIsSearchModalOpen(true)} className="ml-2">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar/Substituir
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-primary text-white hover:bg-primary/90" data-testid="button-export">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Exportar Tabela Completa</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleExport('xlsx', false)} data-testid="menu-export-xlsx">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('txt', false)} data-testid="menu-export-txt">
                        <FileText className="h-4 w-4 mr-2" />
                        Texto (.txt)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('docx', false)} data-testid="menu-export-docx">
                        <FileArchive className="h-4 w-4 mr-2" />
                        Word (.docx)
                      </DropdownMenuItem>

                      {preConcatState && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Exportar Somente Coluna Mesclada</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleExport('xlsx', true)}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Excel (.xlsx)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport('txt', true)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Texto (.txt)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport('docx', true)}>
                            <FileArchive className="h-4 w-4 mr-2" />
                            Word (.docx)
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <DataTable 
                headers={fileData.headers} 
                data={fileData.data} 
                onReorderColumns={handleReorderColumns}
                onReorderRows={handleReorderRows}
                rowEditState={rowEditState}
                onToggleRowEdit={handleToggleRowEdit}
                onCellChange={handleCellChange}
              />

              <SearchReplaceModal
                open={isSearchModalOpen}
                onOpenChange={setIsSearchModalOpen}
                headers={fileData.headers}
                onFind={findAll}
                onReplace={replaceAll}
                onUndo={undoChange}
              />

              <ConcatenationModal 
                isOpen={isConcatModalOpen}
                onClose={() => setIsConcatModalOpen(false)}
                headers={fileData.headers}
                data={fileData.data}
                onConfirm={handleConcatenate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
