
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, File, FileText, Table } from "lucide-react";

interface FileUploaderProps {
  onFileUpload: (content: string, fileType: string) => void;
}

export const FileUploader = ({ onFileUpload }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.endsWith('.json') && 
        !file.name.endsWith('.csv') && 
        !file.name.endsWith('.xlsx')) {
      toast.error('Please upload JSON, CSV or Excel files only');
      return;
    }
    
    setSelectedFile(file);
  };

  const processFile = () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        
        let fileType = '';
        if (selectedFile.name.endsWith('.json')) {
          fileType = 'json';
        } else if (selectedFile.name.endsWith('.csv')) {
          fileType = 'csv';
        } else if (selectedFile.name.endsWith('.xlsx')) {
          fileType = 'xlsx';
          toast.error('Excel files are not fully supported in this demo. Please use JSON or CSV.');
          return;
        }
        
        onFileUpload(content, fileType);
        setSelectedFile(null);
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    
    if (selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      toast.error('This file type is not fully supported');
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 transition-colors text-center ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/20 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex flex-col items-center">
            <p className="font-medium">Drag & drop your file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          
          <input
            type="file"
            accept=".json,.csv,.xlsx"
            className="hidden"
            id="file-upload"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Button variant="outline" size="sm" type="button">
              Select File
            </Button>
          </label>
          
          <p className="text-xs text-muted-foreground">
            Supported formats: JSON, CSV, Excel
          </p>
        </div>
      </div>
      
      {selectedFile && (
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between animate-scale-in">
          <div className="flex items-center space-x-3">
            {selectedFile.name.endsWith('.json') ? (
              <File className="h-5 w-5 text-amber-500" />
            ) : selectedFile.name.endsWith('.csv') ? (
              <FileText className="h-5 w-5 text-green-500" />
            ) : (
              <Table className="h-5 w-5 text-blue-500" />
            )}
            
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={processFile}>Import</Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSelectedFile(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
