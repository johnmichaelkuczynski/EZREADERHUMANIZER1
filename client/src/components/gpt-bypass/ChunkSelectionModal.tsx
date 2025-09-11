import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface TextChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
}

interface ChunkSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: TextChunk[];
  onConfirm: (selectedChunks: TextChunk[]) => void;
}

export function ChunkSelectionModal({
  isOpen,
  onClose,
  chunks,
  onConfirm,
}: ChunkSelectionModalProps) {
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());

  // Initialize with all chunks selected by default
  useEffect(() => {
    if (isOpen && chunks.length > 0) {
      setSelectedChunkIds(new Set(chunks.map(chunk => chunk.id)));
    }
  }, [isOpen, chunks]);

  const handleToggleChunk = (chunkId: string) => {
    setSelectedChunkIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedChunkIds(new Set(chunks.map(chunk => chunk.id)));
  };

  const handleSelectNone = () => {
    setSelectedChunkIds(new Set());
  };

  const handleConfirm = () => {
    const selectedChunks = chunks.filter(chunk => selectedChunkIds.has(chunk.id));
    onConfirm(selectedChunks);
    onClose();
  };

  const selectedCount = selectedChunkIds.size;
  const totalCount = chunks.length;
  const totalWords = chunks
    .filter(chunk => selectedChunkIds.has(chunk.id))
    .reduce((sum, chunk) => sum + chunk.wordCount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Text Chunks to Process</DialogTitle>
          <DialogDescription>
            Your text has been divided into {totalCount} chunks. Select which chunks you want to rewrite.
            Processing multiple chunks may take longer but provides better results for large documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {selectedCount} of {totalCount} chunks selected
              </Badge>
              <Badge variant="outline">
                ~{totalWords.toLocaleString()} words
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all-chunks"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNone}
                data-testid="button-select-none-chunks"
              >
                Select None
              </Button>
            </div>
          </div>

          {/* Chunk List */}
          <ScrollArea className="h-96 border rounded-lg p-4">
            <div className="space-y-4">
              {chunks.map((chunk, index) => (
                <div key={chunk.id} className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={chunk.id}
                      checked={selectedChunkIds.has(chunk.id)}
                      onCheckedChange={() => handleToggleChunk(chunk.id)}
                      className="mt-1"
                      data-testid={`checkbox-chunk-${index}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label
                          htmlFor={chunk.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Chunk {index + 1}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {chunk.wordCount} words
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {chunk.content.length > 200
                          ? `${chunk.content.substring(0, 200)}...`
                          : chunk.content}
                      </div>
                    </div>
                  </div>
                  {index < chunks.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Processing Estimate */}
          {selectedCount > 0 && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="text-sm">
                <div className="font-medium text-blue-800">Processing Estimate</div>
                <div className="text-blue-600 mt-1">
                  Estimated time: ~{Math.ceil(selectedCount * 0.5)} minutes
                  <br />
                  Selected chunks will be processed sequentially for best quality results.
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-chunk-selection"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            data-testid="button-confirm-chunk-selection"
          >
            Process {selectedCount} Chunk{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}