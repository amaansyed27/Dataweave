
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Play, Code, Sparkles, Loader2 } from "lucide-react";
import { SQLExecutor } from '@/utils/sqlUtils';
import { Schema, schemaToNLPrompt } from '@/utils/schemaUtils';
import QueryResultTable from './QueryResultTable';

interface QueryExecutorProps {
  schema: Schema;
  sqlExecutor: SQLExecutor;
  geminiApiKey: string;
}

interface ResultSet {
  columns: { name: string; type: string }[];
  rows: any[][];
}

const QueryExecutor = ({ schema, sqlExecutor, geminiApiKey }: QueryExecutorProps) => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [queryResult, setQueryResult] = useState<ResultSet | string | null>(null);
  const [activeTab, setActiveTab] = useState('sql');
  const [isLoading, setIsLoading] = useState(false);

  const executeSqlQuery = () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }
    
    try {
      const result = sqlExecutor.executeQuery(sqlQuery);
      setQueryResult(result);
    } catch (error) {
      setQueryResult(`Error: ${error}`);
      toast.error('Failed to execute query');
    }
  };

  const executeNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery.trim()) {
      toast.error('Please enter a natural language query');
      return;
    }
    
    if (!geminiApiKey) {
      toast.error('Please set your Gemini API key in Settings');
      return;
    }
    
    setIsLoading(true);
    setQueryResult(null);
    
    try {
      // Generate schema description for the AI
      const schemaPrompt = schemaToNLPrompt(schema);
      
      // Prepare the prompt for Gemini API
      const prompt = `${schemaPrompt}\n\nConvert the following natural language query into SQL:\n"${naturalLanguageQuery}"\n\nOnly return the SQL code, nothing else.`;
      
      // Call Gemini API with the updated model
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
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
      
      // Extract the SQL code from the response
      let generatedSql = '';
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        generatedSql = data.candidates[0].content.parts[0].text;
        
        // Clean the generated SQL - remove markdown code blocks if present
        generatedSql = generatedSql.replace(/```sql/g, '').replace(/```/g, '').trim();
      }
      
      // Update the SQL query tab
      setSqlQuery(generatedSql);
      setActiveTab('sql');
      
      // Execute the generated SQL
      try {
        const result = sqlExecutor.executeQuery(generatedSql);
        setQueryResult(result);
      } catch (error) {
        setQueryResult(`Error executing the generated SQL: ${error}`);
      }
    } catch (error) {
      toast.error(`Failed to generate SQL: ${error}`);
      setQueryResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderQueryResult = () => {
    if (!queryResult) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Execute a query to see results</p>
        </div>
      );
    }
    
    if (typeof queryResult === 'string') {
      return (
        <div className="p-4 border rounded-lg bg-muted/30">
          <p>{queryResult}</p>
        </div>
      );
    }
    
    return (
      <QueryResultTable columns={queryResult.columns} rows={queryResult.rows} />
    );
  };

  return (
    <div className="p-4 animate-fade-in">
      <h3 className="text-lg font-medium mb-4">Query Executor</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="sql" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span>SQL Query</span>
          </TabsTrigger>
          <TabsTrigger value="nl" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span>Natural Language</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sql">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Textarea
                  placeholder="Enter your SQL query here..."
                  className="font-mono min-h-[120px]"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: SELECT * FROM users
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={executeSqlQuery} className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  <span>Execute</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nl">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Textarea
                  placeholder="Ask a question in plain English..."
                  className="min-h-[120px]"
                  value={naturalLanguageQuery}
                  onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: Show me all users who joined after January 2023
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={executeNaturalLanguageQuery} 
                  disabled={isLoading || !geminiApiKey}
                  className="flex items-center gap-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate & Execute</span>
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
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Results</h4>
        {renderQueryResult()}
      </div>
    </div>
  );
};

export default QueryExecutor;
