
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, Copy, FileJson, FileCode } from 'lucide-react';
import { generateSQLSchema, generateSchemaJSON, Schema } from '@/utils/schemaUtils';
import { toast } from 'sonner';

interface ExportOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  schema: Schema;
  sqlData: string;
}

const ExportOptions = ({ isOpen, onClose, schema, sqlData }: ExportOptionsProps) => {
  const [activeTab, setActiveTab] = useState('schema');
  const [exportFormat, setExportFormat] = useState<'sql' | 'json'>('sql');

  const generateSchemaCode = () => {
    return exportFormat === 'sql' ? generateSQLSchema(schema) : generateSchemaJSON(schema);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(err => toast.error('Failed to copy'));
  };

  const handleDownload = (content: string, fileType: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `dataweave_export.${fileType}`;
    document.body.appendChild(a);
    a.click();
    
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`Downloaded as ${fileType.toUpperCase()}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Export your schema and data in different formats
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schema">Schema Only</TabsTrigger>
            <TabsTrigger value="data">Schema with Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schema" className="space-y-4 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={exportFormat === 'sql' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('sql')}
                className="flex items-center gap-1"
              >
                <FileCode className="h-4 w-4" />
                <span>SQL</span>
              </Button>
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('json')}
                className="flex items-center gap-1"
              >
                <FileJson className="h-4 w-4" />
                <span>JSON</span>
              </Button>
            </div>
            
            <Card className="p-0 overflow-hidden border">
              <Textarea
                className="font-mono text-sm p-4 min-h-[300px] border-0"
                value={generateSchemaCode()}
                readOnly
              />
            </Card>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopyToClipboard(generateSchemaCode())}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </Button>
              <Button
                onClick={() => handleDownload(generateSchemaCode(), exportFormat)}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={exportFormat === 'sql' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('sql')}
                className="flex items-center gap-1"
              >
                <FileCode className="h-4 w-4" />
                <span>SQL</span>
              </Button>
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('json')}
                className="flex items-center gap-1"
              >
                <FileJson className="h-4 w-4" />
                <span>JSON</span>
              </Button>
            </div>
            
            <Card className="p-0 overflow-hidden border">
              <Textarea
                className="font-mono text-sm p-4 min-h-[300px] border-0"
                value={sqlData}
                readOnly
              />
            </Card>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopyToClipboard(sqlData)}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </Button>
              <Button
                onClick={() => handleDownload(sqlData, exportFormat)}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportOptions;
