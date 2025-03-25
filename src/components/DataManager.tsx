import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from './FileUploader';
import DataTable from './DataTable';
import { Schema, Entity } from '@/utils/schemaUtils';
import { toast } from 'sonner';
import { SQLExecutor } from '@/utils/sqlUtils';

interface DataManagerProps {
  schema: Schema;
  onImportData: (tableName: string, data: any[]) => void;
  sqlExecutor?: SQLExecutor;
}

interface ResultSet {
  columns: { name: string; type: string }[];
  rows: any[][];
}

const DataManager = ({ schema, onImportData, sqlExecutor }: DataManagerProps) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [manualData, setManualData] = useState<any[]>([]);
  const [jsonData, setJsonData] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [existingData, setExistingData] = useState<any[]>([]);

  const selectedEntity = schema.entities.find(entity => entity.id === selectedEntityId);

  // Fetch existing data when entity is selected or data is imported
  useEffect(() => {
    if (selectedEntity && sqlExecutor) {
      try {
        const result = sqlExecutor.executeQuery(`SELECT * FROM ${selectedEntity.name} LIMIT 100`);
        if (typeof result !== 'string' && result.rows) {
          setExistingData(result.rows);
          setManualData(result.rows.map(row => {
            const obj: Record<string, any> = {};
            selectedEntity.fields.forEach((field, index) => {
              obj[field.name] = row[index];
            });
            return obj;
          }));
        } else {
          // Handle case where result is a string (error message)
          setExistingData([]);
          if (manualData.length === 0) {
            setManualData([{}]);
          }
        }
      } catch (error) {
        // Table might not exist yet or be empty
        setExistingData([]);
        if (manualData.length === 0) {
          setManualData([{}]);
        }
      }
    }
  }, [selectedEntityId, selectedEntity, sqlExecutor]);

  const handleManualDataSubmit = () => {
    if (!selectedEntity) {
      toast.error('Please select an entity first');
      return;
    }
    
    if (manualData.length === 0) {
      toast.error('Please add at least one row of data');
      return;
    }

    try {
      onImportData(selectedEntity.name, manualData);
      toast.success(`Data added to ${selectedEntity.name}`);
      
      // Refresh data after import
      if (sqlExecutor) {
        try {
          const result = sqlExecutor.executeQuery(`SELECT * FROM ${selectedEntity.name} LIMIT 100`);
          if (typeof result !== 'string' && result.rows) {
            setExistingData(result.rows);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to add data: Invalid format');
    }
  };

  const handleJsonDataSubmit = () => {
    if (!selectedEntity) {
      toast.error('Please select an entity first');
      return;
    }

    try {
      const data = JSON.parse(jsonData);
      if (!Array.isArray(data)) {
        toast.error('JSON data must be an array of objects');
        return;
      }
      
      onImportData(selectedEntity.name, data);
      toast.success(`Data added to ${selectedEntity.name}`);
      setJsonData('');
      
      // Refresh data after import
      if (sqlExecutor) {
        try {
          const result = sqlExecutor.executeQuery(`SELECT * FROM ${selectedEntity.name} LIMIT 100`);
          if (typeof result !== 'string' && result.rows) {
            setExistingData(result.rows);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to add data: Invalid JSON');
    }
  };

  const handleFileUpload = (fileContent: string, fileType: string) => {
    if (!selectedEntity) {
      toast.error('Please select an entity first');
      return;
    }

    try {
      let data;
      if (fileType === 'json') {
        data = JSON.parse(fileContent);
        if (!Array.isArray(data)) {
          toast.error('JSON data must be an array of objects');
          return;
        }
      } else if (fileType === 'csv') {
        const rows = fileContent.trim().split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        data = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim());
          const rowObj: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            if (index < values.length) {
              rowObj[header] = values[index];
            }
          });
          
          return rowObj;
        });
      } else {
        toast.error('Unsupported file type');
        return;
      }
      
      onImportData(selectedEntity.name, data);
      toast.success(`Data imported to ${selectedEntity.name}`);
      
      // Refresh data after import
      if (sqlExecutor) {
        try {
          const result = sqlExecutor.executeQuery(`SELECT * FROM ${selectedEntity.name} LIMIT 100`);
          if (typeof result !== 'string' && result.rows) {
            setExistingData(result.rows);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }
    } catch (error) {
      toast.error(`Failed to import data: ${error}`);
    }
  };

  return (
    <div className="p-4 animate-fade-in">
      <h3 className="text-lg font-medium mb-4">Data Management</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Entity</label>
        <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an entity to manage data" />
          </SelectTrigger>
          <SelectContent>
            {schema.entities.map(entity => (
              <SelectItem key={entity.id} value={entity.id}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedEntity ? (
        <>
          {existingData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Current Data</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {selectedEntity.fields.map(field => (
                        <th key={field.id} className="px-4 py-2 text-left text-sm font-medium">
                          {field.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {existingData.map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell: any, j: number) => (
                          <td key={j} className="px-4 py-2 text-sm">
                            {cell ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <DataTable
                entity={selectedEntity}
                initialData={manualData}
                onDataChange={setManualData}
              />
              <Button onClick={handleManualDataSubmit}>Save Data</Button>
            </TabsContent>
            
            <TabsContent value="json" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter JSON data for {selectedEntity.name}
                </label>
                <div className="bg-muted/50 p-2 rounded text-sm mb-2 overflow-x-auto">
                  <code>
                    {`[{ "${selectedEntity.fields[0]?.name}": "value", ... }]`}
                  </code>
                </div>
                <Textarea
                  placeholder={`Enter data in JSON format\nMust be an array of objects`}
                  className="min-h-[150px] font-mono text-sm"
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                />
              </div>
              <Button onClick={handleJsonDataSubmit}>Import JSON</Button>
            </TabsContent>
            
            <TabsContent value="file" className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Upload data file</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Import data from CSV, JSON or Excel files
                </p>
                <FileUploader onFileUpload={handleFileUpload} />
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="bg-muted/30 border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Select an entity to manage its data</p>
        </div>
      )}
    </div>
  );
};

export default DataManager;
