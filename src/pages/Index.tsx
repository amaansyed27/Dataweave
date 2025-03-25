import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Code, Table } from "lucide-react";
import Navbar from "@/components/Navbar";
import SchemaBuilder from "@/components/SchemaBuilder";
import DataManager from "@/components/DataManager";
import QueryExecutor from "@/components/QueryExecutor";
import { Schema, generateSQLSchema } from "@/utils/schemaUtils";
import { SQLExecutor } from "@/utils/sqlUtils";

const Index = () => {
  // Example schema
  const exampleSchema: Schema = {
    entities: [
      {
        id: "student",
        name: "student",
        fields: [
          { id: "id", name: "id", type: "INTEGER", isPrimaryKey: true, isNullable: false },
          { id: "name", name: "name", type: "VARCHAR", isPrimaryKey: false, isNullable: false },
          { id: "course_id", name: "course_id", type: "INTEGER", isPrimaryKey: false, isNullable: false },
        ],
        x: 100,
        y: 100,
      },
      {
        id: "course",
        name: "course",
        fields: [
          { id: "id", name: "id", type: "INTEGER", isPrimaryKey: true, isNullable: false },
          { id: "title", name: "title", type: "VARCHAR", isPrimaryKey: false, isNullable: false },
          { id: "faculty_id", name: "faculty_id", type: "INTEGER", isPrimaryKey: false, isNullable: false },
        ],
        x: 300,
        y: 100,
      },
      {
        id: "faculty",
        name: "faculty",
        fields: [
          { id: "id", name: "id", type: "INTEGER", isPrimaryKey: true, isNullable: false },
          { id: "name", name: "name", type: "VARCHAR", isPrimaryKey: false, isNullable: false },
          { id: "department", name: "department", type: "VARCHAR", isPrimaryKey: false, isNullable: true },
        ],
        x: 500,
        y: 100,
      },
    ],
    relations: [
      {
        id: "relation_student_course",
        sourceEntityId: "student",
        sourceFieldId: "course_id",
        targetEntityId: "course",
        targetFieldId: "id",
        relationType: "many-to-one",
      },
      {
        id: "relation_course_faculty",
        sourceEntityId: "course",
        sourceFieldId: "faculty_id",
        targetEntityId: "faculty",
        targetFieldId: "id",
        relationType: "many-to-one",
      },
    ],
  };

  // Example data
  const exampleData = {
    student: [
      { id: 1, name: "Alice", course_id: 1 },
      { id: 2, name: "Bob", course_id: 2 },
    ],
    course: [
      { id: 1, title: "Math 101", faculty_id: 1 },
      { id: 2, title: "History 201", faculty_id: 2 },
    ],
    faculty: [
      { id: 1, name: "Dr. Smith", department: "Mathematics" },
      { id: 2, name: "Dr. Johnson", department: "History" },
    ],
  };

  const [schema, setSchema] = useState<Schema>(exampleSchema);
  const [sqlExecutor] = useState(() => new SQLExecutor());
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('schema');

  // Load example data into SQLExecutor
  useEffect(() => {
    Object.keys(exampleData).forEach((tableName) => {
      const entity = exampleSchema.entities.find((e) => e.name === tableName);
      if (entity) {
        const columns = entity.fields.map((field) => ({
          name: field.name,
          type: field.type,
        }));
        const rows = exampleData[tableName].map((row) =>
          columns.map((col) => row[col.name] ?? null)
        );
        sqlExecutor.loadData(tableName, columns, rows);
      }
    });
  }, [sqlExecutor]);

  // Load gemini api key from local storage
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('gemini-api-key');
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }
  }, []);
  
  // Handle schema changes
  const handleSchemaChange = (newSchema: Schema) => {
    setSchema(newSchema);
  };
  
  // Import data for a table
  const handleImportData = (tableName: string, data: any[]) => {
    if (!data || data.length === 0) return;
    
    const entity = schema.entities.find(e => e.name === tableName);
    if (!entity) return;
    
    // Extract column information
    const columns = entity.fields.map(field => ({
      name: field.name,
      type: field.type
    }));
    
    // Convert data objects to rows
    const rows = data.map(item => {
      return columns.map(col => item[col.name] ?? null);
    });
    
    // Load data into SQL executor
    sqlExecutor.loadData(tableName, columns, rows);
  };
  
  // Generate SQL for export
  const generateSqlData = (): string => {
    const schemaSql = generateSQLSchema(schema);
    const dataSql = sqlExecutor.exportAsSQL();
    return schemaSql + '\n\n' + dataSql;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        schema={schema} 
        sqlData={generateSqlData()} 
        onGeminiApiKeyChange={(key) => setGeminiApiKey(key)}
      />
      
      <main className="animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 border-b bg-white sticky top-[60px] z-10">
            <TabsList className="w-full justify-start border-b border-muted bg-transparent h-auto py-2 gap-4 flex">
              <TabsTrigger 
                value="schema" 
                className="flex items-center gap-1 px-4 py-2 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus:outline-none"
              >
                <Database className="h-4 w-4" />
                <span>Schema</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="flex items-center gap-1 px-4 py-2 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus:outline-none"
              >
                <Table className="h-4 w-4" />
                <span>Data</span>
              </TabsTrigger>
              <TabsTrigger 
                value="query" 
                className="flex items-center gap-1 px-4 py-2 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus:outline-none"
              >
                <Code className="h-4 w-4" />
                <span>Query</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="schema" className="m-0">
            <SchemaBuilder schema={schema} onSchemaChange={handleSchemaChange} />
          </TabsContent>
          
          <TabsContent value="data" className="m-0">
            <DataManager 
              schema={schema} 
              onImportData={handleImportData} 
              sqlExecutor={sqlExecutor}
            />
          </TabsContent>
          
          <TabsContent value="query" className="m-0">
            <QueryExecutor 
              schema={schema} 
              sqlExecutor={sqlExecutor} 
              geminiApiKey={geminiApiKey}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
