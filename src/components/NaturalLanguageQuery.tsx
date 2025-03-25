import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Schema, schemaToNLPrompt } from '@/utils/schemaUtils';

interface NaturalLanguageQueryProps {
  schema: Schema;
  geminiApiKey: string;
  onSqlGenerated: (sql: string) => void;
}

const NaturalLanguageQuery = ({ schema, geminiApiKey, onSqlGenerated }: NaturalLanguageQueryProps) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'query' | 'explain'>('query'); // Add mode state

  const handleQueryGeneration = async () => {
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (!geminiApiKey) {
      toast.error('Please set your Gemini API key in Settings');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert schema to JSON
      const schemaJson = JSON.stringify(schema);
      
      // Prepare the prompt based on the mode
      const prompt =
        mode === 'query'
          ? `Schema (JSON):\n${schemaJson}\n\nConvert the following natural language query into SQL:\n"${query}"\n\nOnly return the SQL code, nothing else.`
          : `Schema (JSON):\n${schemaJson}\n\nExplain the schema in plain English.`;
      
      // Call Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          prompt,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      if (mode === 'query') {
        // Extract the SQL code
        const generatedSql = data.candidates?.[0]?.content?.trim();
        if (generatedSql) {
          onSqlGenerated(generatedSql);
          toast.success('SQL query generated');
        } else {
          throw new Error('No SQL generated');
        }
      } else {
        // Display the schema explanation
        const explanation = data.candidates?.[0]?.content?.trim();
        if (explanation) {
          toast.success('Schema explanation generated');
          console.log('Schema Explanation:', explanation);
        } else {
          throw new Error('No explanation generated');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed to process: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Natural Language Query</h3>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={mode === 'query' ? 'default' : 'outline'}
            onClick={() => setMode('query')}
          >
            Query Mode
          </Button>
          <Button
            variant={mode === 'explain' ? 'default' : 'outline'}
            onClick={() => setMode('explain')}
          >
            Explain Schema
          </Button>
        </div>

        <div>
          <Textarea
            placeholder={mode === 'query' ? "Ask a question in plain English..." : "Request an explanation of the schema..."}
            className="min-h-[100px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'query'
              ? 'Example: "Show me all customers who made a purchase last month"'
              : 'Example: "Explain the schema in detail"'}
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleQueryGeneration} 
            disabled={isLoading || !geminiApiKey}
            className="flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{mode === 'query' ? 'Generate SQL' : 'Explain Schema'}</span>
              </>
            )}
          </Button>
        </div>
        
        {!geminiApiKey && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            Please add your Gemini API key in Settings to use this feature
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageQuery;
