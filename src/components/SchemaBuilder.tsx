
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Key, Database, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Entity, Field, Schema, Relation, createNewEntity, createNewField } from "@/utils/schemaUtils";
import DiagramView from "./DiagramView";
import { toast } from "sonner";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface SchemaBuilderProps {
  schema: Schema;
  onSchemaChange: (schema: Schema) => void;
}

const SchemaBuilder = ({ schema, onSchemaChange }: SchemaBuilderProps) => {
  const [activeTab, setActiveTab] = useState("entities");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [editEntityName, setEditEntityName] = useState("");
  const [draggedPosition, setDraggedPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragEntityId, setDragEntityId] = useState<string | null>(null);
  const [useChenNotation, setUseChenNotation] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  // Get the selected entity from the schema
  const selectedEntity = schema.entities.find(entity => entity.id === selectedEntityId);

  // Add a new entity at the specified position
  const handleAddEntity = () => {
    const newEntity = createNewEntity(50, 50);
    onSchemaChange({
      ...schema,
      entities: [...schema.entities, newEntity]
    });
    setSelectedEntityId(newEntity.id);
    toast.success("Entity created");
  };

  // Remove an entity
  const handleRemoveEntity = (entityId: string) => {
    const newEntities = schema.entities.filter(entity => entity.id !== entityId);
    
    // Also remove any relations that involve this entity
    const newRelations = schema.relations.filter(
      relation => relation.sourceEntityId !== entityId && relation.targetEntityId !== entityId
    );
    
    onSchemaChange({
      entities: newEntities,
      relations: newRelations
    });
    
    if (selectedEntityId === entityId) {
      setSelectedEntityId(null);
    }
    
    toast.success("Entity removed");
  };

  // Begin entity name edit
  const startEditEntityName = (entityId: string) => {
    const entity = schema.entities.find(e => e.id === entityId);
    if (entity) {
      setEditEntityId(entityId);
      setEditEntityName(entity.name);
    }
  };

  // Save entity name edit
  const saveEntityName = () => {
    if (!editEntityId) return;
    
    onSchemaChange({
      ...schema,
      entities: schema.entities.map(entity => 
        entity.id === editEntityId ? { ...entity, name: editEntityName } : entity
      )
    });
    
    setEditEntityId(null);
    setEditEntityName("");
  };

  // Add a new field to the selected entity
  const handleAddField = () => {
    if (!selectedEntityId) return;
    
    const newField = createNewField(selectedEntityId);
    
    onSchemaChange({
      ...schema,
      entities: schema.entities.map(entity => 
        entity.id === selectedEntityId 
          ? { ...entity, fields: [...entity.fields, newField] } 
          : entity
      )
    });
    
    toast.success("Field added");
  };

  // Remove a field from an entity
  const handleRemoveField = (entityId: string, fieldId: string) => {
    // Check if this field is used in any relation
    const relatedRelations = schema.relations.filter(
      relation => 
        (relation.sourceEntityId === entityId && relation.sourceFieldId === fieldId) ||
        (relation.targetEntityId === entityId && relation.targetFieldId === fieldId)
    );
    
    if (relatedRelations.length > 0) {
      toast.error("Cannot remove field: it's used in a relationship");
      return;
    }
    
    onSchemaChange({
      ...schema,
      entities: schema.entities.map(entity => 
        entity.id === entityId 
          ? { ...entity, fields: entity.fields.filter(field => field.id !== fieldId) } 
          : entity
      )
    });
    
    toast.success("Field removed");
  };

  // Update field properties
  const updateField = (entityId: string, fieldId: string, updates: Partial<Field>) => {
    onSchemaChange({
      ...schema,
      entities: schema.entities.map(entity => 
        entity.id === entityId 
          ? { 
              ...entity, 
              fields: entity.fields.map(field => 
                field.id === fieldId 
                  ? { ...field, ...updates } 
                  : field
              ) 
            } 
          : entity
      )
    });
  };

  // Handle entity position change from diagram view
  const handleEntityPositionChange = (entityId: string, x: number, y: number) => {
    onSchemaChange({
      ...schema,
      entities: schema.entities.map(entity => 
        entity.id === entityId ? { ...entity, x, y } : entity
      )
    });
  };

  // Create a new relation
  const handleAddRelation = (sourceEntityId: string, sourceFieldId: string, targetEntityId: string, targetFieldId: string) => {
    const newRelation: Relation = {
      id: `relation_${Date.now()}`,
      sourceEntityId,
      sourceFieldId,
      targetEntityId,
      targetFieldId,
      relationType: 'one-to-many', // Default relation type
    };
    
    onSchemaChange({
      ...schema,
      relations: [...schema.relations, newRelation]
    });
    
    toast.success("Relation created");
  };

  // Remove a relation
  const handleRemoveRelation = (relationId: string) => {
    onSchemaChange({
      ...schema,
      relations: schema.relations.filter(relation => relation.id !== relationId)
    });
    
    toast.success("Relation removed");
  };

  // Handle relation type change
  const handleRelationTypeChange = (relationId: string, relationType: 'one-to-one' | 'one-to-many' | 'many-to-many') => {
    onSchemaChange({
      ...schema,
      relations: schema.relations.map(relation => 
        relation.id === relationId ? { ...relation, relationType } : relation
      )
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] mt-[60px] overflow-hidden animate-fade-in">
      <ResizablePanelGroup 
        direction="horizontal" 
        className="h-full"
      >
        {/* Entity Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background">
          <div className="h-full overflow-auto transition-all p-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="relations">Relations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="entities" className="mt-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Entities</h3>
                  <Button onClick={handleAddEntity} size="sm" className="h-8 px-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {schema.entities.map(entity => (
                    <Card 
                      key={entity.id} 
                      className={`entity-card cursor-pointer transition-all duration-200 ${selectedEntityId === entity.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedEntityId(entity.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Database className="h-4 w-4 mr-2 text-muted-foreground" />
                            {editEntityId === entity.id ? (
                              <Input 
                                value={editEntityName}
                                onChange={(e) => setEditEntityName(e.target.value)}
                                onBlur={saveEntityName}
                                onKeyDown={(e) => e.key === 'Enter' && saveEntityName()}
                                autoFocus
                                className="h-7 py-1 px-2 text-sm"
                              />
                            ) : (
                              <span className="font-medium">{entity.name}</span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditEntityName(entity.id);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:text-destructive/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEntity(entity.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          {entity.fields.length} {entity.fields.length === 1 ? 'field' : 'fields'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {schema.entities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No entities yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddEntity} 
                        className="mt-2"
                      >
                        Create Entity
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="relations" className="mt-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Relations</h3>
                </div>
                
                <div className="space-y-2">
                  {schema.relations.map(relation => {
                    const sourceEntity = schema.entities.find(e => e.id === relation.sourceEntityId);
                    const targetEntity = schema.entities.find(e => e.id === relation.targetEntityId);
                    const sourceField = sourceEntity?.fields.find(f => f.id === relation.sourceFieldId);
                    const targetField = targetEntity?.fields.find(f => f.id === relation.targetFieldId);
                    
                    if (!sourceEntity || !targetEntity || !sourceField || !targetField) {
                      return null;
                    }
                    
                    return (
                      <Card key={relation.id} className="entity-card">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="font-medium">Relation</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:text-destructive/90"
                              onClick={() => handleRemoveRelation(relation.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <div className="mt-3 text-sm">
                            <div className="flex justify-between mb-2">
                              <span className="text-muted-foreground">Type:</span>
                              <Select 
                                value={relation.relationType}
                                onValueChange={(value: any) => handleRelationTypeChange(relation.id, value)}
                              >
                                <SelectTrigger className="h-7 w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="one-to-one">One-to-One</SelectItem>
                                  <SelectItem value="one-to-many">One-to-Many</SelectItem>
                                  <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1 text-xs mt-2">
                              <div className="font-medium">{sourceEntity.name}</div>
                              <div className="text-center font-normal">{'->'}</div>
                              <div className="font-medium text-right">{targetEntity.name}</div>
                              
                              <div className="text-muted-foreground">{sourceField.name}</div>
                              <div className="text-center">references</div>
                              <div className="text-muted-foreground text-right">{targetField.name}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {schema.relations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No relations yet</p>
                      <p className="text-xs mt-1">Create relations by connecting fields in the diagram view</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={55} className="relative min-h-0">
          {/* Diagram View */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-end p-2 bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <Switch
                  id="chen-notation"
                  checked={useChenNotation}
                  onCheckedChange={setUseChenNotation}
                />
                <Label htmlFor="chen-notation" className="text-sm cursor-pointer">
                  Chen Notation
                </Label>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50">
              <DiagramView 
                schema={schema}
                selectedEntityId={selectedEntityId}
                onEntitySelect={setSelectedEntityId}
                onEntityPositionChange={handleEntityPositionChange}
                onAddRelation={handleAddRelation}
                useChenNotation={useChenNotation}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={25} minSize={20} className="bg-background">
          {/* Field Details */}
          <div className="h-full overflow-y-auto p-4">
            {selectedEntity ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Fields for {selectedEntity.name}</h3>
                  <Button onClick={handleAddField} size="sm" className="h-8 px-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {selectedEntity.fields.map(field => (
                    <Card key={field.id} className="border shadow-sm">
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor={`field-name-${field.id}`} className="text-xs">Name</Label>
                            <Input 
                              id={`field-name-${field.id}`}
                              value={field.name} 
                              onChange={(e) => updateField(selectedEntity.id, field.id, { name: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`field-type-${field.id}`} className="text-xs">Type</Label>
                            <Select 
                              value={field.type}
                              onValueChange={(value) => updateField(selectedEntity.id, field.id, { type: value })}
                            >
                              <SelectTrigger id={`field-type-${field.id}`} className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INTEGER">INTEGER</SelectItem>
                                <SelectItem value="VARCHAR">VARCHAR</SelectItem>
                                <SelectItem value="TEXT">TEXT</SelectItem>
                                <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                <SelectItem value="DATE">DATE</SelectItem>
                                <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                                <SelectItem value="FLOAT">FLOAT</SelectItem>
                                <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-2 flex justify-between items-center mt-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <Switch 
                                  id={`primary-key-${field.id}`}
                                  checked={field.isPrimaryKey}
                                  onCheckedChange={(checked) => updateField(selectedEntity.id, field.id, { isPrimaryKey: checked })}
                                />
                                <Label htmlFor={`primary-key-${field.id}`} className="text-xs cursor-pointer flex items-center">
                                  <Key className="h-3 w-3 mr-1" />
                                  Primary
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Switch 
                                  id={`nullable-${field.id}`}
                                  checked={!field.isNullable}
                                  onCheckedChange={(checked) => updateField(selectedEntity.id, field.id, { isNullable: !checked })}
                                />
                                <Label htmlFor={`nullable-${field.id}`} className="text-xs cursor-pointer">
                                  NOT NULL
                                </Label>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:text-destructive/90"
                              onClick={() => handleRemoveField(selectedEntity.id, field.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {selectedEntity.fields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No fields in this entity</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddField} 
                        className="mt-2"
                      >
                        Add Field
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Database className="h-12 w-12 mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-medium mb-2">No Entity Selected</h3>
                <p className="text-muted-foreground mb-4">Select an entity to view and edit its fields</p>
                {schema.entities.length === 0 && (
                  <Button onClick={handleAddEntity}>Create Entity</Button>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SchemaBuilder;
