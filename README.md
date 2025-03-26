# Dataweave

Visit the live application at [dataweave.vercel.app](https://dataweave-ai.vercel.app).

Dataweave is a web-based tool designed to help developers and database architects visually design, manage, and interact with database schemas. It provides an intuitive interface for creating entities, defining relationships, and managing data, all while generating SQL scripts for easy integration into your projects.

## Project Info

- **Repository**: [GitHub Repository](https://github.com/amaansyed27/Dataweave/)

## Features

- **Schema Builder**: Drag-and-drop interface to create entities, define fields, and establish relationships.
- **Data Manager**: Import, export, and manage data for your entities using manual entry, JSON, or file uploads.
- **Query Executor**: Run SQL queries directly on your schema and view the results in real-time.
- **SQL Export**: Generate SQL scripts for schema and data, ready to be used in your database.

## How to Use

### 1. Schema Builder

- Navigate to the "Schema" tab.
- Use the "Add" button to create new entities.
- Click on an entity to edit its fields or relationships.
- Drag entities in the diagram view to reposition them.
- Toggle "Chen Notation" for a different visual representation.

### 2. Data Manager

- Navigate to the "Data" tab.
- Select an entity from the dropdown to manage its data.
- Use the "Manual Entry" tab to add data row by row.
- Use the "JSON" tab to import data in JSON format.
- Use the "File Upload" tab to import data from CSV or JSON files.

### 3. Query Executor

- Navigate to the "Query" tab.
- Write SQL queries in the "SQL Query" tab and execute them.
- Use the "Natural Language" tab to ask questions in plain English.
- View query results in the results section.

### 4. Export Options

- Use the export button in the navigation bar to download the schema and data as SQL or JSON files.

## Technologies Used

### **Vite**

- Fast build tool optimized for modern web development.
- Provides instant server start, lightning-fast HMR (Hot Module Replacement), and optimized builds.

### **TypeScript**

- Strongly typed superset of JavaScript that compiles to plain JavaScript.
- Ensures type safety, improves developer productivity, and reduces runtime errors.

### **React**

- Popular JavaScript library for building user interfaces.
- Enables the creation of reusable components and efficient rendering using a virtual DOM.

### **shadcn-ui**

- Collection of accessible and customizable UI components styled using Tailwind CSS.
- Components are located in the `src/components/ui` folder.

### **Tailwind CSS**

- Utility-first CSS framework for rapidly building custom designs.
- Offers a highly customizable and responsive design system with minimal CSS overhead.

### **Sonner**

- Lightweight toast notification library.
- Used for displaying success, error, and informational messages throughout the application.

### **Lucide Icons**

- Collection of beautiful and customizable SVG-based icons.
- Used for adding visual elements like buttons, tabs, and entity representations.

### **Radix UI**

- Library of unstyled, accessible components for building high-quality user interfaces.
- Used for components like dropdown menus, dialogs, and tabs.

### **SQL.js**

- JavaScript library that runs SQLite in the browser.
- Enables the execution of SQL queries directly in the browser for a seamless database experience.

### **Vercel**

- Cloud platform for deploying and hosting web applications.
- Provides fast and reliable hosting with built-in CI/CD and custom domain support.

### **Gemini API**

- Generative AI API provided by Google.
- Used to convert natural language queries into SQL statements and to explain database schemas in plain English.
- Requires an API key, which can be configured in the application settings.

## Components from shadcn-ui

The following components from [shadcn-ui](https://shadcn.dev/) are used in this project. Components are located in the `src/components/ui` folder:

- **Accordion**: Used for collapsible sections in forms or settings.
- **Alert**: Used to display alert messages.
- **Avatar**: Used to display user avatars.
- **Button**: Used for various actions like adding entities, saving data, and more.
- **Card**: Used to display entities, fields, and relations in a structured format.
- **Dialog**: Used for modals and popups.
- **Dropdown Menu**: Used for dropdown menus in the UI.
- **Input**: Used for text input fields, such as entity names and field properties.
- **Label**: Used to label form inputs and switches.
- **Select**: Used for dropdown menus, such as selecting field types or relation types.
- **Switch**: Used for toggling options like "Chen Notation" or "Primary Key".
- **Tabs**: Used to organize content into tabs (e.g., Schema, Data, Query).
- **Textarea**: Used for multi-line text input, such as JSON data entry.

## File Structure

```
Dataweave/
├── src/
│   ├── components/
│   │   ├── DataManager.tsx
│   │   ├── DataTable.tsx
│   │   ├── DiagramView.tsx
│   │   ├── ExportOptions.tsx
│   │   ├── FileUploader.tsx
│   │   ├── Navbar.tsx
│   │   ├── QueryExecutor.tsx
│   │   ├── SchemaBuilder.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── textarea.tsx
│   ├── hooks/
│   │   ├── useIsMobile.tsx
│   │   └── useToast.tsx
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── utils/
│   │   ├── schemaUtils.ts
│   │   └── sqlUtils.ts
│   └── index.css
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── .gitignore
```
### **src/components**
This folder contains the core React components used in the application:

- **SchemaBuilder.tsx**:  
Provides the main interface for creating and managing database schemas. Includes features like adding/removing entities, editing fields, and managing relationships. Integrates with the `DiagramView` for visual schema representation.

- **DataManager.tsx**:  
Handles data management for entities. Allows users to manually enter data, import JSON or CSV files, and view existing data in a table format.

- **QueryExecutor.tsx**:  
Provides an interface for executing SQL queries and natural language queries. Integrates with the Gemini API to convert natural language queries into SQL.

- **NaturalLanguageQuery.tsx**:  
A sub-component used for handling natural language queries. Allows users to ask questions in plain English and converts them into SQL using the Gemini API.

- **Navbar.tsx**:  
The top navigation bar for the application. Includes links to settings, export options, and other key actions.

- **ExportOptions.tsx**:  
Provides options for exporting the schema and data in SQL or JSON format. Includes features for copying to clipboard and downloading files.

- **Settings.tsx**:  
A modal for configuring application settings, such as the Gemini API key.

- **DiagramView.tsx**:  
A visual representation of the schema. Displays entities and their relationships in a drag-and-drop interface.

- **QueryResultTable.tsx**:  
Displays the results of executed SQL queries in a tabular format.

- **FileUploader.tsx**:  
A utility component for uploading files (e.g., JSON, CSV) to import data into the application.

- **DataTable.tsx**:  
A table component for manually entering and editing data for entities.

### **src/hooks**
This folder contains custom React hooks:

- **useIsMobile.tsx**:  
A custom hook to determine if the current viewport width is below the mobile breakpoint (768px). Useful for rendering mobile-specific UI components or layouts.

- **useToast.ts**:  
A custom hook for managing toast notifications. Provides methods to display, update, and dismiss toast messages. Includes a queue system to limit the number of active toasts.

### **src/libs**
This folder contains third-party integrations and utilities:

- **utils.ts**:  
A collection of utility functions for common operations like formatting strings, generating unique IDs, and more.

### **src/pages**
This folder contains the main pages of the application:

- **Index.tsx**:  
The main entry point for the application. Manages the overall layout and tabs for schema building, data management, and query execution. Includes example schema and data loading logic.

- **NotFound.tsx**:  
A 404 error page displayed when the user navigates to a non-existent route. Includes a button to return to the main application.

### **src/utils**
This folder contains utility functions and classes:

- **schemaUtils.ts**:  
Provides functions for managing schemas, such as creating entities, fields, and relationships. Also includes utilities for converting schemas to SQL or JSON.

- **sqlUtils.ts**:  
Contains the `SQLExecutor` class, which provides methods for executing SQL queries, importing data, and exporting data as SQL scripts.

## Summary

Dataweave is a powerful and intuitive database schema design tool that simplifies entity management, relationships, and data interactions. It integrates AI-powered SQL generation and supports various export formats, making it an essential tool for database architects and developers. Try it out at [dataweave.vercel.app](https://dataweave.vercel.app).
