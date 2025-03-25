
import { useState, useRef, useEffect } from 'react'; 
import { Schema, Entity, Relation } from '@/utils/schemaUtils';
import { toast } from "sonner";
import { Key, ZoomIn, ZoomOut } from "lucide-react"; // Import ZoomIn and ZoomOut icons
import { Button } from '@/components/ui/button'; // Import Button component

interface DiagramViewProps {
  schema: Schema;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityPositionChange: (entityId: string, x: number, y: number) => void;
  onAddRelation: (sourceEntityId: string, sourceFieldId: string, targetEntityId: string, targetFieldId: string) => void;
  useChenNotation?: boolean;
}

const DiagramView = ({ 
  schema, 
  selectedEntityId, 
  onEntitySelect, 
  onEntityPositionChange, 
  onAddRelation,
  useChenNotation = false
}: DiagramViewProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{
    sourceEntityId: string;
    sourceFieldId: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
  } | null>(null);
  const [dragInfo, setDragInfo] = useState<{
    entityId: string;
    startMouseX: number;
    startMouseY: number;
    startEntityX: number;
    startEntityY: number;
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle zooming
  const handleZoom = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prevZoom => Math.max(0.5, Math.min(2, prevZoom + delta)));
  };

  // Zoom in button handler
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(2, prevZoom + 0.1));
  };

  // Zoom out button handler
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(0.5, prevZoom - 0.1));
  };
  
  // Set up zoom event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleZoom, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleZoom);
      };
    }
  }, []);
  
  // Handle container mouse down for panning
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // Only start panning if no entity is being dragged and not creating a connection
    if (!dragInfo && !connecting && e.button === 0 && e.target === containerRef.current) {
      const startX = e.clientX;
      const startY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;
      
      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setPan({
          x: startPanX + dx,
          y: startPanY + dy
        });
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
  // Handle entity drag start
  const handleEntityMouseDown = (e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    if (e.button === 0) { // Left click
      const entity = schema.entities.find(entity => entity.id === entityId);
      if (entity) {
        setDragInfo({
          entityId,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startEntityX: entity.x,
          startEntityY: entity.y
        });
        
        onEntitySelect(entityId);
      }
    }
  };
  
  // Handle entity dragging
  useEffect(() => {
    if (dragInfo) {
      const handleMouseMove = (e: MouseEvent) => {
        if (dragInfo) {
          const dx = (e.clientX - dragInfo.startMouseX) / zoom;
          const dy = (e.clientY - dragInfo.startMouseY) / zoom;
          
          // Find entity in schema
          const entity = schema.entities.find(entity => entity.id === dragInfo.entityId);
          if (entity) {
            // Update entity coordinates (but just visually, not in schema)
            const x = dragInfo.startEntityX + dx;
            const y = dragInfo.startEntityY + dy;
            
            // Update entity element position
            const entityElement = document.getElementById(`entity-${dragInfo.entityId}`);
            if (entityElement) {
              entityElement.style.transform = `translate(${x}px, ${y}px)`;
            }
          }
        }
      };
      
      const handleMouseUp = (event: MouseEvent) => {
        if (dragInfo) {
          const entity = schema.entities.find(entity => entity.id === dragInfo.entityId);
          if (entity) {
            const dx = (event.clientX - dragInfo.startMouseX) / zoom;
            const dy = (event.clientY - dragInfo.startMouseY) / zoom;
            
            const newX = dragInfo.startEntityX + dx;
            const newY = dragInfo.startEntityY + dy;
            
            // Actually update schema with new coordinates
            onEntityPositionChange(dragInfo.entityId, newX, newY);
          }
        }
        setDragInfo(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragInfo, onEntityPositionChange, zoom, pan]);

  // Field connection handlers - FIXED CONNECTION FUNCTIONALITY
  const handleFieldConnectStart = (e: React.MouseEvent, entityId: string, fieldId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Use client coordinates for accurate connection line display
    setConnecting({
      sourceEntityId: entityId,
      sourceFieldId: fieldId,
      sourceX: rect.right,
      sourceY: rect.top + rect.height / 2,
      targetX: e.clientX,
      targetY: e.clientY
    });
    
    console.log("Started connection from entity:", entityId, "field:", fieldId);
    
    // Add global mouse move and up handlers that will work outside entity boundaries
    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUpGlobal);
  };

  // Handle global mouse move for connection line drawing
  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (connecting) {
      setConnecting({
        ...connecting,
        targetX: e.clientX,
        targetY: e.clientY
      });
    }
  };

  const handleMouseUpGlobal = (e: MouseEvent) => {
    if (!connecting) return;
    
    document.removeEventListener('mousemove', handleMouseMoveGlobal);
    document.removeEventListener('mouseup', handleMouseUpGlobal);
    
    // Find if we're over a field connection point
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const fieldConnector = elements.find(el => el.classList.contains('field-connector'));
    
    if (fieldConnector) {
      const targetEntityId = fieldConnector.getAttribute('data-entity-id');
      const targetFieldId = fieldConnector.getAttribute('data-field-id');
      
      if (targetEntityId && targetFieldId && 
          (targetEntityId !== connecting.sourceEntityId || targetFieldId !== connecting.sourceFieldId)) {
        console.log("Creating relation:", connecting.sourceEntityId, "->", targetEntityId);
        onAddRelation(
          connecting.sourceEntityId,
          connecting.sourceFieldId,
          targetEntityId,
          targetFieldId
        );
        toast.success("Relation created");
      } else if (targetEntityId === connecting.sourceEntityId && targetFieldId === connecting.sourceFieldId) {
        toast.error("Cannot connect a field to itself");
      }
    } else {
      console.log("No field connection point found at release point");
    }
    
    setConnecting(null);
  };

  // Calculate connection path for relations - UPDATED for better rendering on small screens
  const calculateConnectionPath = (relation: Relation) => {
    const sourceEntity = schema.entities.find(e => e.id === relation.sourceEntityId);
    const targetEntity = schema.entities.find(e => e.id === relation.targetEntityId);
    
    if (!sourceEntity || !targetEntity) return '';
    
    // Calculate source and target points
    const sourceX = sourceEntity.x + 250; // Right edge of source entity
    const sourceY = sourceEntity.y + 30 + (sourceEntity.fields.findIndex(f => f.id === relation.sourceFieldId) * 25);
    const targetX = targetEntity.x; // Left edge of target entity
    const targetY = targetEntity.y + 30 + (targetEntity.fields.findIndex(f => f.id === relation.targetFieldId) * 25);
    
    if (useChenNotation) {
      // For Chen notation, use straight orthogonal lines
      return `M ${sourceX} ${sourceY} L ${(sourceX + targetX) / 2} ${sourceY} L ${(sourceX + targetX) / 2} ${targetY} L ${targetX} ${targetY}`;
    } else {
      // For crow's foot notation, use improved orthogonal line routing
      const midX = (sourceX + targetX) / 2;
      
      // Use orthogonal lines with right angles for cleaner appearance
      return `M ${sourceX} ${sourceY} 
              L ${midX} ${sourceY} 
              L ${midX} ${targetY} 
              L ${targetX} ${targetY}`;
    }
  };
  
  // Calculate the marker for the relation type
  const getRelationMarker = (relation: Relation) => {
    if (useChenNotation) {
      return "url(#diamond-marker)";
    } else {
      switch (relation.relationType) {
        case 'one-to-one':
          return "url(#one-marker)";
        case 'one-to-many':
          return "url(#many-marker)";
        case 'many-to-many':
          return "url(#many-marker)";
        default:
          return "";
      }
    }
  };
  
  // Render relation lines - UPDATED for better styling
  const renderRelations = () => {
    return schema.relations.map(relation => {
      const path = calculateConnectionPath(relation);
      const markerEnd = getRelationMarker(relation);
      
      if (!path) return null;
      
      return (
        <g key={relation.id}>
          <path 
            d={path} 
            fill="none" 
            stroke="#9CA3AF"
            strokeWidth="2"
            className="connector-line" 
            markerEnd={markerEnd}
            strokeDasharray={relation.relationType === 'many-to-many' ? '5 5' : 'none'}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      );
    });
  };
  
  if (!useChenNotation) {
    return (
      <div 
        ref={containerRef}
        className="relative h-full w-full overflow-auto bg-[#f8f9fa]"
        onMouseDown={handleContainerMouseDown}
      >
        {/* Add zoom controls */}
        <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white shadow-md hover:bg-gray-100"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white shadow-md hover:bg-gray-100"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* SVG Container for relationship lines - IMPORTANT: Now inside the zoom/pan container */}
        <div 
          className="absolute min-h-full min-w-full"
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
        >
          <svg className="absolute" width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <defs>
              {/* UPDATED Markers for normal (crow's foot) notation */}
              <marker
                id="one-marker"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
              >
                <line x1="0" y1="0" x2="0" y2="10" stroke="black" strokeWidth="2" />
              </marker>
              <marker
                id="many-marker"
                viewBox="0 0 12 12"
                refX="0"
                refY="6"
                markerWidth="10"
                markerHeight="10"
                orient="auto"
              >
                <path d="M 0 0 L 12 6 L 0 12 L 0 0" fill="none" stroke="black" strokeWidth="2" strokeLinejoin="round" />
              </marker>
              
              {/* UPDATED Diamond marker for Chen notation */}
              <marker
                id="diamond-marker"
                viewBox="0 0 14 14"
                refX="7"
                refY="7"
                markerWidth="14"
                markerHeight="14"
                orient="auto"
              >
                <path d="M 0 7 L 7 0 L 14 7 L 7 14 Z" fill="white" stroke="black" strokeWidth="1.5" />
              </marker>
            </defs>
            
            {/* Connection line while connecting - UPDATED */}
            {connecting && (
              <path
                d={`M ${connecting.sourceX} ${connecting.sourceY} L ${connecting.targetX} ${connecting.targetY}`}
                stroke="black"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                strokeLinecap="round"
              />
            )}
            
            {/* Render all relation connections */}
            {renderRelations()}
          </svg>
          
          {/* Entity Boxes */}
          {schema.entities.map(entity => (
            <div
              id={`entity-${entity.id}`}
              key={entity.id}
              className={`absolute bg-white rounded-lg shadow-md border-2 transition-shadow duration-150 ${
                selectedEntityId === entity.id ? 'border-primary' : 'border-transparent'
              } w-64`}
              style={{
                transform: `translate(${entity.x}px, ${entity.y}px)`,
                zIndex: selectedEntityId === entity.id ? 10 : 1
              }}
              onMouseDown={(e) => handleEntityMouseDown(e, entity.id)}
            >
              {/* Entity Header */}
              <div 
                className={`px-3 py-2 font-medium text-sm cursor-grab active:cursor-grabbing rounded-t-lg ${
                  selectedEntityId === entity.id ? 'bg-primary/10' : 'bg-gray-50'
                }`}
              >
                {useChenNotation ? (
                  <div className="text-center border-2 border-black py-1 rounded-lg bg-white">
                    {entity.name}
                  </div>
                ) : (
                  <div>{entity.name}</div>
                )}
              </div>
              
              {/* Entity Fields */}
              <div className="px-2 py-1 bg-white rounded-b-lg">
                {entity.fields.map(field => (
                  <div key={field.id} className="flex items-center justify-between text-sm py-1 px-1 border-b last:border-0">
                    <div className="flex items-center gap-1">
                      {field.isPrimaryKey && (
                        <span className="text-amber-500">
                          <Key className="h-3 w-3" />
                        </span>
                      )}
                      <span>{field.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {field.type}
                      </span>
                    </div>
                    
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 field-connector"
                      data-entity-id={entity.id}
                      data-field-id={field.id}
                      onMouseDown={(e) => handleFieldConnectStart(e, entity.id, field.id)}
                    >
                      <span className="text-xs text-gray-500">⊕</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Chen notation view
  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full"
      onMouseDown={handleContainerMouseDown}
    >
      {/* Add zoom controls for Chen notation view */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white shadow-md hover:bg-gray-100"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-white shadow-md hover:bg-gray-100"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Container that scales and pans */}
      <div 
        className="absolute min-h-full min-w-full"
        style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
      >
        <svg className="w-full h-full">
          {/* Render entities as rectangles */}
          {schema.entities.map((entity) => (
            <g
              key={entity.id}
              transform={`translate(${entity.x}, ${entity.y})`}
              onClick={() => onEntitySelect(entity.id)}
              className={`cursor-pointer ${selectedEntityId === entity.id ? "stroke-primary" : "stroke-black"}`}
            >
              <rect width="120" height="50" fill="white" stroke="black" />
              <text x="60" y="25" textAnchor="middle" alignmentBaseline="middle" fontSize="12">
                {entity.name}
              </text>
            </g>
          ))}

          {/* Render attributes as ovals and connect them to entities */}
          {schema.entities.map((entity) =>
            entity.fields.map((field, index) => {
              const attributeX = entity.x + 150;
              const attributeY = entity.y + index * 30;

              return (
                <g key={field.id}>
                  {/* Line connecting the attribute to the entity */}
                  <line
                    x1={entity.x + 120} // Right edge of the rectangle
                    y1={entity.y + 25} // Center of the rectangle
                    x2={attributeX} // Center of the oval
                    y2={attributeY + 15} // Center of the oval
                    stroke="black"
                  />
                  {/* Attribute as an oval */}
                  <g transform={`translate(${attributeX}, ${attributeY})`}>
                    <ellipse cx="60" cy="15" rx="60" ry="15" fill="white" stroke="black" />
                    <text x="60" y="15" textAnchor="middle" alignmentBaseline="middle" fontSize="10">
                      {field.name}
                    </text>
                  </g>
                </g>
              );
            })
          )}

          {/* Render relations as diamonds */}
          {schema.relations.map((relation) => {
            const sourceEntity = schema.entities.find((e) => e.id === relation.sourceEntityId);
            const targetEntity = schema.entities.find((e) => e.id === relation.targetEntityId);

            if (!sourceEntity || !targetEntity) return null;

            const midX = (sourceEntity.x + targetEntity.x) / 2;
            const midY = (sourceEntity.y + targetEntity.y) / 2;

            return (
              <g key={relation.id}>
                <polygon
                  points={`${midX - 20},${midY} ${midX},${midY - 20} ${midX + 20},${midY} ${midX},${midY + 20}`}
                  fill="white"
                  stroke="black"
                />
                <text x={midX} y={midY} textAnchor="middle" alignmentBaseline="middle" fontSize="10">
                  {relation.relationType}
                </text>
                <line
                  x1={sourceEntity.x + 60}
                  y1={sourceEntity.y + 25}
                  x2={midX}
                  y2={midY}
                  stroke="black"
                />
                <line
                  x1={targetEntity.x + 60}
                  y1={targetEntity.y + 25}
                  x2={midX}
                  y2={midY}
                  stroke="black"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default DiagramView;
