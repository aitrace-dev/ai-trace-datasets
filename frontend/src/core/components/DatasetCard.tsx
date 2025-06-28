import React from 'react';
import { Table, TableCell, TableRow } from "@/core/components/ui/table";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Images } from "lucide-react";

interface DatasetCardProps {
  name: string;
  imageCount: number;
  queuedCount: number;
  lastUpdated: string;
  onClick: () => void;
  onRemove?: () => void;
}

const DatasetCard = ({ name, imageCount, queuedCount, lastUpdated, onClick, onRemove }: DatasetCardProps) => {
  return (
    <TableRow 
      className="hover:bg-muted/50 cursor-pointer group"
      onClick={onClick}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-muted-foreground" />
          {name}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{imageCount} images</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-blue-500 border-blue-500">
          {queuedCount} images
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        Last updated {lastUpdated}
      </TableCell>
      <TableCell className="text-right flex gap-2 justify-end">
        <Button 
          variant="ghost" 
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          View Dataset
        </Button>
        {onRemove && (
          <Button
            variant="destructive"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => { e.stopPropagation(); onRemove(); }}
          >
            Remove
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default DatasetCard;
