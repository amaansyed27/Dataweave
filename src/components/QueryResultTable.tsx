
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface ResultSetColumn {
  name: string;
  type: string;
}

interface QueryResultTableProps {
  columns: ResultSetColumn[];
  rows: any[][];
}

const QueryResultTable = ({ columns, rows }: QueryResultTableProps) => {
  if (!columns || columns.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No columns to display</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={idx} className="font-medium">
                {column.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx}>
                    {cell !== null ? String(cell) : 
                      <span className="text-muted-foreground italic">NULL</span>
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="py-6 text-center text-muted-foreground"
              >
                No data returned
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default QueryResultTable;
