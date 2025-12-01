import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface Occurrence {
  rowIndex: number;
  colIndex: number;
  value: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  onFind: (term: string, options?: { caseSensitive?: boolean; exact?: boolean; columnIndex?: number | null }) => Occurrence[];
  onReplace: (findTerm: string, replaceWith: string, options?: { caseSensitive?: boolean; exact?: boolean; columnIndex?: number | null }) => number;
  onUndo: () => void;
}

export const SearchReplaceModal: React.FC<Props> = ({ open, onOpenChange, headers, onFind, onReplace, onUndo }) => {
  const [term, setTerm] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exact, setExact] = useState(false);
  const [columnIndex, setColumnIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Occurrence[]>([]);

  const doFind = () => {
    console.debug('[SearchReplaceModal] doFind', { term, caseSensitive, exact, columnIndex });
    const res = onFind(term, { caseSensitive, exact, columnIndex });
    setResults(res);
  };

  const doReplace = () => {
    const count = onReplace(term, replaceWith, { caseSensitive, exact, columnIndex });
    // refresh preview after replace
    const res = onFind(term, { caseSensitive, exact, columnIndex });
    setResults(res);
    return count;
  };

  const handleClose = () => {
    onOpenChange(false);
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,900px)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar e Substituir</DialogTitle>
          <DialogDescription className="break-words">Encontre termos na planilha e substitua-os. Você pode pré-visualizar ocorrências antes de confirmar.</DialogDescription>
        </DialogHeader>

          <div className="grid gap-2">
          <label className="text-sm font-medium">Procurar</label>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Texto a localizar" />

          <label className="text-sm font-medium">Substituir por</label>
          <Input value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} placeholder="Texto substituto" />

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2"><Checkbox checked={caseSensitive} onCheckedChange={(v) => setCaseSensitive(!!v)} /> Case-sensitive</label>
            <label className="flex items-center gap-2"><Checkbox checked={exact} onCheckedChange={(v) => setExact(!!v)} /> Exato</label>
            <label className="flex items-center gap-2">
              <span className="text-sm">Coluna</span>
              <select value={columnIndex ?? ''} onChange={(e) => setColumnIndex(e.target.value === '' ? null : Number(e.target.value))} className="ml-2 rounded border px-2 py-1 max-w-xs">
                <option value="">Todas</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={doFind}>Localizar</Button>
            <Button variant="secondary" onClick={() => { const c = doReplace(); /* optionally show feedback */ }}>Substituir</Button>
            <Button variant="outline" onClick={() => { onUndo(); }}>Desfazer</Button>
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium">Ocorrências ({results.length})</div>
            <div className="max-h-48 overflow-auto mt-2 border rounded p-2 bg-muted/5">
              {results.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma ocorrência encontrada.</div>
              ) : (
                results.slice(0, 200).map((r, idx) => (
                  <div key={idx} className="text-sm py-1 border-b last:border-b-0">
                    Linha {r.rowIndex + 1}, Coluna {r.colIndex + 1}: <strong>{r.value}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SearchReplaceModal;
