import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { GripVertical, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
function SortableHeader({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead ref={setNodeRef} style={style} className={cn("sticky top-0 z-20 bg-muted/50 relative group", isDragging && "bg-muted")}>
      <div className="flex items-center gap-2 min-w-[100px]">
        <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground whitespace-nowrap">{children}</span>
      </div>
    </TableHead>
  );
}

// --- Sortable Row Component ---
function SortableRow({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const, // Fix for table row positioning
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={cn("group", isDragging && "bg-muted")}>
      <TableCell className="w-[50px] sticky left-0 z-30 bg-card">
        <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex justify-center">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

interface DataTableProps {
  headers: string[];
  data: any[][];
  onReorderColumns: (oldIndex: number, newIndex: number) => void;
  onReorderRows: (oldIndex: number, newIndex: number) => void;
  rowEditState?: boolean[];
  onToggleRowEdit?: (rowIndex: number, enabled: boolean) => void;
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void;
}
export function DataTable({ headers, data, onReorderColumns, onReorderRows, rowEditState, onToggleRowEdit, onCellChange }: DataTableProps) {
  // We need stable IDs for dnd-kit. 
  // Since data and headers change from parent, we assume the parent handles data integrity.
  // We'll use prefixes to distinguish columns and rows.
  
  const colIds = headers.map((_, i) => `col-${i}`);
  const rowIds = data.map((_, i) => `row-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId !== overId) {
      if (activeId.startsWith('col-') && overId.startsWith('col-')) {
        const oldIndex = colIds.indexOf(activeId);
        const newIndex = colIds.indexOf(overId);
        onReorderColumns(oldIndex, newIndex);
      } else if (activeId.startsWith('row-') && overId.startsWith('row-')) {
        const oldIndex = rowIds.indexOf(activeId);
        const newIndex = rowIds.indexOf(overId);
        onReorderRows(oldIndex, newIndex);
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const tableRef = useRef<HTMLTableElement | null>(null);

  return (
    <Card className="overflow-hidden shadow-md border-muted h-[70vh]">
      <div className="overflow-auto h-full">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <div className="relative">
            <Table ref={tableRef}>
            <TableHeader className="bg-muted/50 sticky top-0 z-50">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[60px] text-center sticky left-0 z-40 bg-card">#</TableHead>
                {/* Toggle column header (non-draggable) */}
                <TableHead className="w-[100px] text-center sticky left-[25px] z-40 bg-card">Editar</TableHead>
                <SortableContext items={colIds} strategy={horizontalListSortingStrategy}>
                  {headers.map((header, index) => (
                    <SortableHeader key={`col-${index}`} id={`col-${index}`}>
                      {header}
                    </SortableHeader>
                  ))}
                </SortableContext>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                {data.map((row, rowIndex) => (
                  <SortableRow key={`row-${rowIndex}`} id={`row-${rowIndex}`}>
                    {/* Toggle cell */}
                    <TableCell className="text-center sticky left-[25px] z-30 bg-card">
                      <Switch
                        className="h-4 w-7 data-[state=checked]:[&>*:first-child]:translate-x-3"
                        checked={!!(rowEditState && rowEditState[rowIndex])}
                        onCheckedChange={(v: boolean) => {
                          console.debug('[DataTable] Switch changed', { rowIndex, value: v });
                          onToggleRowEdit?.(rowIndex, v);
                        }}
                        aria-label={`Enable edit row ${rowIndex}`}
                      />
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap">
                        {rowEditState && rowEditState[rowIndex] ? (
                          (() => {
                            console.debug('[DataTable] rendering input', { rowIndex, cellIndex });
                            return (
                              <input
                                className="w-full bg-transparent border border-input rounded px-1 py-0.5 text-sm"
                                value={cell ?? ''}
                                onChange={(e) => onCellChange?.(rowIndex, cellIndex, e.target.value)}
                              />
                            );
                          })()
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </SortableRow>
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </div>
          
          
          {/* Drag Overlay could be added here for smoother visuals, but SortableContext handles basic needs */}
        </DndContext>
      </div>
    </Card>
  );
}
