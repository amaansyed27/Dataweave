// Schema data structure
export interface Field {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  defaultValue?: string;
}

export interface Entity {
  id: string;
  name: string;
  fields: Field[];
  x: number;
  y: number;
}

export interface Relation {
  id: string;
  name?: string;
  sourceEntityId: string;
  sourceFieldId: string;
  targetEntityId: string;
  targetFieldId: string;
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
}

export interface Schema {
  entities: Entity[];
  relations: Relation[];
}

// Helper functions
export const createNewEntity = (x: number, y: number): Entity => {
  const id = `entity_${Date.now()}`;
  return {
    id,
    name: 'New Entity',
    fields: [
      {
        id: `field_${Date.now()}`,
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        isNullable: false,
      },
    ],
    x,
    y,
  };
};

export const createNewField = (entityId: string): Field => {
  return {
    id: `field_${Date.now()}`,
    name: 'newField',
    type: 'VARCHAR',
    isPrimaryKey: false,
    isNullable: true,
  };
};

export const createNewRelation = (
  sourceEntityId: string,
  sourceFieldId: string,
  targetEntityId: string,
  targetFieldId: string,
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many'
): Relation => {
  return {
    id: `relation_${Date.now()}`,
    sourceEntityId,
    sourceFieldId,
    targetEntityId,
    targetFieldId,
    relationType,
  };
};

export const generateSQLSchema = (schema: Schema): string => {
  let sql = '';
  
  // Create tables first
  schema.entities.forEach(entity => {
    sql += `CREATE TABLE ${entity.name} (\n`;
    
    // Add fields
    const fieldDefinitions = entity.fields.map(field => {
      let definition = `  ${field.name} ${field.type}`;
      
      if (field.isPrimaryKey) {
        definition += ' PRIMARY KEY';
      }
      
      if (!field.isNullable) {
        definition += ' NOT NULL';
      }
      
      if (field.defaultValue !== undefined) {
        definition += ` DEFAULT ${field.defaultValue}`;
      }
      
      return definition;
    });
    
    sql += fieldDefinitions.join(',\n');
    sql += '\n);\n\n';
  });
  
  // Add foreign key constraints after all tables are created
  schema.relations.forEach(relation => {
    const sourceEntity = schema.entities.find(e => e.id === relation.sourceEntityId);
    const targetEntity = schema.entities.find(e => e.id === relation.targetEntityId);
    const sourceField = sourceEntity?.fields.find(f => f.id === relation.sourceFieldId);
    const targetField = targetEntity?.fields.find(f => f.id === relation.targetFieldId);
    
    if (sourceEntity && targetEntity && sourceField && targetField) {
      sql += `ALTER TABLE ${sourceEntity.name} ADD CONSTRAINT fk_${sourceEntity.name}_${targetEntity.name} `;
      sql += `FOREIGN KEY (${sourceField.name}) REFERENCES ${targetEntity.name}(${targetField.name});\n`;
    }
  });
  
  return sql;
};

export const generateSchemaJSON = (schema: Schema): string => {
  const jsonSchema = {
    entities: schema.entities.map(entity => ({
      name: entity.name,
      fields: entity.fields.map(field => ({
        name: field.name,
        type: field.type,
        isPrimaryKey: field.isPrimaryKey,
        isNullable: field.isNullable,
        defaultValue: field.defaultValue
      }))
    })),
    relations: schema.relations.map(relation => {
      const sourceEntity = schema.entities.find(e => e.id === relation.sourceEntityId);
      const targetEntity = schema.entities.find(e => e.id === relation.targetEntityId);
      const sourceField = sourceEntity?.fields.find(f => f.id === relation.sourceFieldId);
      const targetField = targetEntity?.fields.find(f => f.id === relation.targetFieldId);
      
      return {
        sourceEntity: sourceEntity?.name,
        sourceField: sourceField?.name,
        targetEntity: targetEntity?.name,
        targetField: targetField?.name,
        relationType: relation.relationType
      };
    })
  };
  
  return JSON.stringify(jsonSchema, null, 2);
};

export const schemaToNLPrompt = (schema: Schema): string => {
  let prompt = "Based on the following database schema:\n\n";
  
  schema.entities.forEach(entity => {
    prompt += `Table ${entity.name} with fields:\n`;
    entity.fields.forEach(field => {
      prompt += `- ${field.name} (${field.type})${field.isPrimaryKey ? ' PRIMARY KEY' : ''}${!field.isNullable ? ' NOT NULL' : ''}\n`;
    });
    prompt += '\n';
  });
  
  prompt += "Relations:\n";
  schema.relations.forEach(relation => {
    const sourceEntity = schema.entities.find(e => e.id === relation.sourceEntityId);
    const targetEntity = schema.entities.find(e => e.id === relation.targetEntityId);
    const sourceField = sourceEntity?.fields.find(f => f.id === relation.sourceFieldId);
    const targetField = targetEntity?.fields.find(f => f.id === relation.targetFieldId);
    
    if (sourceEntity && targetEntity && sourceField && targetField) {
      prompt += `- ${sourceEntity.name}.${sourceField.name} ${relation.relationType} ${targetEntity.name}.${targetField.name}\n`;
    }
  });
  
  return prompt;
};
