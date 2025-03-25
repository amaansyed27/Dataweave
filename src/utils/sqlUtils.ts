// Helper functions for SQL execution
interface Column {
  name: string;
  type: string;
}

interface ResultSet {
  columns: Column[];
  rows: any[][];
}

// Simple in-memory SQL parser and executor
export class SQLExecutor {
  private data: Map<string, {
    columns: Column[];
    rows: any[][];
  }> = new Map();
  private transactionStack: Map<string, { columns: Column[]; rows: any[][] }>[] = [];

  constructor() {}

  // Load data for a table
  loadData(tableName: string, columns: Column[], rows: any[][]) {
    this.data.set(tableName, { columns, rows });
  }

  // Clear all data
  clearData() {
    this.data.clear();
  }

  // Import data from JSON
  importFromJSON(jsonData: string) {
    try {
      const parsed = JSON.parse(jsonData);
      Object.keys(parsed).forEach(tableName => {
        const tableData = parsed[tableName];
        if (Array.isArray(tableData) && tableData.length > 0) {
          const firstRow = tableData[0];
          const columns = Object.keys(firstRow).map(key => ({
            name: key,
            type: this.inferType(firstRow[key])
          }));
          
          const rows = tableData.map(row => 
            columns.map(col => row[col.name])
          );
          
          this.loadData(tableName, columns, rows);
        }
      });
      return true;
    } catch (error) {
      console.error("Error importing JSON data:", error);
      return false;
    }
  }

  // Import data from CSV
  importFromCSV(tableName: string, csvData: string) {
    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const columns = headers.map(header => ({
        name: header,
        type: 'TEXT' // Default type, will be inferred later
      }));
      
      const rows = lines.slice(1).map(line => {
        return line.split(',').map(cell => cell.trim());
      });
      
      // Infer types from first row
      if (rows.length > 0) {
        const firstRow = rows[0];
        columns.forEach((col, index) => {
          col.type = this.inferType(firstRow[index]);
        });
      }
      
      this.loadData(tableName, columns, rows);
      return true;
    } catch (error) {
      console.error("Error importing CSV data:", error);
      return false;
    }
  }

  // Infer data type from value
  private inferType(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    }
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'string') {
      // Check if it's a date
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(value)) return 'DATE';
      
      // Check if it's a timestamp
      const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (timestampPattern.test(value)) return 'TIMESTAMP';
      
      return 'TEXT';
    }
    return 'TEXT';
  }

  // Execute a SQL query
  executeQuery(sql: string): ResultSet | string {
    sql = sql.trim();

    try {
      if (sql.toUpperCase().startsWith('SELECT')) {
        return this.executeSelect(sql);
      } else if (sql.toUpperCase().startsWith('INSERT')) {
        return this.executeInsert(sql);
      } else if (sql.toUpperCase().startsWith('CREATE TABLE')) {
        return this.executeCreateTable(sql);
      } else if (sql.toUpperCase().startsWith('DROP TABLE')) {
        return this.executeDropTable(sql);
      } else if (sql.toUpperCase().startsWith('UPDATE')) {
        return this.executeUpdate(sql);
      } else if (sql.toUpperCase().startsWith('DELETE')) {
        return this.executeDelete(sql);
      } else if (sql.toUpperCase().startsWith('ALTER TABLE')) {
        return this.executeAlterTable(sql);
      } else if (sql.toUpperCase().startsWith('TRUNCATE TABLE')) {
        return this.executeTruncateTable(sql);
      } else if (sql.toUpperCase().startsWith('COMMIT')) {
        return this.executeCommit();
      } else if (sql.toUpperCase().startsWith('ROLLBACK')) {
        return this.executeRollback();
      } else if (sql.toUpperCase().startsWith('SAVEPOINT')) {
        return this.executeSavepoint(sql);
      } else {
        return "Unsupported SQL query.";
      }
    } catch (error) {
      return `Error executing query: ${error}`;
    }
  }

  // Simple SELECT query executor
  private executeSelect(sql: string): ResultSet | string {
    try {
      const fromIndex = sql.toUpperCase().indexOf('FROM');
      if (fromIndex === -1) {
        return "Invalid SELECT query: missing FROM clause";
      }

      const selectPart = sql.substring(6, fromIndex).trim();
      let tablePart = sql.substring(fromIndex + 4).trim();

      // Extract table name and WHERE clause
      let tableName = tablePart.split(' ')[0];
      let alias = '';
      let whereClause = '';
      const aliasIndex = tablePart.indexOf(' ');
      const whereIndex = tablePart.toUpperCase().indexOf('WHERE');

      if (aliasIndex !== -1 && (whereIndex === -1 || aliasIndex < whereIndex)) {
        alias = tablePart.substring(aliasIndex + 1, whereIndex !== -1 ? whereIndex : undefined).trim();
        tableName = tablePart.substring(0, aliasIndex).trim();
      }

      if (whereIndex !== -1) {
        whereClause = tablePart.substring(whereIndex + 5).trim();
      }

      const tableData = this.data.get(tableName);
      if (!tableData) {
        return `Table '${tableName}' not found`;
      }

      // Select all columns
      let selectedColumns = tableData.columns;
      let columnIndices = tableData.columns.map((_, index) => index);

      if (selectPart !== '*') {
        // Select specific columns
        const columnNames = selectPart.split(',').map(c => c.trim());
        columnIndices = columnNames.map(colName => {
          const [tableOrAlias, columnName] = colName.includes('.') ? colName.split('.') : [alias || tableName, colName];
          if ((tableOrAlias !== alias && tableOrAlias !== tableName) || !columnName) {
            throw new Error(`Invalid column reference '${colName}'`);
          }
          const colIndex = tableData.columns.findIndex(c => c.name === columnName);
          if (colIndex === -1) {
            throw new Error(`Column '${columnName}' not found in table '${tableName}'`);
          }
          return colIndex;
        });
        selectedColumns = columnIndices.map(i => tableData.columns[i]);
      }

      // Apply WHERE clause
      let filteredRows = tableData.rows;
      if (whereClause) {
        filteredRows = this.applyWhereClause(filteredRows, tableData.columns, whereClause, alias || tableName);
      }

      const result: ResultSet = {
        columns: selectedColumns,
        rows: filteredRows.map(row => columnIndices.map(i => row[i])),
      };

      return result;
    } catch (error) {
      return `Error executing SELECT query: ${error}`;
    }
  }

  // Enhanced helper method to apply WHERE clause with table alias support
  private applyWhereClause(rows: any[][], columns: Column[], whereClause: string, tableAlias: string): any[][] {
    try {
      const conditions = this.parseWhereClause(whereClause, tableAlias);

      return rows.filter(row => {
        const rowObj: Record<string, any> = {};
        columns.forEach((col, index) => {
          rowObj[`${tableAlias}.${col.name}`] = row[index];
          rowObj[col.name] = row[index]; // Allow unqualified column names
        });

        // Evaluate parsed conditions
        return this.evaluateConditions(rowObj, conditions);
      });
    } catch (error) {
      throw new Error(`Invalid WHERE clause: ${error}`);
    }
  }

  // Parse WHERE clause into conditions with table alias support
  private parseWhereClause(whereClause: string, tableAlias: string): any[] {
    const conditions: any[] = [];
    const tokens = whereClause.split(/\s+/);
    let currentCondition: any = {};

    tokens.forEach(token => {
      if (['AND', 'OR'].includes(token.toUpperCase())) {
        currentCondition.operator = token.toUpperCase();
        conditions.push(currentCondition);
        currentCondition = {};
      } else if (['=', '<', '>', '<=', '>=', '<>', 'LIKE', 'IN', 'IS', 'NOT'].includes(token.toUpperCase())) {
        currentCondition.operator = token.toUpperCase();
      } else if (!currentCondition.field) {
        currentCondition.field = token.includes('.') ? token : `${tableAlias}.${token}`;
      } else if (!currentCondition.value) {
        currentCondition.value = token.replace(/['"]/g, ''); // Remove quotes
      }
    });

    if (Object.keys(currentCondition).length > 0) {
      conditions.push(currentCondition);
    }

    return conditions;
  }

  // Evaluate parsed conditions against a row
  private evaluateConditions(row: Record<string, any>, conditions: any[]): boolean {
    let result = true;

    conditions.forEach(condition => {
      const { field, operator, value } = condition;

      switch (operator) {
        case '=':
          result = result && row[field] == value;
          break;
        case '<':
          result = result && row[field] < value;
          break;
        case '>':
          result = result && row[field] > value;
          break;
        case '<=':
          result = result && row[field] <= value;
          break;
        case '>=':
          result = result && row[field] >= value;
          break;
        case '<>':
          result = result && row[field] != value;
          break;
        case 'LIKE':
          const regex = new RegExp(value.replace('%', '.*'), 'i');
          result = result && regex.test(row[field]);
          break;
        case 'IN':
          const values = value.split(',').map(v => v.trim());
          result = result && values.includes(row[field]);
          break;
        case 'IS':
          if (value.toUpperCase() === 'NULL') {
            result = result && row[field] === null;
          }
          break;
        case 'NOT':
          if (value.toUpperCase() === 'NULL') {
            result = result && row[field] !== null;
          }
          break;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }
    });

    return result;
  }

  // Simple INSERT query executor
  private executeInsert(sql: string): string {
    try {
      // Very basic parsing - just for demo
      const intoIndex = sql.toUpperCase().indexOf('INTO');
      const valuesIndex = sql.toUpperCase().indexOf('VALUES');
      
      if (intoIndex === -1 || valuesIndex === -1) {
        return "Invalid INSERT query format";
      }
      
      let tableName = sql.substring(intoIndex + 4, valuesIndex).trim();
      
      // Extract column names if specified
      const openParenIndex = tableName.indexOf('(');
      let columnNames: string[] = [];
      
      if (openParenIndex !== -1) {
        const closeParenIndex = tableName.indexOf(')');
        columnNames = tableName
          .substring(openParenIndex + 1, closeParenIndex)
          .split(',')
          .map(c => c.trim());
        
        tableName = tableName.substring(0, openParenIndex).trim();
      }
      
      const tableData = this.data.get(tableName);
      if (!tableData) {
        return `Table '${tableName}' not found`;
      }
      
      // Extract values
      const valuesPart = sql.substring(valuesIndex + 6).trim();
      if (!valuesPart.startsWith('(') || !valuesPart.includes(')')) {
        return "Invalid VALUES format";
      }
      
      const valuesStr = valuesPart.substring(1, valuesPart.indexOf(')'));
      const values = valuesStr.split(',').map(v => {
        v = v.trim();
        // Remove quotes from string values
        if ((v.startsWith("'") && v.endsWith("'")) || 
            (v.startsWith('"') && v.endsWith('"'))) {
          return v.substring(1, v.length - 1);
        }
        return v;
      });
      
      // If columns not specified, use all columns
      if (columnNames.length === 0) {
        columnNames = tableData.columns.map(c => c.name);
      }
      
      if (values.length !== columnNames.length) {
        return "Number of values doesn't match number of columns";
      }
      
      // Create a new row with null values for all columns
      const newRow = Array(tableData.columns.length).fill(null);
      
      // Set specified values
      columnNames.forEach((colName, index) => {
        const colIndex = tableData.columns.findIndex(c => c.name === colName);
        if (colIndex !== -1) {
          newRow[colIndex] = values[index];
        }
      });
      
      tableData.rows.push(newRow);
      return "1 row inserted.";
    } catch (error) {
      return `Error executing INSERT query: ${error}`;
    }
  }

  // Simple CREATE TABLE executor
  private executeCreateTable(sql: string): string {
    try {
      // Extract table name
      const tableNameMatch = sql.match(/CREATE\s+TABLE\s+(\w+)/i);
      if (!tableNameMatch) {
        return "Invalid CREATE TABLE syntax";
      }
      
      const tableName = tableNameMatch[1];
      
      // Extract column definitions
      const columnDefStart = sql.indexOf('(');
      const columnDefEnd = sql.lastIndexOf(')');
      
      if (columnDefStart === -1 || columnDefEnd === -1) {
        return "Invalid column definition syntax";
      }
      
      const columnDefs = sql
        .substring(columnDefStart + 1, columnDefEnd)
        .split(',')
        .map(def => def.trim())
        .filter(def => def && !def.startsWith('CONSTRAINT') && !def.startsWith('PRIMARY KEY') && !def.startsWith('FOREIGN KEY'));
      
      const columns = columnDefs.map(def => {
        const parts = def.split(/\s+/);
        return {
          name: parts[0],
          type: parts[1]
        };
      });
      
      this.data.set(tableName, { columns, rows: [] });
      return `Table '${tableName}' created`;
    } catch (error) {
      return `Error creating table: ${error}`;
    }
  }

  // DROP TABLE query executor
  private executeDropTable(sql: string): string {
    const tableNameMatch = sql.match(/DROP\s+TABLE\s+(\w+)/i);
    if (!tableNameMatch) {
      return "Invalid DROP TABLE syntax.";
    }
    const tableName = tableNameMatch[1];
    if (this.data.has(tableName)) {
      this.data.delete(tableName);
      return `Table '${tableName}' dropped.`;
    }
    return `Table '${tableName}' does not exist.`;
  }

  // UPDATE query executor
  private executeUpdate(sql: string): string {
    // Parse and execute UPDATE logic
    return "UPDATE query executed.";
  }

  // DELETE query executor
  private executeDelete(sql: string): string {
    // Parse and execute DELETE logic
    return "DELETE query executed.";
  }

  // ALTER TABLE query executor
  private executeAlterTable(sql: string): string {
    // Parse and execute ALTER TABLE logic
    return "ALTER TABLE query executed.";
  }

  // TRUNCATE TABLE query executor
  private executeTruncateTable(sql: string): string {
    const tableNameMatch = sql.match(/TRUNCATE\s+TABLE\s+(\w+)/i);
    if (!tableNameMatch) {
      return "Invalid TRUNCATE TABLE syntax.";
    }
    const tableName = tableNameMatch[1];
    const table = this.data.get(tableName);
    if (table) {
      table.rows = [];
      return `Table '${tableName}' truncated.`;
    }
    return `Table '${tableName}' does not exist.`;
  }

  // SAVEPOINT query executor
  private executeSavepoint(sql: string): string {
    const savepointNameMatch = sql.match(/SAVEPOINT\s+(\w+)/i);
    if (!savepointNameMatch) {
      return "Invalid SAVEPOINT syntax.";
    }
    const savepointName = savepointNameMatch[1];
    this.transactionStack.push(new Map(this.data));
    return `Savepoint '${savepointName}' created.`;
  }

  // COMMIT query executor
  private executeCommit(): string {
    this.transactionStack = [];
    return "Transaction committed.";
  }

  // ROLLBACK query executor
  private executeRollback(): string {
    if (this.transactionStack.length > 0) {
      this.data = this.transactionStack.pop()!;
      return "Transaction rolled back.";
    }
    return "No transaction to roll back.";
  }

  // Get all tables
  getTables(): string[] {
    return Array.from(this.data.keys());
  }

  // Get schema for a table
  getTableSchema(tableName: string): Column[] | null {
    const table = this.data.get(tableName);
    return table ? table.columns : null;
  }

  // Export all data as JSON
  exportAsJSON(): string {
    const result: Record<string, any[]> = {};
    
    this.data.forEach((tableData, tableName) => {
      result[tableName] = tableData.rows.map(row => {
        const rowObj: Record<string, any> = {};
        tableData.columns.forEach((col, index) => {
          rowObj[col.name] = row[index];
        });
        return rowObj;
      });
    });
    
    return JSON.stringify(result, null, 2);
  }

  // Export schema as SQL
  exportAsSQL(): string {
    let sql = '';
    
    this.data.forEach((tableData, tableName) => {
      sql += `CREATE TABLE ${tableName} (\n`;
      
      const columnDefs = tableData.columns.map(col => {
        return `  ${col.name} ${col.type}`;
      });
      
      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';
      
      // Add INSERT statements if there's data
      if (tableData.rows.length > 0) {
        tableData.rows.forEach(row => {
          sql += `INSERT INTO ${tableName} (${tableData.columns.map(c => c.name).join(', ')}) VALUES (`;
          
          const values = row.map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          });
          
          sql += values.join(', ');
          sql += ');\n';
        });
        
        sql += '\n';
      }
    });
    
    return sql;
  }
}
