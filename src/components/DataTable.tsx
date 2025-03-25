
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Entity } from '@/utils/schemaUtils';

interface DataTableProps {
  entity: Entity;
  initialData?: any[];
  onDataChange: (data: any[]) => void;
}

const DataTable = ({ entity, initialData = [], onDataChange }: DataTableProps) => {
  const [rows, setRows] = useState<any[]>([]);
  
  useEffect(() => {
    if (initialData.length > 0) {
      setRows(initialData);
    }
  }, [initialData]);

  // Create an empty row with null values for each field
  const createEmptyRow = () => {
    const newRow: Record<string, any> = {};
    entity.fields.forEach(field => {
      newRow[field.name] = '';
    });
    return newRow;
  };

  // Add a new empty row
  const addNewRow = () => {
    const newRows = [...rows, createEmptyRow()];
    setRows(newRows);
    onDataChange(newRows);
  };

  // Remove a row at the given index
  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    onDataChange(newRows);
  };

  // Update a cell value
  const updateCell = (rowIndex: number, fieldName: string, value: any) => {
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [fieldName]: value
    };
    setRows(newRows);
    onDataChange(newRows);
  };

  // If no rows exist, create an empty row
  useEffect(() => {
    if (rows.length === 0) {
      addNewRow();
    }
  }, []);

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {entity.fields.map(field => (
              <TableHead key={field.id}>
                {field.name}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({field.type})
                </span>
              </TableHead>
            ))}
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {entity.fields.map(field => (
                <TableCell key={`${rowIndex}-${field.id}`}>
                  <Input
                    value={row[field.name] || ''}
                    onChange={(e) => updateCell(rowIndex, field.name, e.target.value)}
                    className="h-8 w-full"
                  />
                </TableCell>
              ))}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(rowIndex)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="p-2 flex justify-center border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={addNewRow}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span>Add Row</span>
        </Button>
      </div>
    </div>
  );
};

export default DataTable;
