
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings as SettingsIcon, Download, Database, FileCode, Menu } from 'lucide-react';
import Settings from './Settings';
import ExportOptions from './ExportOptions';
import { Schema } from '@/utils/schemaUtils';

interface NavbarProps {
  schema: Schema;
  sqlData: string;
  onGeminiApiKeyChange: (key: string) => void;
}

const Navbar = ({ schema, sqlData, onGeminiApiKeyChange }: NavbarProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80 transition-all duration-300 animate-fade-in">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col space-y-4 pt-8">
                <div className="text-xl font-semibold mb-6">DataWeave</div>
                <Button variant="ghost" className="justify-start gap-2" onClick={() => setShowSettings(true)}>
                  <SettingsIcon size={18} /> Settings
                </Button>
                <Button variant="ghost" className="justify-start gap-2" onClick={() => setShowExport(true)}>
                  <Download size={18} /> Export
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <a href="/" className="flex items-center text-xl md:text-2xl font-semibold transition-all hover:opacity-80">
            <Database className="h-6 w-6 mr-2 text-primary" />
            <span>DataWeave</span>
          </a>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm flex items-center gap-1 transition-all hover:bg-secondary"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm flex items-center gap-1 transition-all hover:bg-secondary"
            onClick={() => setShowExport(true)}
          >
            <Download size={16} />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onGeminiApiKeyChange={onGeminiApiKeyChange}
      />

      {/* Export Modal */}
      <ExportOptions 
        isOpen={showExport} 
        onClose={() => setShowExport(false)}
        schema={schema}
        sqlData={sqlData}
      />
    </div>
  );
};

export default Navbar;
