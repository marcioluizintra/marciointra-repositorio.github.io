import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRightLeft } from 'lucide-react';

interface ConcatenationModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  data: any[][];
  onConfirm: (selectedIndices: number[], newHeaderName: string) => void;
}

export function ConcatenationModal({ isOpen, onClose, headers, data, onConfirm }: ConcatenationModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [preview, setPreview] = useState<string>("");

  // Reinicia o estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedIndices([]);
      setPreview("");
    }
  }, [isOpen]);

  // Atualiza a pré-visualização quando a seleção muda
  useEffect(() => {
    if (selectedIndices.length > 0 && data.length > 0) {
      const firstRow = data[0];
      const previewText = selectedIndices
        .map(index => firstRow[index])
        .join(" - ");
      setPreview(previewText);
    } else {
      setPreview("Selecione as colunas para ver a pré-visualização...");
    }
  }, [selectedIndices, data]);

  const toggleColumn = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        // Manter a ordem com base no índice do cabeçalho ou na ordem de seleção?
        // Geralmente, a ordem de seleção é esperada para concatenação, mas vamos simplificar: ordem do cabeçalho
        const newSelection = [...prev, index].sort((a, b) => a - b);
        return newSelection;
      }
    });
  };

  const handleConfirm = () => {
    if (selectedIndices.length < 2) return;
    const defaultName = headers.filter((_, i) => selectedIndices.includes(i)).join(" - ");
    onConfirm(selectedIndices, defaultName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Concatenar Colunas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Selecione as colunas para unir. Os valores serão separados por " - ".
          </div>

          <div className="border rounded-md p-4 bg-muted/20">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pré-visualização (Primeira Linha)</h4>
            <div className="font-mono text-sm bg-card p-2 rounded border text-foreground min-h-[2.5rem] flex items-center">
              {preview}
            </div>
          </div>

          <ScrollArea className="h-[200px] border rounded-md p-4">
            <div className="space-y-3">
              {headers.map((header, index) => (
                <div key={`${header}-${index}`} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`col-${index}`} 
                    checked={selectedIndices.includes(index)}
                    onCheckedChange={() => toggleColumn(index)}
                  />
                  <Label 
                    htmlFor={`col-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {header}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedIndices.length < 2}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Mesclar Colunas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
