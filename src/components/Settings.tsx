
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles, Key } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onGeminiApiKeyChange: (key: string) => void;
}

const Settings = ({ isOpen, onClose, onGeminiApiKeyChange }: SettingsProps) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('api-keys');

  useEffect(() => {
    // Load API key from localStorage if available
    const savedGeminiKey = localStorage.getItem('gemini-api-key');
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    // Save Gemini API key to localStorage
    localStorage.setItem('gemini-api-key', geminiApiKey);
    onGeminiApiKeyChange(geminiApiKey);
    toast.success('API key saved');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your DataWeave application settings
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Gemini API Key</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">
                  Gemini API Key (for natural language queries)
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="gemini-api-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <Button onClick={handleSaveApiKey}>Save</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your Gemini API key from{" "}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </Card>
            
            <div className="bg-muted/30 p-3 rounded-lg border text-sm">
              <p className="text-muted-foreground">
                API keys are stored locally in your browser and are not sent to any server.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
